import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Trash2 } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

export default function MyActivitiesModal({ isOpen, onClose, onOpenChat, onCloseChat }) {
  const [userData, setUserData] = useState(null);
  const [tab, setTab] = useState('hosting'); // 'hosting' | 'joined'

  useEffect(() => {
    const data = localStorage.getItem("kinnect_user");
    if (data) setUserData(JSON.parse(data));
  }, []);

  const { data, mutate } = useSWR(
    isOpen && userData ? `/api/backend/activities/me?user_id=${userData.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const handleDisband = async (activityId) => {
    if(confirm("Are you sure you want to disband this activity?")) {
      try {
        await fetch(`/api/backend/activities/${activityId}`, { method: 'DELETE' });
        if (onCloseChat) onCloseChat(activityId);
        mutate();
      } catch(e) {
        console.error(e);
      }
    }
  };

  const handleLeave = async (activityId) => {
    if(confirm("Are you sure you want to leave this activity?")) {
      try {
        const res = await fetch(`/api/backend/activities/${activityId}/leave?user_id=${userData.id}`, { method: 'POST' });
        if (res.ok) {
          alert("You have left the activity.");
          if (onCloseChat) onCloseChat(activityId);
          mutate();
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.detail || "Failed to leave activity. Please try again.");
        }
      } catch(e) {
        console.error(e);
        alert("Network error. Please check your connection.");
      }
    }
  };

  const activities = tab === 'hosting' ? data?.hosted : data?.joined;
  const sortedActivities = activities ? [...activities].sort((a, b) => {
    const dateA = new Date(a.created_at || a.event_time);
    const dateB = new Date(b.created_at || b.event_time);
    return dateB - dateA;
  }) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[#0f0f13] rounded-t-3xl border-t border-white/10 z-50 flex flex-col shadow-[0_-10px_40px_rgba(139,92,246,0.1)]"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-lg">My Activities</h3>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex border-b border-white/10">
              <button 
                onClick={() => setTab('hosting')} 
                className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'hosting' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-400'}`}
              >
                My Floats
              </button>
              <button 
                onClick={() => setTab('joined')} 
                className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'joined' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-400'}`}
              >
                Joined & Past
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!data ? (
                <div className="text-center text-gray-500 py-10">Loading...</div>
              ) : sortedActivities?.length === 0 ? (
                <div className="text-center text-gray-500 py-10">No activities found.</div>
              ) : (
                sortedActivities.map((act) => {
                  // Append 'Z' to naive UTC strings from backend so browser parses them properly as UTC!
                  const expiresAtUTC = act.expires_at.endsWith('Z') ? act.expires_at : `${act.expires_at}Z`;
                  const eventTimeUTC = (act.event_time || act.created_at).endsWith('Z') ? (act.event_time || act.created_at) : `${act.event_time || act.created_at}Z`;
                  
                  const isExpired = new Date(expiresAtUTC) < new Date() || act.is_active === false;
                  return (
                    <div key={act.id} className={`bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col transition-opacity ${isExpired ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{act.title}</h4>
                          <p className="text-xs text-gray-400 mb-2">{act.location_name} • {new Date(eventTimeUTC).toLocaleString()}</p>
                          {isExpired ? (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full mt-1 inline-block border border-red-500/30">Past or Disbanded</span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full mt-1 inline-block border border-emerald-500/30">Active</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => onOpenChat && onOpenChat(act.id)} className="px-3 py-1.5 text-xs font-bold text-accent bg-accent/10 border border-accent/30 hover:bg-accent hover:text-white rounded-lg transition-colors flex items-center shadow-sm">
                            Open Chat
                          </button>
                          <div className="flex gap-2 mt-auto">
                            {tab === 'hosting' && !isExpired && (
                              <button onClick={() => handleDisband(act.id)} className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                                Disband
                              </button>
                            )}
                            {tab === 'joined' && !isExpired && (
                              <button onClick={() => handleLeave(act.id)} className="px-3 py-1.5 text-xs font-semibold text-gray-300 bg-white/10 border border-white/20 hover:bg-white/20 rounded-lg transition-colors">
                                Leave
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
