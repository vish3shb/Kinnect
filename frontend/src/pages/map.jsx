import React, { useState, useEffect } from 'react';
import { Home, PlusCircle, User, Map as MapIcon, Bell, ArrowLeft, Activity } from 'lucide-react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

const MapFeed = dynamic(() => import('../components/MapFeed'), { ssr: false });
import NotificationsModal from '../components/NotificationsModal';
import MyActivitiesModal from '../components/MyActivitiesModal';
import ProfileModal from '../components/ProfileModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function MapPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMyActivitiesOpen, setIsMyActivitiesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { data: activeUsersData } = useSWR('/api/backend/feed/active-users', fetcher, { refreshInterval: 60000 });

  useEffect(() => {
    const data = localStorage.getItem("kinnect_user");
    if (data) setUserData(JSON.parse(data));
    else router.push('/');
  }, [router]);

  const { data, error } = useSWR(
    userData ? `/api/backend/feed/?user_lat=26.5123&user_lon=80.2329&user_hall=${userData.hall_of_residence}&user_id=${userData.id}&activity_type=all` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  return (
    <div className="h-screen w-full relative bg-background max-w-md mx-auto border-x border-white/5 flex flex-col">
      <header className="px-4 py-4 absolute top-0 w-full z-20 flex items-center justify-between pointer-events-none">
        <button onClick={() => router.push('/dashboard')} className="p-3 bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-white pointer-events-auto hover:bg-white/10 transition-colors shadow-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center bg-black/80 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 pointer-events-auto shadow-lg">
          <span className="font-bold text-sm text-white tracking-wide">Campus Map</span>
          {activeUsersData && (
            <span className="text-[9px] font-medium text-emerald-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              {activeUsersData.count} Active Users
            </span>
          )}
        </div>
        <div className="pointer-events-auto">
          {userData ? (
            <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/50 text-accent font-bold text-sm overflow-hidden hover:scale-105 transition-transform shadow-lg backdrop-blur-md">
              {userData.avatar_url ? <img src={userData.avatar_url} alt="profile" className="w-full h-full object-cover" /> : (userData.name?.charAt(0) || "U")}
            </button>
          ) : (
            <div className="w-10 h-10"></div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full h-full relative z-0">
        {!data && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {/* Only render MapFeed if we have data to ensure markers are ready */}
        {data && <MapFeed activities={data.feed} />}
      </main>

      {/* Premium Floating Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card rounded-3xl p-1.5 flex justify-between items-center z-30 shadow-[0_20px_40px_rgba(0,0,0,0.8)] border border-white/10 bg-black/40 backdrop-blur-2xl">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => router.push('/dashboard')} className="p-3 text-gray-500 hover:text-white transition-colors"><Home className="w-6 h-6" /></motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-3 text-white"><MapIcon className="w-6 h-6" /></motion.button>
        
        <div>
          <motion.button 
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => router.push('/dashboard?create=true')}
            className="bg-gradient-to-tr from-accent to-sky-400 p-4 rounded-full text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] block relative z-10"
          >
            <PlusCircle className="w-6 h-6" />
          </motion.button>
        </div>
        
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsNotificationsOpen(true)} className="p-3 text-gray-500 hover:text-white transition-colors"><Bell className="w-6 h-6" /></motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsMyActivitiesOpen(true)} className="p-3 text-gray-500 hover:text-white transition-colors"><Activity className="w-6 h-6" /></motion.button>
      </div>

      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <MyActivitiesModal isOpen={isMyActivitiesOpen} onClose={() => setIsMyActivitiesOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => {
        setIsProfileOpen(false);
        const data = localStorage.getItem("kinnect_user");
        if (data) setUserData(JSON.parse(data));
      }} />
    </div>
  );
}
