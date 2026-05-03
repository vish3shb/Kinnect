import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Clock, MapPin, Bell, Plus, Trash2, CalendarDays, Activity } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function fmt12(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function dateKey(d) { return d.toDateString(); }

const typeColors = {
  study:   '#3b82f6', sports:  '#10b981',
  travel:  '#f59e0b', fitness: '#ef4444', general: '#8b5cf6',
};

export default function CalendarModal({ isOpen, onClose }) {
  const [userData, setUserData]         = useState(null);
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders]       = useState({});
  const [showAddForm, setShowAddForm]   = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const inputRef = useRef(null);

  // Load user + reminders
  useEffect(() => {
    const data = localStorage.getItem('kinnect_user');
    if (data) {
      const parsed = JSON.parse(data);
      setUserData(parsed);
      const stored = localStorage.getItem(`kinnect_reminders_${parsed.id}`);
      if (stored) setReminders(JSON.parse(stored));
    }
  }, []);

  // When add-form opens focus the input
  useEffect(() => {
    if (showAddForm) setTimeout(() => inputRef.current?.focus(), 80);
  }, [showAddForm]);

  // When opened, jump to today's date
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      setSelectedDate(today);
      setCurrentDate(today);
    }
  }, [isOpen]);

  const persistReminders = (next) => {
    setReminders(next);
    if (userData) localStorage.setItem(`kinnect_reminders_${userData.id}`, JSON.stringify(next));
  };

  const handleAddReminder = () => {
    if (!reminderText.trim()) { setShowAddForm(false); return; }
    const key = dateKey(selectedDate);
    const entry = { id: Date.now().toString(), text: reminderText.trim(), time: reminderTime };
    persistReminders({ ...reminders, [key]: [...(reminders[key] || []), entry] });
    setReminderText(''); setReminderTime(''); setShowAddForm(false);
  };

  const handleDelete = (reminderId) => {
    const key = dateKey(selectedDate);
    persistReminders({ ...reminders, [key]: (reminders[key] || []).filter(r => r.id !== reminderId) });
  };

  // Fetch user activities
  const { data: actData } = useSWR(
    isOpen && userData ? `/api/backend/activities/me?user_id=${userData.id}` : null,
    fetcher, { refreshInterval: 15000 }
  );
  const allActivities = actData ? [...(actData.hosted || []), ...(actData.joined || [])] : [];
  const activeActivities = allActivities.filter(a => a.is_active !== false);

  // Build calendar grid
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth     = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const prevMonthDays   = new Date(year, month, 0).getDate();

  const days = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) days.push(new Date(year, month - 1, prevMonthDays - i));
  for (let i = 1; i <= daysInMonth; i++)          days.push(new Date(year, month, i));
  const rem = 42 - days.length;
  for (let i = 1; i <= rem; i++)                  days.push(new Date(year, month + 1, i));

  // Activities for a given date
  const activitiesForDate = (d) =>
    activeActivities.filter(act => {
      const str = act.event_time || act.created_at;
      return new Date(str.endsWith('Z') ? str : str + 'Z').toDateString() === d.toDateString();
    });

  // Selected day data
  const selKey           = dateKey(selectedDate);
  const selActivities    = activitiesForDate(selectedDate).sort((a, b) => {
    const sa = a.event_time || a.created_at, sb = b.event_time || b.created_at;
    return new Date(sa.endsWith('Z') ? sa : sa + 'Z') - new Date(sb.endsWith('Z') ? sb : sb + 'Z');
  });
  const selReminders     = (reminders[selKey] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const isToday          = (d) => d.toDateString() === new Date().toDateString();
  const selDayLabel      = isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 310, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md z-50 flex flex-col overflow-hidden"
            style={{
              height: '92vh',
              background: 'linear-gradient(175deg, rgba(14,14,20,0.99) 0%, rgba(8,8,12,1) 100%)',
              borderRadius: '28px 28px 0 0',
              border: '1px solid rgba(255,255,255,0.07)',
              borderBottom: 'none',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { const t = new Date(); setCurrentDate(t); setSelectedDate(t); }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}
                >
                  Today
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                  </button>
                  <span className="text-sm font-black text-white min-w-[110px] text-center select-none">
                    {MONTH_NAMES[month]} {year}
                  </span>
                  <button
                    onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* ── Calendar grid ── */}
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              {/* Day labels */}
              <div className="grid grid-cols-7 mb-2">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                  const inMonth   = d.getMonth() === month;
                  const today     = isToday(d);
                  const selected  = d.toDateString() === selectedDate.toDateString();
                  const acts      = activitiesForDate(d);
                  const hasActs   = acts.length > 0;
                  const hasRems   = (reminders[dateKey(d)] || []).length > 0;

                  return (
                    <motion.div
                      key={i}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setSelectedDate(d)}
                      className="aspect-square flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all relative"
                      style={{
                        background: selected
                          ? 'linear-gradient(135deg,#8b5cf6,#6366f1)'
                          : today
                          ? 'rgba(139,92,246,0.12)'
                          : 'transparent',
                        border: selected
                          ? '1px solid rgba(139,92,246,0.6)'
                          : today
                          ? '1px solid rgba(139,92,246,0.3)'
                          : '1px solid transparent',
                        boxShadow: selected ? '0 0 16px rgba(139,92,246,0.35)' : 'none',
                        opacity: inMonth ? 1 : 0.25,
                      }}
                    >
                      <span className={`text-sm font-${selected || today ? 'black' : 'semibold'} ${selected ? 'text-white' : today ? 'text-accent' : 'text-gray-300'}`}>
                        {d.getDate()}
                      </span>
                      {/* Dot indicators */}
                      <div className="flex items-center gap-0.5 mt-0.5 h-2">
                        {hasActs && (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: selected ? 'rgba(255,255,255,0.9)' : '#8b5cf6', boxShadow: selected ? 'none' : '0 0 4px rgba(139,92,246,0.8)' }} />
                        )}
                        {hasRems && (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: selected ? 'rgba(255,255,255,0.6)' : '#10b981', boxShadow: selected ? 'none' : '0 0 4px rgba(16,185,129,0.8)' }} />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Dot legend ── */}
            <div className="flex items-center gap-4 px-5 py-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Activity
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Reminder
              </div>
            </div>

            {/* ── Day panel ── */}
            <div
              className="flex-1 overflow-y-auto px-5 pb-10"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Day heading + add reminder */}
              <div className="flex items-center justify-between pt-4 pb-4 sticky top-0 z-10"
                style={{ background: 'rgba(8,8,12,0.95)', backdropFilter: 'blur(8px)' }}>
                <div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                    {selectedDate.toLocaleDateString('en-IN', { weekday: 'long' })}
                  </p>
                  <h4 className="text-lg font-black text-white leading-tight">
                    {isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                  </h4>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(v => !v)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: showAddForm ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                    border: showAddForm ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    color: showAddForm ? '#c4b5fd' : '#9ca3af',
                  }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  Add Reminder
                </motion.button>
              </div>

              {/* ── Add reminder form ── */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div
                      className="rounded-2xl p-4 space-y-3"
                      style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}
                    >
                      <p className="text-[10px] font-bold text-accent uppercase tracking-widest">New Reminder</p>
                      <input
                        ref={inputRef}
                        type="text"
                        value={reminderText}
                        onChange={e => setReminderText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddReminder()}
                        placeholder="e.g. Submit assignment"
                        className="w-full rounded-xl px-4 py-2.5 text-sm text-white font-medium outline-none transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={e => setReminderTime(e.target.value)}
                          className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white font-medium outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                        />
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAddReminder}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}
                        >
                          Save
                        </motion.button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty state */}
              {selActivities.length === 0 && selReminders.length === 0 && (
                <div
                  className="flex flex-col items-center justify-center py-12 rounded-2xl"
                  style={{ border: '1px dashed rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
                >
                  <CalendarDays className="w-8 h-8 text-gray-700 mb-3" />
                  <p className="text-sm text-gray-600 font-semibold">Nothing planned</p>
                  <p className="text-xs text-gray-700 mt-1">Tap "Add Reminder" to note something down</p>
                </div>
              )}

              {/* ── Reminders ── */}
              {selReminders.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Bell className="w-3 h-3" /> Reminders
                  </p>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {selReminders.map(r => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center justify-between group rounded-2xl px-4 py-3"
                          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
                            <div>
                              <p className="text-sm font-semibold text-white">{r.text}</p>
                              {r.time && (
                                <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {(() => {
                                    const [hh, mm] = r.time.split(':');
                                    const h = parseInt(hh), ampm = h >= 12 ? 'PM' : 'AM';
                                    return `${h % 12 || 12}:${mm} ${ampm}`;
                                  })()}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* ── Activities ── */}
              {selActivities.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" /> Activities
                  </p>
                  <div className="space-y-2">
                    {selActivities.map(act => {
                      const str    = act.event_time || act.created_at;
                      const actD   = new Date(str.endsWith('Z') ? str : str + 'Z');
                      const color  = typeColors[act.activity_type?.toLowerCase()] || typeColors.general;
                      const isHost = actData?.hosted?.some(h => h.id === act.id);

                      return (
                        <div
                          key={act.id}
                          className="rounded-2xl p-4 flex items-center gap-4"
                          style={{
                            background: `${color}0d`,
                            border: `1px solid ${color}28`,
                          }}
                        >
                          {/* Time column */}
                          <div className="flex flex-col items-center flex-shrink-0 min-w-[44px]">
                            <span className="text-base font-black text-white leading-none">
                              {actD.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <span className="text-[10px] font-bold uppercase mt-0.5" style={{ color }}>
                              {isHost ? 'Host' : 'Joined'}
                            </span>
                          </div>

                          {/* Divider */}
                          <div className="w-px self-stretch" style={{ background: `${color}30` }} />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm leading-tight truncate">{act.title}</h4>
                            {act.location_name && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                {act.location_name}
                              </p>
                            )}
                          </div>

                          {/* Type dot */}
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
