import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Users, Calendar, User, Lock, Unlock, AlignLeft, Compass, ChevronLeft } from 'lucide-react';

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
  return d.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const typeColors = {
  study:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: '#93c5fd', glow: 'rgba(59,130,246,0.15)'   },
  sports:  { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)',  text: '#6ee7b7', glow: 'rgba(16,185,129,0.15)'   },
  travel:  { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  text: '#fcd34d', glow: 'rgba(245,158,11,0.15)'   },
  fitness: { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   text: '#fca5a5', glow: 'rgba(239,68,68,0.15)'    },
  general: { bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.35)',  text: '#c4b5fd', glow: 'rgba(139,92,246,0.15)'   },
};

const iconBg = 'rgba(255,255,255,0.05)';
const iconBorder = '1px solid rgba(255,255,255,0.08)';

export default function ActivityInfoDrawer({ activity, isOpen, onClose }) {
  if (!activity) return null;

  const typeStyle = typeColors[activity.activity_type?.toLowerCase()] || typeColors.general;
  const participantCount = activity.current_capacity || 1;
  const maxCapacity      = activity.max_capacity || 1;
  const fillPercent      = Math.min(Math.round((participantCount / maxCapacity) * 100), 100);

  const barColor =
    fillPercent >= 90 ? 'linear-gradient(90deg,#ef4444,#f87171)' :
    fillPercent >= 60 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' :
                        'linear-gradient(90deg,#10b981,#34d399)';

  const barGlow =
    fillPercent >= 90 ? '0 0 8px rgba(239,68,68,0.5)' :
    fillPercent >= 60 ? '0 0 8px rgba(245,158,11,0.4)' :
                        '0 0 8px rgba(16,185,129,0.4)';

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-[201] flex flex-col"
            style={{
              maxHeight: '88vh',
              background: 'linear-gradient(175deg, rgba(16,16,22,0.99) 0%, rgba(9,9,13,1) 100%)',
              borderRadius: '28px 28px 0 0',
              border: '1px solid rgba(255,255,255,0.07)',
              borderBottom: 'none',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.65), 0 -1px 0 rgba(255,255,255,0.05) inset',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
            </div>

            {/* Header */}
            <div
              className="flex items-start justify-between px-5 pt-3 pb-5 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: typeStyle.bg, border: `1px solid ${typeStyle.border}`, color: typeStyle.text }}
                  >
                    {activity.activity_type || 'General'}
                  </span>
                  {activity.join_mode === 'approval' && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' }}
                    >
                      Ask to Join
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white leading-tight mb-1">{activity.title}</h2>
                {/* Host name — always visible in header */}
                <div className="flex items-center gap-2 mt-1">
                  {activity.creator_avatar ? (
                    <img src={activity.creator_avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}
                    >
                      {activity.creator_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-xs text-gray-500 font-medium">
                    by <span className="text-gray-300 font-semibold">{activity.creator_name || 'Unknown'}</span>
                  </span>
                </div>
              </div>

              {/* ← Back button */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={onClose}
                className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-bold flex-shrink-0 transition-colors mt-1"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#9ca3af' }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </motion.button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">

              {/* Description card */}
              {activity.description && (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <AlignLeft className="w-3 h-3" /> Description
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">{activity.description}</p>
                </div>
              )}

              {/* Capacity bar card */}
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> Capacity
                  </p>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: fillPercent >= 90 ? '#f87171' : fillPercent >= 60 ? '#fbbf24' : '#34d399' }}
                  >
                    {participantCount} / {maxCapacity} · {fillPercent}%
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercent}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
                    className="h-full rounded-full"
                    style={{ background: barColor, boxShadow: barGlow }}
                  />
                </div>
              </div>

              {/* 2-column info grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Hosted by */}
                <div
                  className="rounded-2xl p-4 col-span-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Hosted by
                  </p>
                  <div className="flex items-center gap-3">
                    {activity.creator_avatar ? (
                      <img src={activity.creator_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                        style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}
                      >
                        {activity.creator_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <span className="text-sm font-bold text-white">{activity.creator_name || 'Unknown'}</span>
                  </div>
                </div>

                {/* When */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> When
                  </p>
                  <p className="text-sm font-bold text-white leading-snug">
                    {formatDateTime(activity.event_time)}
                  </p>
                </div>

                {/* Expires */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Expires
                  </p>
                  <p className="text-sm font-bold text-white leading-snug">
                    {formatDateTime(activity.expires_at)}
                  </p>
                </div>

                {/* Where */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Where
                  </p>
                  <p className="text-sm font-bold text-white leading-snug">
                    {activity.location_name || '—'}
                  </p>
                </div>

                {/* Join mode */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    {activity.join_mode === 'approval' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    Join Mode
                  </p>
                  <p className="text-sm font-bold text-white leading-snug">
                    {activity.join_mode === 'approval' ? 'Ask to Join' : 'Open'}
                  </p>
                </div>

                {/* Distance */}
                {activity.distance_meters !== undefined && (
                  <div
                    className="rounded-2xl p-4 col-span-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Compass className="w-3 h-3" /> Distance from you
                    </p>
                    <p className="text-sm font-bold text-white">
                      {activity.distance_meters > 1000
                        ? `${(activity.distance_meters / 1000).toFixed(1)} km away`
                        : `${Math.round(activity.distance_meters)} m away`}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom spacer for safe area */}
              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
