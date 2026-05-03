import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, WifiOff } from 'lucide-react';

export default function DirectMessageDrawer({ friend, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connectWs = useCallback(() => {
    if (!friend) return;
    const currentUser = JSON.parse(localStorage.getItem("kinnect_user") || "{}");
    if (!currentUser.id) return;

    // Always route through Next.js rewrite proxy
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/dm/${currentUser.id}/${friend.id}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[DM] Connected to', friend.name);
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const isMe = msg.sender_id === currentUser.id;
        const text = msg.text || msg.content || "";
        
        let timeStr = "";
        if (msg.sent_at) {
          const sentAtUTC = msg.sent_at.endsWith('Z') ? msg.sent_at : `${msg.sent_at}Z`;
          const d = new Date(sentAtUTC);
          timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, isMe, timeStr }]);
      } catch (e) {
        console.error(e);
      }
    };

    socket.onclose = () => {
      console.log('[DM] Disconnected');
      setConnected(false);
      reconnectTimer.current = setTimeout(() => {
        if (ws.current === socket) {
          connectWs();
        }
      }, 2000);
    };

    socket.onerror = (err) => {
      console.error('[DM] WebSocket error', err);
      socket.close();
    };

    ws.current = socket;
  }, [friend]);

  useEffect(() => {
    if (isOpen && friend) {
      setMessages([]); // Clear old messages
      connectWs();

      return () => {
        clearTimeout(reconnectTimer.current);
        if (ws.current) {
          ws.current.onclose = null;
          ws.current.close();
          ws.current = null;
        }
        setConnected(false);
      };
    }
  }, [isOpen, friend, connectWs]);

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
      {isOpen && friend && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[#0f0f13] rounded-t-3xl border-t border-white/10 z-[60] flex flex-col shadow-[0_-10px_40px_rgba(139,92,246,0.1)]"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="Friend" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f0f13] ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight">{friend.name}</h3>
                  {!connected && <span className="text-[10px] text-red-400 flex items-center"><WifiOff className="w-3 h-3 mr-1"/>Reconnecting...</span>}
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-10 text-sm">
                  <p>Say hi to {friend.name}!</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] flex flex-col p-3 rounded-2xl ${msg.isMe ? 'bg-accent text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                    <span>{msg.text}</span>
                    {msg.timeStr && (
                      <span className={`text-[9px] mt-1 ${msg.isMe ? 'text-white/70 self-end' : 'text-gray-500 self-start'}`}>
                        {msg.timeStr}
                      </span>
                    )}
                  </div>
                </div>
              ))}
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
