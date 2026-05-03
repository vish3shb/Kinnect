import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, MapPin, Clock, Calendar, Zap } from 'lucide-react';

export default function FilterModal({ isOpen, onClose, currentFilters, onApply }) {
  const [distance, setDistance] = useState(currentFilters.distance || 'all');
  const [joinMode, setJoinMode] = useState(currentFilters.joinMode || 'all');
  const [timeOfDay, setTimeOfDay] = useState(currentFilters.timeOfDay || 'all');
  const [date, setDate] = useState(currentFilters.date || '');

  const distances = [
    { id: 'all', label: 'Any Distance' },
    { id: '0-200', label: '0 - 200m' },
    { id: '200-400', label: '200m - 400m' },
    { id: '400-1000', label: '400m - 1km' },
    { id: '1000+', label: '1km +' }
  ];

  const times = [
    { id: 'all', label: 'Any Time' },
    { id: 'morning', label: 'Morning (5AM - 12PM)' },
    { id: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
    { id: 'evening', label: 'Evening (5PM - 9PM)' },
    { id: 'night', label: 'Night (9PM - 5AM)' }
  ];

  const handleApply = () => {
    onApply({
      distance,
      joinMode,
      timeOfDay,
      date
    });
    onClose();
  };

  const handleClear = () => {
    setDistance('all');
    setJoinMode('all');
    setTimeOfDay('all');
    setDate('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[#0f0f13] rounded-t-3xl border-t border-white/10 z-[60] flex flex-col shadow-[0_-10px_40px_rgba(139,92,246,0.1)]"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-lg">Filters</h3>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Join Mode */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Zap className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Join Mode</h4>
                </div>
                <div className="flex gap-2">
                  {[{id: 'all', label: 'All'}, {id: 'open', label: 'Quick Join'}, {id: 'approval', label: 'Request Access'}].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setJoinMode(mode.id)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        joinMode === mode.id ? 'bg-accent text-white shadow-lg' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Distance from me</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {distances.map(dist => (
                    <button
                      key={dist.id}
                      onClick={() => setDistance(dist.id)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        distance === dist.id ? 'bg-sky-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {dist.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time of Day */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Time of Event</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {times.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTimeOfDay(t.id)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        timeOfDay === t.id ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Date</h4>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
                <p className="text-xs text-gray-500 mt-2 ml-1">Leave blank for any date.</p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex gap-3 shrink-0 bg-[#0f0f13]">
              <button onClick={handleClear} className="px-6 py-3.5 rounded-xl font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors">
                Clear
              </button>
              <button onClick={handleApply} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-accent hover:bg-accent/80 transition-colors shadow-lg">
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
