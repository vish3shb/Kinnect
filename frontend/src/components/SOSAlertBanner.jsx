import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle, XCircle, Navigation } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function SOSAlertBanner() {
  const [userData, setUserData] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null); // parsed SOS notification
  const [phase, setPhase] = useState('alert'); // 'alert' | 'validate'
  const [dismissed, setDismissed] = useState(new Set());
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem('kinnect_user');
    if (d) setUserData(JSON.parse(d));
  }, []);

  const { data: notifsData } = useSWR(
    userData ? `/api/backend/activities/notifications?user_id=${userData.id}` : null,
    fetcher,
    { refreshInterval: 8000 }
  );

  // Parse SOS notifications — format: "SOS::{id}::{sender}::{desc}::{lat}::{lon}"
  useEffect(() => {
    if (!notifsData?.notifications) return;
    const sosNotifs = notifsData.notifications.filter(
      (n) => n.type === 'sos_alert' && !n.is_read && !dismissed.has(n.id)
    );
    if (sosNotifs.length === 0) {
      setActiveAlert(null);
      return;
    }
    // Take the most recent one
    const notif = sosNotifs[0];
    const parts = notif.message.split('::');
    if (parts.length >= 6) {
      setActiveAlert({
        notifId: notif.id,
        emergencyId: parts[1],
        senderName: parts[2],
        description: parts[3],
        lat: parseFloat(parts[4]),
        lon: parseFloat(parts[5]),
      });
      setPhase('alert');
    }
  }, [notifsData, dismissed]);

  const markRead = useCallback(async (notifId) => {
    try {
      await fetch(`/api/backend/activities/notifications/${notifId}/read`, { method: 'POST' });
    } catch (e) {}
    setDismissed(prev => new Set([...prev, notifId]));
    setActiveAlert(null);
  }, []);

  const handleDismiss = () => {
    if (activeAlert) markRead(activeAlert.notifId);
  };

  const handleRespond = async () => {
    if (!activeAlert || !userData) return;
    try {
      await fetch(`/api/backend/sos/${activeAlert.emergencyId}/respond?responder_id=${userData.id}`, {
        method: 'POST'
      });
    } catch (e) {}
    await markRead(activeAlert.notifId);
    // keep alert open in validate phase
    setDismissed(prev => { const s = new Set(prev); s.delete(activeAlert.notifId); return s; });
    setActiveAlert(prev => prev); // keep it
    setPhase('validate');
    // Re-show alert for validation
    setDismissed(prev => { const s = new Set(prev); return s; });
  };

  const handleValidate = async (resolution) => {
    if (!activeAlert || !userData) return;
    setValidating(true);
    try {
      await fetch(`/api/backend/sos/${activeAlert.emergencyId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responder_id: userData.id, resolution }),
      });
    } catch (e) {}
    setValidating(false);
    markRead(activeAlert.notifId);
    setActiveAlert(null);
  };

  if (!activeAlert) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="sos-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      >
        {/* Pulsing red ring */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)' }}
        />

        <motion.div
          key={phase}
          initial={{ scale: 0.88, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(20,0,0,0.95) 0%, rgba(10,0,0,0.98) 100%)',
            border: '1px solid rgba(239,68,68,0.4)',
            boxShadow: '0 0 0 1px rgba(239,68,68,0.15), 0 24px 60px rgba(239,68,68,0.3)',
          }}
        >
          {/* Top red glow strip */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444, #dc2626)' }} />

          {phase === 'alert' ? (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">SOS Alert</p>
                    <h3 className="text-lg font-black text-white">{activeAlert.senderName}</h3>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Description */}
              <div
                className="rounded-2xl p-4 mb-6"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <p className="text-white font-semibold text-sm leading-relaxed">"{activeAlert.description}"</p>
              </div>

              {/* Location info */}
              <div className="flex items-center gap-2 mb-6 text-gray-400 text-xs">
                <Navigation className="w-3.5 h-3.5 text-red-400" />
                <span>Nearby your location • Needs immediate help</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleRespond}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                    boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  I'm Responding
                </motion.button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-3.5 rounded-2xl font-bold text-gray-400 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Validate</p>
                  <h3 className="text-lg font-black text-white">Was it real?</h3>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Thank you for responding. Please validate whether this was a genuine emergency. False alarms lead to warnings and account suspension.
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleValidate('true_alarm')}
                  disabled={validating}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.35)',
                    color: '#34d399',
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  True Emergency
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleValidate('false_alarm')}
                  disabled={validating}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171',
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  False Alarm
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
