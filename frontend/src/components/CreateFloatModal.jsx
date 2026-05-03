import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false });

export default function CreateFloatModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [locationName, setLocationName] = useState('');
  const [mapPosition, setMapPosition] = useState({ lat: 26.5123, lng: 80.2329 });
  const [capacity, setCapacity] = useState(5);
  const [activityType, setActivityType] = useState('general');
  const [joinMode, setJoinMode] = useState('open');
  const [eventTime, setEventTime] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dropdown states
  const [typeOpen, setTypeOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const spring = { type: "spring", stiffness: 300, damping: 30 };

  const playTick = () => {
    try {
      if (!window.audioCtx) {
        window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (window.audioCtx.state === 'suspended') {
        window.audioCtx.resume();
      }
      const oscillator = window.audioCtx.createOscillator();
      const gainNode = window.audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, window.audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(10, window.audioCtx.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.3, window.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioCtx.currentTime + 0.05);
      
      oscillator.connect(gainNode);
      gainNode.connect(window.audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(window.audioCtx.currentTime + 0.05);
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
      setEventTime(localISOTime);
    }
  }, [isOpen]);

  const handleCapacityChange = (delta) => {
    const newVal = Math.max(2, Math.min(50, capacity + delta));
    if (newVal !== capacity) {
      setCapacity(newVal);
      playTick();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userStr = localStorage.getItem("kinnect_user");
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user) {
      alert("Please complete onboarding first.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/backend/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_id: user.id,
          title: title,
          description: desc,
          activity_type: activityType,
          join_mode: joinMode,
          location_name: locationName,
          lat: mapPosition.lat,
          lon: mapPosition.lng,
          event_time: new Date(eventTime).toISOString(),
          tier_category: 2,
          max_capacity: parseInt(capacity),
          ttl_hours: 2
        })
      });

      if (res.ok) {
        setTitle(''); setDesc(''); setLocationName('');
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to float activity: ${errorData.detail || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full max-w-md bg-background/80 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 flex flex-col max-h-[90vh] pointer-events-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Float Activity</h2>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-gray-300" /></button>
              </div>

            <form onSubmit={handleSubmit} className="space-y-5 flex-1 overflow-y-auto pr-2 scrollbar-hide">
              <div>
                <label className="block text-[10px] font-bold text-accent mb-1.5 uppercase tracking-widest">Title</label>
                <input required value={title} onChange={e=>setTitle(e.target.value)} type="text" placeholder="Late night tea..." className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 focus:border-accent focus:bg-white/10 transition-all outline-none shadow-inner" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-accent mb-1.5 uppercase tracking-widest">Description</label>
                <textarea required value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Need 2 people for a quick chat..." className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 h-24 focus:border-accent focus:bg-white/10 transition-all outline-none shadow-inner resize-none" />
              </div>

              <div className="flex gap-4 relative z-20">
                <div className="flex-1 relative">
                  <label className="block text-[10px] font-bold text-accent mb-1.5 uppercase tracking-widest">Type</label>
                  <div 
                    onClick={() => { setTypeOpen(!typeOpen); setJoinOpen(false); }}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 cursor-pointer flex justify-between items-center hover:bg-white/10 transition-colors"
                  >
                    <span className="capitalize text-sm font-semibold">{activityType}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  <AnimatePresence>
                    {typeOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={spring}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[100]"
                      >
                        {['general', 'running', 'swimming', 'travel', 'study'].map(t => (
                          <div 
                            key={t}
                            onClick={() => { setActivityType(t); setTypeOpen(false); }}
                            className="px-4 py-3 hover:bg-white/10 cursor-pointer capitalize transition-colors text-sm font-medium"
                          >
                            {t}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 relative">
                  <label className="block text-[10px] font-bold text-accent mb-1.5 uppercase tracking-widest">Join Mode</label>
                  <div 
                    onClick={() => { setJoinOpen(!joinOpen); setTypeOpen(false); }}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 cursor-pointer flex justify-between items-center hover:bg-white/10 transition-colors"
                  >
                    <span className="text-sm font-semibold">{joinMode === 'open' ? 'Open' : 'Approval'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  <AnimatePresence>
                    {joinOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={spring}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#09090b] border border-white/10 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[100]"
                      >
                        <div onClick={() => { setJoinMode('open'); setJoinOpen(false); }} className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors text-sm font-medium">Open (Quick Join)</div>
                        <div onClick={() => { setJoinMode('approval'); setJoinOpen(false); }} className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors text-sm font-medium">Ask to Join</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-accent mb-1.5 uppercase tracking-widest">Event Time</label>
                  <input required value={eventTime} onChange={e=>{setEventTime(e.target.value); playTick();}} type="datetime-local" className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 focus:border-accent focus:bg-white/10 transition-all outline-none text-sm font-semibold text-white date-picker-custom" style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-accent mb-1.5 uppercase tracking-widest">Capacity</label>
                  <div className="flex items-center bg-white/5 border border-white/5 rounded-2xl p-1.5 w-32 h-[52px] justify-between">
                    <button type="button" onClick={() => handleCapacityChange(-1)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 text-2xl font-medium transition-colors text-white hover:scale-105 active:scale-95">-</button>
                    <span className="font-bold text-lg flex-1 text-center text-white">{capacity}</span>
                    <button type="button" onClick={() => handleCapacityChange(1)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 text-2xl font-medium transition-colors text-white hover:scale-105 active:scale-95">+</button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-accent mb-1.5 uppercase tracking-widest">Location Name</label>
                <input required value={locationName} onChange={e=>setLocationName(e.target.value)} type="text" placeholder="Hall 2 Canteen" className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 focus:border-accent focus:bg-white/10 transition-all outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-accent mb-1.5 uppercase tracking-widest">Pin Location on Map</label>
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading} type="submit" 
                className="w-full mt-6 bg-gradient-to-r from-accent to-sky-500 py-4 rounded-2xl font-black tracking-wide text-white shadow-[0_5px_25px_rgba(139,92,246,0.5)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.7)] transition-all"
              >
                {loading ? "FLOATING..." : "FLOAT ACTIVITY"}
              </motion.button>
            </form>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
