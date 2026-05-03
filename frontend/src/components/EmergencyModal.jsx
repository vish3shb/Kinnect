import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/router';

export default function EmergencyModal({ isOpen, onClose }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('kinnect_user') || '{}');
      
      // Get real location if available
      let lat = 26.5123, lon = 80.2329;
      if ("geolocation" in navigator) {
        try {
          const position = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
          lat = position.coords.latitude;
          lon = position.coords.longitude;
        } catch(e) {}
      }
      
      const res = await fetch('/api/backend/sos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userData.id || 'anonymous',
          description,
          lat,
          lon
        })
      });
      if (res.ok) {
        alert("SOS Broadcasted to nearby users!");
        setDescription('');
        onClose();
        router.push('/map?sos=true');
      }
    } catch (err) {
      console.error("SOS failed", err);
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
            className="fixed inset-0 bg-red-950/80 backdrop-blur-md z-40"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 px-4">
            <motion.div
              transition={{ type: "spring", stiffness: 400, damping: 25 }} 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-background/90 backdrop-blur-3xl rounded-3xl border border-red-500/20 shadow-[0_20px_60px_rgba(239,68,68,0.2)] p-7 flex flex-col pointer-events-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center text-red-500">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mr-3 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Emergency</h2>
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-gray-300" /></button>
              </div>

              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                This will immediately notify all Kinnect users in your vicinity and campus security with your exact location.
              </p>

              <form onSubmit={handleBroadcast} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-red-400 mb-1.5 uppercase tracking-widest">Describe Situation</label>
                  <textarea 
                    required 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Medical emergency at Hall 2..." 
                    className="w-full bg-red-950/20 border border-red-500/20 rounded-2xl px-4 py-3.5 h-28 focus:border-red-500 focus:bg-red-950/30 transition-all outline-none text-white shadow-inner resize-none font-medium text-sm" 
                  />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || !description} 
                  type="submit" 
                  className="w-full mt-2 bg-gradient-to-r from-red-600 to-red-500 py-4 rounded-2xl font-black tracking-widest text-white shadow-[0_5px_25px_rgba(239,68,68,0.4)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.6)] disabled:opacity-50 transition-all"
                >
                  {loading ? "BROADCASTING..." : "BROADCAST SOS"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
