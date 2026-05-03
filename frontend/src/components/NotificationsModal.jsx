import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, Bell, UserPlus, UserMinus, Trash2, CheckCircle2, Ban } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

const notifIcon = {
  join_request: <UserPlus className="w-4 h-4 text-amber-400" />,
  user_joined: <UserPlus className="w-4 h-4 text-emerald-400" />,
  user_left: <UserMinus className="w-4 h-4 text-gray-400" />,
  activity_disbanded: <Trash2 className="w-4 h-4 text-red-400" />,
  request_approved: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  request_rejected: <Ban className="w-4 h-4 text-red-400" />,
  new_message: <Bell className="w-4 h-4 text-sky-400" />,
};

export default function NotificationsModal({ isOpen, onClose, onOpenChat }) {
  const [userData, setUserData] = useState(null);
  const [tab, setTab] = useState('all'); // 'all' | 'requests'

  useEffect(() => {
    const data = localStorage.getItem("kinnect_user");
    if (data) setUserData(JSON.parse(data));
  }, []);

  // All notifications
  const { data: notifsData, mutate: mutateNotifs } = useSWR(
    isOpen && userData ? `/api/backend/activities/notifications?user_id=${userData.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  // Pending join requests (for hosts)
  const { data: requestsData, mutate: mutateRequests } = useSWR(
    isOpen && userData ? `/api/backend/activities/requests/me?user_id=${userData.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const handleRespond = async (requestId, action) => {
    try {
      await fetch(`/api/backend/activities/requests/${requestId}/${action}`, { method: 'POST' });
      mutateRequests();
      mutateNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const markRead = async (notifId) => {
    try {
      await fetch(`/api/backend/activities/notifications/${notifId}/read`, { method: 'POST' });
      mutateNotifs();
    } catch(e) {}
  };

  const deleteNotif = async (e, notifId) => {
    e.stopPropagation(); // Don't trigger the notification click
    try {
      await fetch(`/api/backend/activities/notifications/${notifId}`, { method: 'DELETE' });
      mutateNotifs();
    } catch(e) {}
  };

  const notifications = notifsData?.notifications || [];
  const requests = requestsData?.requests || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

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
                <Bell className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadCount}</span>
                )}
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button 
                onClick={() => setTab('all')} 
                className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'all' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-400'}`}
              >
                All Activity
              </button>
              <button 
                onClick={() => setTab('requests')} 
                className={`flex-1 py-3 text-sm font-semibold transition relative ${tab === 'requests' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-400'}`}
              >
                Join Requests
                {requests.length > 0 && (
                  <span className="absolute top-2 right-4 bg-amber-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full">{requests.length}</span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tab === 'all' ? (
                // All notifications view
                !notifsData ? (
                  <div className="text-center text-gray-500 py-10">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No notifications yet.</p>
                    <p className="text-xs mt-1">You'll see updates here when people join your activities.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-2">
                      <button 
                        onClick={async () => {
                          if(confirm("Clear all notifications?")) {
                            try {
                              await fetch(`/api/backend/activities/notifications/clear-all?user_id=${userData.id}`, { method: 'POST' });
                              mutateNotifs();
                            } catch(e) {}
                          }
                        }}
                        className="text-[10px] text-gray-500 hover:text-red-400 flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-lg transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All</span>
                      </button>
                    </div>
                    {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => {
                        if (!notif.is_read) markRead(notif.id);
                        if (notif.type === 'new_message' && onOpenChat) {
                          onOpenChat(notif.activity_id);
                        }
                      }}
                      className={`flex items-start space-x-3 p-3 rounded-xl border transition cursor-pointer ${
                        notif.is_read 
                          ? 'bg-white/[0.02] border-white/5 opacity-60' 
                          : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="mt-0.5 p-2 bg-white/5 rounded-lg">
                        {notifIcon[notif.type] || <Bell className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200">{notif.message}</p>
                        <span className="text-[10px] text-gray-500">{timeAgo(notif.created_at)}</span>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                        )}
                        <button 
                          onClick={(e) => deleteNotif(e, notif.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
                )
              ) : (
                // Join Requests view (for hosts)
                !requestsData ? (
                  <div className="text-center text-gray-500 py-10">Loading...</div>
                ) : requests.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No pending requests.</p>
                  </div>
                ) : (
                  requests.map((req) => (
                    <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold">{req.user_name || "User"} wants to join</p>
                        <p className="text-xs text-gray-400">{req.activity_title}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleRespond(req.id, 'approve')} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 transition">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleRespond(req.id, 'reject')} className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

