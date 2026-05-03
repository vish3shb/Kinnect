import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Edit3, Check, Camera, GraduationCap, Sparkles, User } from 'lucide-react';
import { useRouter } from 'next/router';

const INTEREST_OPTIONS = [
  'Swimming', 'Running', 'Cricket', 'Football', 'Badminton',
  'Chess', 'Reading', 'Gaming', 'Music', 'Photography',
  'Coding', 'Cooking', 'Travel', 'Fitness', 'Yoga',
  'Dancing', 'Art', 'Movies', 'Study',
];

export default function ProfileModal({ isOpen, onClose }) {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [hall, setHall] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const data = localStorage.getItem('kinnect_user');
      if (data) {
        const parsed = JSON.parse(data);
        setUserData(parsed);
        setName(parsed.name || (parsed.email ? parsed.email.split('@')[0] : ''));
        setHall(parsed.hall_of_residence || '');
        const interests = parsed.interests
          ? parsed.interests.split(',').map(i => i.trim()).filter(Boolean)
          : [];
        setSelectedInterests(interests);
      }
    }
  }, [isOpen]);

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please choose an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserData(prev => ({ ...prev, avatar_url: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const updated = {
      ...userData,
      name,
      hall_of_residence: hall,
      interests: selectedInterests.join(', '),
    };

    // Persist to backend if user id exists
    try {
      if (userData?.id) {
        await fetch(`/api/backend/auth/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      }
    } catch (e) {}

    localStorage.setItem('kinnect_user', JSON.stringify(updated));
    setUserData(updated);
    setLoading(false);
    setSaved(true);
    setEditingName(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('kinnect_user');
    router.push('/');
  };

  const displayName = name || (userData?.email ? userData.email.split('@')[0] : 'Your Name');
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md z-50 flex flex-col"
            style={{
              maxHeight: '92vh',
              background: 'linear-gradient(175deg, rgba(15,15,20,0.99) 0%, rgba(8,8,12,1) 100%)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '28px 28px 0 0',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.7), 0 -1px 0 rgba(255,255,255,0.06) inset',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header row */}
            <div className="flex items-center justify-between px-6 pt-2 pb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold text-white tracking-wide">My Profile</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto">
              {/* Hero — Avatar */}
              <div className="flex flex-col items-center pt-2 pb-8 px-6">
                {/* Avatar with gradient ring */}
                <div className="relative mb-4">
                  <div
                    className="w-24 h-24 rounded-full p-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6)',
                      boxShadow: '0 0 0 3px rgba(139,92,246,0.15), 0 8px 24px rgba(139,92,246,0.25)',
                    }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                      style={{ background: 'rgba(139,92,246,0.15)' }}
                    >
                      {userData?.avatar_url ? (
                        <img src={userData.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-white">{initials}</span>
                      )}
                    </div>
                  </div>
                  {/* Camera badge */}
                  <label
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      border: '2px solid rgba(8,8,12,1)',
                      zIndex: 10
                    }}
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </label>
                </div>

                {/* Name inline edit */}
                {editingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="text-xl font-black text-white text-center bg-transparent border-b border-accent outline-none w-48"
                    />
                    <button type="button" onClick={() => setEditingName(false)}
                      className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-accent" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-black text-white">{displayName}</h2>
                    <button type="button" onClick={() => setEditingName(true)}
                      className="opacity-40 hover:opacity-100 transition-opacity">
                      <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500 font-medium">{hall || 'Hall of Residence'}</p>
              </div>

              {/* Fields */}
              <div className="px-5 space-y-3 mb-6">
                {/* Name field */}
                <div
                  className="rounded-2xl px-4 py-3.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Full Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    type="text"
                    placeholder={displayName}
                    className="w-full bg-transparent text-white text-sm font-semibold outline-none placeholder-gray-600"
                  />
                </div>

                {/* Hall */}
                <div
                  className="rounded-2xl px-4 py-3.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Hall of Residence
                  </label>
                  <input
                    required
                    value={hall}
                    onChange={e => setHall(e.target.value)}
                    type="text"
                    placeholder="e.g. Hall 5"
                    className="w-full bg-transparent text-white text-sm font-semibold outline-none placeholder-gray-600"
                  />
                </div>
              </div>

              {/* Interests */}
              <div className="px-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <p className="text-sm font-bold text-white">Interests</p>
                  <span className="text-xs text-gray-600 ml-auto">{selectedInterests.length} selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(interest => {
                    const active = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={
                          active
                            ? {
                                background: 'rgba(139,92,246,0.2)',
                                border: '1px solid rgba(139,92,246,0.5)',
                                color: '#c4b5fd',
                              }
                            : {
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#6b7280',
                              }
                        }
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="px-5 pb-10 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 rounded-2xl font-black text-sm tracking-wide text-white flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: saved
                      ? 'rgba(16,185,129,0.2)'
                      : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    border: saved ? '1px solid rgba(16,185,129,0.4)' : 'none',
                    color: saved ? '#34d399' : '#fff',
                    boxShadow: saved ? 'none' : '0 4px 20px rgba(139,92,246,0.35)',
                  }}
                >
                  {saved ? (
                    <><Check className="w-4 h-4" /> Saved!</>
                  ) : loading ? (
                    'Saving…'
                  ) : (
                    'Save Profile'
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171',
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
