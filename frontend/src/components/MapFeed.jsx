import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useSWR from 'swr';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons based on activity type using emojis for a modern look
const getIcon = (type) => {
  const emojiMap = {
    running: '🏃',
    swimming: '🏊',
    travel: '🚗',
    study: '📚',
    gaming: '🎮',
    sports: '⚽',
    general: '📍'
  };
  const emoji = emojiMap[type] || '📍';
  
  return new L.divIcon({
    html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); transform: translateY(-50%);">${emoji}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const sosIcon = new L.divIcon({
  html: `<div style="background-color: rgba(239, 68, 68, 0.3); border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; animation: pulse 1s infinite;"><div style="background-color: rgb(239, 68, 68); border-radius: 50%; width: 20px; height: 20px; border: 2px solid white; box-shadow: 0 0 10px red;"></div></div>
<style>
@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
</style>`,
  className: '',
  iconSize: [50, 50],
  iconAnchor: [25, 25]
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const fetcher = (url) => fetch(url).then(res => res.json());

export default function MapFeed({ activities }) {
  const defaultCenter = [26.5123, 80.2329]; // IITK
  const { data: sosData } = useSWR('/api/backend/sos/active', fetcher, { refreshInterval: 5000 });

  let center = defaultCenter;
  let zoom = 15;
  
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('sos') === 'true' && sosData?.emergencies?.length > 0) {
      const latestSos = sosData.emergencies[sosData.emergencies.length - 1];
      center = [latestSos.lat, latestSos.lon];
      zoom = 17;
    }
  }

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={15} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {activities?.map((activity) => (
          <Marker 
            key={activity.id} 
            position={[activity.lat, activity.lon]}
            icon={getIcon(activity.activity_type)}
          >
            <Popup className="rounded-xl overflow-hidden">
              <div className="p-1">
                <h3 className="font-bold text-sm mb-1">{activity.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{activity.location_name}</p>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span>{activity.current_capacity}/{activity.max_capacity} joined</span>
                  <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">{activity.activity_type}</span>
                </div>
                <button 
                  className="w-full bg-accent text-white text-xs py-1.5 rounded-lg font-medium hover:bg-accent/90"
                  onClick={() => alert(`Redirect to join ${activity.title}`)}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        {sosData?.emergencies?.map((emergency) => (
          <Marker 
            key={emergency.id} 
            position={[emergency.lat, emergency.lon]}
            icon={sosIcon}
          >
            <Popup className="rounded-xl overflow-hidden">
              <div className="p-2 text-center">
                <h3 className="font-bold text-red-600 mb-1 flex items-center justify-center"><span className="mr-1">🆘</span> EMERGENCY</h3>
                <p className="text-sm font-medium mb-1">{emergency.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
