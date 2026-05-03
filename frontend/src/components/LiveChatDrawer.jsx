import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, ShieldAlert, WifiOff } from 'lucide-react';

export default function LiveChatDrawer({ activityId, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connectWs = useCallback(() => {
    if (!activityId) return;

    // Always route through Next.js rewrite proxy, which forwards /ws/ to the backend
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/chat/${activityId}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[Chat] Connected to', activityId);
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const currentUser = JSON.parse(localStorage.getItem("kinnect_user") || "{}");
        const isSystem = msg.sender === "System";
        const isMe = !isSystem && (msg.sender_id === currentUser.id);
        const text = msg.text || msg.content || "";
        const name = msg.name || msg.sender || "Unknown";
        
        let timeStr = "";
        if (msg.sent_at) {
          const sentAtUTC = msg.sent_at.endsWith('Z') ? msg.sent_at : `${msg.sent_at}Z`;
          const d = new Date(sentAtUTC);
          timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        if (isSystem && (text.includes("closed") || text.includes("disbanded"))) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }

        setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, name, isMe, isSystem, timeStr }]);
      } catch (e) {
        setMessages(prev => [...prev, { id: Date.now() + Math.random(), text: event.data, isMe: false, isSystem: false, timeStr: '' }]);
      }
    };

    socket.onclose = () => {
      console.log('[Chat] Disconnected');
      setConnected(false);
      // Auto-reconnect after 2 seconds if drawer is still open
      reconnectTimer.current = setTimeout(() => {
        if (ws.current === socket) {
          connectWs();
        }
      }, 2000);
    };

    socket.onerror = (err) => {
      console.error('[Chat] WebSocket error', err);
      socket.close();
    };

    ws.current = socket;
  }, [activityId]);

  useEffect(() => {
    if (isOpen && activityId) {
      setMessages([]); // Clear old messages when opening a new chat
      connectWs();

      return () => {
        clearTimeout(reconnectTimer.current);
        if (ws.current) {
          ws.current.onclose = null; // Prevent auto-reconnect on intentional close
          ws.current.close();
          ws.current = null;
        }
        setConnected(false);
      };
    }
  }, [isOpen, activityId, connectWs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      const currentUser = JSON.parse(localStorage.getItem("kinnect_user") || "{}");
      ws.current.send(JSON.stringify({
        sender_id: currentUser.id,
        name: currentUser.name,
        text: input
      }));
      setInput('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[#0f0f13] rounded-t-3xl border-t border-white/10 z-50 flex flex-col shadow-[0_-10px_40px_rgba(139,92,246,0.1)]"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <h3 className="font-bold">Live Chat</h3>
                {!connected && <span className="text-[10px] text-red-400 flex items-center"><WifiOff className="w-3 h-3 mr-1"/>Reconnecting...</span>}
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-yellow-500/10 text-yellow-500 text-xs p-2 text-center flex items-center justify-center">
              <ShieldAlert className="w-3 h-3 mr-1" /> Messages self-destruct 2 hours after activity ends.
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-10 text-sm">
                  <p>No messages yet.</p>
                  <p className="text-xs mt-1">Be the first to say something!</p>
                </div>
              )}
              {messages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center w-full">
                      <div className="bg-sky-500/10 text-sky-400 text-[11px] px-3 py-1 rounded-full border border-sky-500/20">
                        {msg.text}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    {!msg.isMe && msg.name && <span className="text-[10px] text-gray-500 mb-1 ml-1">{msg.name}</span>}
                    <div className={`max-w-[80%] flex flex-col p-3 rounded-2xl ${msg.isMe ? 'bg-accent text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                      <span>{msg.text}</span>
                      {msg.timeStr && (
                        <span className={`text-[9px] mt-1 ${msg.isMe ? 'text-white/70 self-end' : 'text-gray-500 self-start'}`}>
                          {msg.timeStr}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 focus:outline-none focus:border-accent text-white"
              />
              <button 
                type="submit" 
                disabled={!connected}
                className="bg-accent text-white p-3 rounded-full hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
