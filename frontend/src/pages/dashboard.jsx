import React, { useState, useEffect } from 'react';
import { Home, PlusCircle, User, Activity, Map, Bell, AlertTriangle, MessageSquare, Calendar, Search, SlidersHorizontal, Play, Book, Dribbble, Plane, Dumbbell, Compass, Sparkles } from 'lucide-react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { playPop, playTick } from '../utils/feedback';
import ActivityCard from '../components/ActivityCard';
import CreateFloatModal from '../components/CreateFloatModal';
import EmergencyModal from '../components/EmergencyModal';
import LiveChatDrawer from '../components/LiveChatDrawer';
import NotificationsModal from '../components/NotificationsModal';
import MyActivitiesModal from '../components/MyActivitiesModal';
import ProfileModal from '../components/ProfileModal';
import UserProfileModal from '../components/UserProfileModal';
import ChatsModal from '../components/ChatsModal';
import CalendarModal from '../components/CalendarModal';
import DirectMessageDrawer from '../components/DirectMessageDrawer';
import FilterModal from '../components/FilterModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [currentFilters, setCurrentFilters] = useState({
    distance: 'all',
    joinMode: 'all',
    timeOfDay: 'all',
    date: ''
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [chatActivityId, setChatActivityId] = useState(null);
  const [userLoc, setUserLoc] = useState({ lat: 26.5123, lng: 80.2329 }); // Default to IITK
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMyActivitiesOpen, setIsMyActivitiesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isChatsOpen, setIsChatsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch active users count
  const { data: activeUsersData } = useSWR('/api/backend/feed/active-users', fetcher, { refreshInterval: 60000 });

  // Poll for unread notification count (always, even when modal is closed)
  const { data: unreadNotifsData } = useSWR(
    userData ? `/api/backend/activities/notifications?user_id=${userData.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );
  const unreadCount = (unreadNotifsData?.notifications || []).filter(n => !n.is_read).length;
  // Unread chat notifications (type contains 'chat' or 'message')
  const hasUnreadChat = (unreadNotifsData?.notifications || []).some(
    n => !n.is_read && (n.type?.includes('chat') || n.type?.includes('message') || n.type?.includes('text'))
  );


  useEffect(() => {
    const data = localStorage.getItem("kinnect_user");
    if (data) setUserData(JSON.parse(data));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLoc({ lat: position.coords.latitude, lng: position.coords.longitude });
      }, (error) => {
        console.error("Location error", error);
      });
    }
  }, []);

  // Build query string dynamically based on filters
  let feedUrl = `/api/backend/feed/?user_lat=${userLoc.lat}&user_lon=${userLoc.lng}&user_hall=${userData?.hall_of_residence || ''}&user_id=${userData?.id || ''}&activity_type=${filterType}`;
  
  if (currentFilters.joinMode !== 'all') feedUrl += `&join_mode=${currentFilters.joinMode}`;
  if (currentFilters.date) feedUrl += `&event_date=${currentFilters.date}`;
  if (currentFilters.timeOfDay !== 'all') feedUrl += `&time_of_day=${currentFilters.timeOfDay}`;
  
  if (currentFilters.distance !== 'all') {
    const [min, max] = currentFilters.distance.split('-');
    if (min) feedUrl += `&dist_min=${min.replace('+', '')}`;
    if (max) feedUrl += `&dist_max=${max}`;
  }

  const { data, error, mutate } = useSWR(userData ? feedUrl : null, fetcher, { refreshInterval: 5000 });
  
  const { data: sosData } = useSWR('/api/backend/sos/active', fetcher, { refreshInterval: 5000 });
  const hasActiveEmergency = sosData?.emergencies?.length > 0;

  return (
    <div 
      className="min-h-screen pb-24 relative flex flex-col max-w-md mx-auto border-x border-white/5 shadow-2xl" 
      style={{ background: 'radial-gradient(150% 100% at 50% 0%, rgba(139,92,246,0.12) 0%, rgba(10,10,14,1) 40%, rgba(6,6,10,1) 100%)' }}
    >
      <header className="px-5 py-4 sticky top-0 backdrop-blur-2xl z-20 shadow-sm border-b border-white/5" style={{ background: 'rgba(10,10,14,0.8)' }}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-accent to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1
                className="text-[26px] font-black tracking-tighter"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #e4e4e7 50%, #a1a1aa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.15))',
                }}
              >
                Kinnect
              </h1>
            </div>
            {activeUsersData && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 mt-0.5 rounded-full w-fit" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                <span className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase">
                  {activeUsersData.count} Online
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* SOS Button */}
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={() => { playPop(); setIsEmergencyOpen(true); }} 
              className={`relative p-2.5 rounded-full border transition-colors ${hasActiveEmergency ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500 hover:text-white' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'}`}
            >
              <AlertTriangle className="w-5 h-5" />
              {hasActiveEmergency && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              )}
            </motion.button>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { playPop(); setIsNotificationsOpen(true); }} className="relative p-2.5 rounded-full text-gray-400 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-accent text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>
            {userData && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { playPop(); setIsProfileOpen(true); }} className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                {userData.avatar_url ? <img src={userData.avatar_url} alt="profile" className="w-full h-full object-cover" /> : (userData.name?.charAt(0) || "U")}
              </motion.button>
            )}
          </div>
        </div>

        {/* Search Bar & Filter Button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities, people, places..." 
              className="w-full bg-white/5 border border-white/5 rounded-full py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button onClick={() => { playPop(); setIsFilterModalOpen(true); }} className="p-3.5 bg-accent/10 text-accent border border-accent/20 rounded-full hover:bg-accent hover:text-white transition-colors shadow-sm">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Live Feed</h2>
          </div>
          <motion.button onClick={() => { playPop(); router.push('/map'); }} whileHover={{ scale: 1.05 }} className="flex items-center text-accent text-sm font-semibold hover:text-accent/80 transition-colors mt-1">
            View Map <Map className="w-4 h-4 ml-1.5" />
          </motion.button>
        </div>

        {/* Filter Chips - Redesigned with framer-motion layoutId */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide relative items-center">
            {[
              { id: 'all', label: 'All', icon: Play },
              { id: 'study', label: 'Study', icon: Book },
              { id: 'sports', label: 'Sports', icon: Dribbble },
              { id: 'travel', label: 'Travel', icon: Plane },
              { id: 'fitness', label: 'Fitness', icon: Dumbbell }
            ].map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => { playTick(); setFilterType(type.id); }}
                  className={`relative px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors z-10 flex items-center border ${
                    filterType === type.id ? 'text-white border-accent bg-accent' : 'text-gray-400 border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mr-2" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {!data && !error && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data?.feed?.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p>No active floats right now.</p>
            <p className="text-sm mt-1">Be the first to create one!</p>
          </div>
        )}

        <div className="space-y-4 relative">
          <AnimatePresence mode="popLayout">
            {data?.feed
              ?.filter((activity) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  activity.title?.toLowerCase().includes(q) ||
                  activity.activity_type?.toLowerCase().includes(q) ||
                  activity.location_name?.toLowerCase().includes(q) ||
                  activity.creator_name?.toLowerCase().includes(q)
                );
              })
              .map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: index * 0.05 }}
              >
                <ActivityCard 
                  activity={activity} 
                  onJoin={(id, userId) => {
                    fetch(`/api/backend/activities/${id}/join?user_id=${userId}`, { method: 'POST' }).then(() => mutate());
                  }}
                  onOpenChat={(id) => setChatActivityId(id)}
                  onOpenProfile={(id) => setSelectedUserId(id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Premium Floating Dock */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-t border-white/5 flex justify-center items-center z-30">
        <div className="flex justify-between items-center w-full max-w-sm px-6">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { playPop(); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-3 text-accent"><Home className="w-6 h-6" /></motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { playPop(); setIsMyActivitiesOpen(true); }} className="p-3 text-gray-500 hover:text-white transition-colors"><Compass className="w-6 h-6" /></motion.button>
          
          <div className="relative -top-6">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              onClick={() => { playPop(); setIsCreateOpen(true); }}
              className="bg-accent p-4 rounded-full text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] border-4 border-[#030305]"
            >
              <PlusCircle className="w-8 h-8" />
            </motion.button>
          </div>
          
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { playPop(); setIsChatsOpen(true); }} className="p-3 text-gray-500 hover:text-white transition-colors relative">
            <MessageSquare className="w-6 h-6" />
            {hasUnreadChat && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_rgba(139,92,246,0.8)] animate-pulse" />
            )}
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { playPop(); setIsCalendarOpen(true); }} className="p-3 text-gray-500 hover:text-white transition-colors">
            <Calendar className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      <CreateFloatModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={() => {
          setIsCreateOpen(false);
          mutate(); // Immediately re-fetch feed!
        }}
      />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
      
      <LiveChatDrawer activityId={chatActivityId} isOpen={!!chatActivityId} onClose={() => setChatActivityId(null)} />
      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} onOpenChat={(id) => { setChatActivityId(id); setIsNotificationsOpen(false); }} />
      <MyActivitiesModal isOpen={isMyActivitiesOpen} onClose={() => setIsMyActivitiesOpen(false)} onOpenChat={(id) => { setChatActivityId(id); setIsMyActivitiesOpen(false); }} onCloseChat={(id) => { if (chatActivityId === id) setChatActivityId(null); }} />
      <UserProfileModal isOpen={!!selectedUserId} userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      <ChatsModal isOpen={isChatsOpen} onClose={() => setIsChatsOpen(false)} onOpenActivityChat={(id) => { setChatActivityId(id); setIsChatsOpen(false); }} onOpenDM={(friend) => { setSelectedFriend(friend); setIsChatsOpen(false); }} />
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      <DirectMessageDrawer friend={selectedFriend} isOpen={!!selectedFriend} onClose={() => setSelectedFriend(null)} />
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} currentFilters={currentFilters} onApply={setCurrentFilters} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => {
        setIsProfileOpen(false);
        const data = localStorage.getItem("kinnect_user");
        if (data) setUserData(JSON.parse(data));
      }} />
    </div>
  );
}
