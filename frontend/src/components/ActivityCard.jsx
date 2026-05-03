import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, MapPin, Users, Info } from 'lucide-react';
import ActivityInfoDrawer from './ActivityInfoDrawer';

export default function ActivityCard({ activity, onJoin, onOpenChat, onOpenProfile }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [joined, setJoined] = useState(activity.has_joined || false);
  const [joinStatus, setJoinStatus] = useState(activity.join_status || null);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const expiresAtStr = activity.expires_at.endsWith('Z') ? activity.expires_at : activity.expires_at + 'Z';
      const distance = new Date(expiresAtStr) - new Date();
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft('Expired');
        return;
      }
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${h}h ${m}m`);
    }, 1000);
    return () => clearInterval(timer);
  }, [activity.expires_at]);

  const handleJoin = async () => {
    const userStr = localStorage.getItem("kinnect_user");
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) return;
    if (activity.join_mode === 'approval') {
      setJoinStatus('pending');
      onJoin(activity.id, user.id);
    } else {
      setJoined(true);
      onJoin(activity.id, user.id);
    }
  };

  const isFull = activity.current_capacity >= activity.max_capacity;
  const participantCount = activity.current_capacity || 1;
  const maxCapacity = activity.max_capacity || 1;
  const fillPercent = Math.min((participantCount / maxCapacity) * 100, 100);

  const distanceStr = activity.distance_meters !== undefined
    ? (activity.distance_meters > 1000
        ? `${(activity.distance_meters / 1000).toFixed(1)} km`
        : `${Math.round(activity.distance_meters)} m`)
    : '';

  const realParticipants = activity.participants || [];

  // Color for capacity bar
  const barColor = fillPercent >= 90
    ? 'linear-gradient(90deg, #ef4444, #f87171)'
    : fillPercent >= 60
    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
    : 'linear-gradient(90deg, #10b981, #34d399)';

  const Avatar = ({ src, name, zIndex, onClick, size = 'md' }) => {
    const dim = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-9 h-9 text-xs';
    return (
      <div
        onClick={onClick}
        className="relative flex-shrink-0 cursor-pointer"
        style={{ zIndex, marginLeft: zIndex === 30 ? 0 : '-10px' }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className={`${dim} rounded-full border-2 border-[#0f0f12] object-cover`}
          />
        ) : (
          <div className={`${dim} rounded-full border-2 border-[#0f0f12] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold`}>
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
        )}
      </div>
    );
  };

  // Type badge colors
  const typeColors = {
    study: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd' },
    sports: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#6ee7b7' },
    travel: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fcd34d' },
    fitness: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#fca5a5' },
    general: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', text: '#c4b5fd' },
  };
  const typeStyle = typeColors[activity.activity_type?.toLowerCase()] || typeColors.general;

  return (
    <div
      className="relative rounded-3xl overflow-hidden mb-4"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {/* Top purple ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 15% 0%, rgba(139,92,246,0.1) 0%, transparent 55%)',
        }}
      />

      <div className="p-5 relative">
        {/* ── Row 1: Type badge + LIVE pill + Info ── */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{ background: typeStyle.bg, border: `1px solid ${typeStyle.border}`, color: typeStyle.text }}
            >
              {activity.activity_type || 'General'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setInfoOpen(true); }}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Info className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <div
              className="flex items-center px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 tracking-widest">LIVE</span>
            </div>
          </div>
        </div>

        {/* ── Row 2: Title ── */}
        <h3 className="text-[22px] font-black text-white leading-tight tracking-tight mb-3">
          {activity.title}
        </h3>

        {/* ── Row 3: Meta chips ── */}
        <div className="flex items-center gap-3 mb-4">
          {distanceStr && (
            <div className="flex items-center gap-1 text-gray-400 text-[11px] font-medium">
              <MapPin className="w-3 h-3" />
              {distanceStr} away
            </div>
          )}
          {timeLeft && (
            <div className="flex items-center gap-1 text-gray-500 text-[11px] font-medium">
              <Clock className="w-3 h-3" />
              {timeLeft !== 'Expired' ? `${timeLeft} left` : 'Expired'}
            </div>
          )}
        </div>

        {/* ── Row 4: Capacity progress bar ── */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-semibold">
              <Users className="w-3 h-3" />
              {participantCount} / {maxCapacity}
            </div>
            {isFull ? (
              <span className="text-[10px] font-bold text-red-400">Full</span>
            ) : (
              <span className="text-[10px] font-semibold text-gray-600">
                {maxCapacity - participantCount} spot{maxCapacity - participantCount !== 1 ? 's' : ''} left
              </span>
            )}
          </div>
          {/* Track */}
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: barColor, boxShadow: fillPercent < 90 ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(239,68,68,0.5)' }}
            />
          </div>
        </div>

        {/* ── Row 5: Avatars + Action ── */}
        <div className="flex items-center justify-between">
          {/* Stacked avatars */}
          <div className="flex items-center">
            <Avatar
              src={activity.creator_avatar}
              name={activity.creator_name}
              zIndex={30}
              onClick={() => onOpenProfile && onOpenProfile(activity.creator_id)}
            />
            {/* Online dot for creator */}
            <div
              className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0f0f12]"
              style={{ marginLeft: '22px', marginTop: '10px', zIndex: 40, position: 'relative', top: 0, left: 0 }}
            />

            {realParticipants.slice(0, 3).map((p, i) => (
              <Avatar
                key={p.id}
                src={p.avatar_url}
                name={p.name}
                zIndex={20 - i}
                onClick={() => onOpenProfile && onOpenProfile(p.id)}
              />
            ))}
            {participantCount > 4 && (
              <div
                className="w-9 h-9 rounded-full border-2 border-[#0f0f12] flex items-center justify-center text-xs font-bold text-gray-300"
                style={{ background: 'rgba(255,255,255,0.08)', marginLeft: '-10px', zIndex: 10 }}
              >
                +{participantCount - 4}
              </div>
            )}
          </div>

          {/* Action button — compact, inline */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={joined ? () => onOpenChat && onOpenChat(activity.id) : handleJoin}
            disabled={(isFull && !joined) || joinStatus === 'pending'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all"
            style={
              joined
                ? { background: 'rgba(255,255,255,0.07)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.12)' }
                : joinStatus === 'pending'
                ? { background: 'rgba(249,115,22,0.1)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)', cursor: 'not-allowed' }
                : isFull
                ? { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed' }
                : {
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(99,102,241,0.25) 100%)',
                    color: '#fff',
                    border: '1px solid rgba(139,92,246,0.45)',
                    boxShadow: '0 0 16px rgba(139,92,246,0.2)',
                  }
            }
          >
            {joined && <MessageCircle className="w-4 h-4" />}
            {joined ? 'Chat' : joinStatus === 'pending' ? 'Pending…' : isFull ? 'Full' : 'Join'}
          </motion.button>
        </div>
      </div>

      {/* Activity Info Drawer */}
      <ActivityInfoDrawer activity={activity} isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
