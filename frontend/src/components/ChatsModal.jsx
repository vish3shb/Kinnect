import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Users, User, Check } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

export default function ChatsModal({ isOpen, onClose, onOpenActivityChat, onOpenDM }) {
  const [userData, setUserData] = useState(null);
  const [tab, setTab] = useState('communities'); // 'communities' | 'friends'

  useEffect(() => {
    const data = localStorage.getItem("kinnect_user");
    if (data) setUserData(JSON.parse(data));
  }, []);

  const { data: activitiesData, mutate: mutateActivities } = useSWR(
    isOpen && tab === 'communities' && userData ? `/api/backend/activities/me?user_id=${userData.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: friendsData, mutate: mutateFriends } = useSWR(
    isOpen && tab === 'friends' && userData ? `/api/backend/friends/me?user_id=${userData.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const handleRespondRequest = async (requesterId, action) => {
    try {
      const res = await fetch(`/api/backend/friends/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.id,
          requester_id: requesterId,
          action: action
        })
      });
      if (res.ok) {
        mutateFriends();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const communities = activitiesData ? [...(activitiesData.hosted || []), ...(activitiesData.joined || [])] : [];
  
  // Filter out past/disbanded for Communities chat list, or show them if they are still within the 2hr message window (for now just show active)
  const activeCommunities = communities.filter(act => {
    const expiresAtUTC = act.expires_at.endsWith('Z') ? act.expires_at : `${act.expires_at}Z`;
    return new Date(expiresAtUTC) > new Date() && act.is_active !== false;
  });

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
                <MessageSquare className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-lg">Chats</h3>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex border-b border-white/10">
              <button 
                onClick={() => setTab('communities')} 
                className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center ${tab === 'communities' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-400'}`}
              >
                <Users className="w-4 h-4 mr-2" /> Communities
              </button>
              <button 
                onClick={() => setTab('friends')} 
                className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center ${tab === 'friends' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-400'}`}
              >
                <User className="w-4 h-4 mr-2" /> Friends
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {tab === 'communities' && (
                <>
                  {!activitiesData ? (
                    <div className="text-center text-gray-500 py-10">Loading...</div>
                  ) : activeCommunities.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">You haven't joined any active communities yet.</div>
                  ) : (
                    activeCommunities.map((act) => (
                      <div key={act.id} onClick={() => onOpenActivityChat && onOpenActivityChat(act.id)} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                        <div>
                          <h4 className="font-bold text-base text-white">{act.title}</h4>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{act.location_name}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center border border-accent/30">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {tab === 'friends' && (
                <>
                  {!friendsData ? (
                    <div className="text-center text-gray-500 py-10">Loading...</div>
                  ) : (
                    <>
                      {friendsData.pending_requests && friendsData.pending_requests.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Friend Requests</h4>
                          <div className="space-y-3">
                            {friendsData.pending_requests.map(req => (
                              <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {req.avatar_url ? (
                                    <img src={req.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold">
                                      {req.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-white">{req.name}</p>
                                    <p className="text-[10px] text-gray-400">{req.hall_of_residence}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleRespondRequest(req.id, 'accept')} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleRespondRequest(req.id, 'decline')} className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Friends</h4>
                        {friendsData.friends && friendsData.friends.length > 0 ? (
                          <div className="space-y-3">
                            {friendsData.friends.map(friend => (
                              <div key={friend.id} onClick={() => onOpenDM && onOpenDM(friend)} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                                <div className="flex items-center space-x-3">
                                  {friend.avatar_url ? (
                                    <img src={friend.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold">
                                      {friend.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-white">{friend.name}</p>
                                    <p className="text-[10px] text-gray-400">{friend.hall_of_residence}</p>
                                  </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                                  <MessageSquare className="w-4 h-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-6 text-sm">
                            <p>No friends yet.</p>
                            <p className="text-xs mt-1">Tap on a profile in the live feed to send a friend request!</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
