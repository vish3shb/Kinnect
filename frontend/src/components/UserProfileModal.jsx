import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Check, Clock, UserCheck, MapPin, Sparkles } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

export default function UserProfileModal({ isOpen, onClose, userId }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('kinnect_user');
    if (data) setCurrentUser(JSON.parse(data));
  }, []);

  const { data: profile, mutate } = useSWR(
    isOpen && userId && currentUser
      ? `/api/backend/friends/users/${userId}?current_user_id=${currentUser.id}`
      : null,
    fetcher
  );

  const handleSendRequest = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/backend/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: currentUser.id, addressee_id: userId }),
      });
      if (res.ok) mutate();
      else { const err = await res.json(); alert(err.detail || 'Error sending request'); }
    } catch (e) { console.error(e); }
  };

  const handleRespondRequest = async (action) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/backend/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, requester_id: userId, action }),
      });
      if (res.ok) mutate();
      else { const err = await res.json(); alert(err.detail || 'Error responding'); }
    } catch (e) { console.error(e); }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const interests = profile?.interests
    ? profile.interests.split(',').map(i => i.trim()).filter(Boolean)
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300]"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}
          />

          {/* Modal — centred with flexbox on a wrapper div, NOT transform */}
          <div className="fixed inset-0 z-[301] flex items-center justify-center px-5 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="w-full max-w-sm pointer-events-auto overflow-hidden rounded-3xl"
              style={{
                background: 'linear-gradient(175deg, rgba(16,16,22,0.99) 0%, rgba(9,9,13,1) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
              }}
            >
              {/* ── Banner gradient ── */}
              <div
                className="relative h-28 flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.45) 0%, rgba(99,102,241,0.3) 50%, rgba(56,189,248,0.25) 100%)',
                }}
              >
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10"
                  style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Subtle grid pattern */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, transparent 1px, transparent 24px, rgba(255,255,255,0.1) 24px), repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, transparent 1px, transparent 24px, rgba(255,255,255,0.1) 24px)',
                  }}
                />
              </div>

              {/* ── Avatar row — sits below the banner ── */}
              <div className="px-6 pb-6">
                {/* Avatar overlapping banner */}
                <div className="flex items-end justify-between -mt-10 mb-4 relative z-10">
                  <div
                    className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      padding: '2px',
                      boxShadow: '0 4px 20px rgba(139,92,246,0.35), 0 0 0 3px rgba(9,9,13,1)',
                    }}
                  >
                    <div className="w-full h-full rounded-[14px] overflow-hidden flex items-center justify-center"
                      style={{ background: 'rgba(30,20,50,0.9)' }}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-white">{initials}</span>
                      )}
                    </div>
                  </div>

                  {/* Friendship status badge */}
                  {profile && (
                    <div
                      className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                      style={
                        profile.friendship_status === 'friends'
                          ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }
                      }
                    >
                      {profile.friendship_status === 'friends' ? '● Friends' : profile.friendship_status === 'request_sent' ? 'Requested' : profile.friendship_status === 'request_received' ? 'Wants to connect' : 'Not connected'}
                    </div>
                  )}
                </div>

                {/* Loading skeleton */}
                {!profile && (
                  <div className="animate-pulse space-y-3 mt-2">
                    <div className="h-6 bg-white/8 rounded-xl w-2/3" />
                    <div className="h-4 bg-white/5 rounded-xl w-1/3" />
                    <div className="h-16 bg-white/5 rounded-2xl w-full mt-4" />
                  </div>
                )}

                {/* Profile data */}
                {profile && (
                  <>
                    {/* Name + hall */}
                    <h2 className="text-xl font-black text-white leading-tight mb-1">{profile.name}</h2>
                    {profile.hall_of_residence && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{profile.hall_of_residence}</span>
                      </div>
                    )}

                    {/* Interests */}
                    {interests.length > 0 && (
                      <div className="mb-5">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Interests</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 text-xs font-semibold rounded-full"
                              style={{
                                background: 'rgba(139,92,246,0.1)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                color: '#c4b5fd',
                              }}
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    {currentUser && currentUser.id !== userId && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                        {profile.friendship_status === 'none' && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSendRequest}
                            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-white"
                            style={{
                              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                              boxShadow: '0 4px 18px rgba(139,92,246,0.35)',
                            }}
                          >
                            <UserPlus className="w-4 h-4" /> Add Friend
                          </motion.button>
                        )}
                        {profile.friendship_status === 'request_sent' && (
                          <button
                            disabled
                            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
                          >
                            <Clock className="w-4 h-4" /> Request Sent
                          </button>
                        )}
                        {profile.friendship_status === 'request_received' && (
                          <div className="flex gap-2">
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={() => handleRespondRequest('accept')}
                              className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}
                            >
                              <Check className="w-4 h-4" /> Accept
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={() => handleRespondRequest('decline')}
                              className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
                            >
                              Decline
                            </motion.button>
                          </div>
                        )}
                        {profile.friendship_status === 'friends' && (
                          <button
                            disabled
                            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}
                          >
                            <UserCheck className="w-4 h-4" /> Friends
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
