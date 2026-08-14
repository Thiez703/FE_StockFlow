import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, animate } from 'framer-motion';
import { 
  RobotOutlined, 
  CloseOutlined, 
  SendOutlined, 
  UserOutlined 
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';
import { chatApi } from '@/api/chat';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

export default function FloatingChatWidget() {
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSelector(state => state.auth);
  const location = useLocation();
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const wrapperRef = useRef(null);
  const isDraggingRef = useRef(false);

  const [isButtonIdle, setIsButtonIdle] = useState(false);
  const buttonIdleTimerRef = useRef(null);

  const snapToEdge = useCallback((idle) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const centerX = rect.left + rect.width / 2;
    
    let targetXOffset = 0;
    
    if (idle) {
      if (centerX < windowWidth / 2) {
        targetXOffset = -28 - rect.left; // 28 is half of 56px button
      } else {
        targetXOffset = (windowWidth + 28) - rect.right;
      }
    } else {
      if (rect.left < 0) {
        targetXOffset = 16 - rect.left;
      } else if (rect.right > windowWidth) {
        targetXOffset = (windowWidth - 16) - rect.right;
      }
    }

    if (targetXOffset !== 0) {
      animate(x, x.get() + targetXOffset, { type: 'spring', stiffness: 300, damping: 30 });
    }
  }, [x]);

  const startButtonIdleTimer = useCallback(() => {
    if (buttonIdleTimerRef.current) {
      clearTimeout(buttonIdleTimerRef.current);
    }
    buttonIdleTimerRef.current = setTimeout(() => {
      setIsButtonIdle(true);
      snapToEdge(true);
    }, 5000);
  }, [snapToEdge]);

  const clearButtonIdleTimer = useCallback(() => {
    if (buttonIdleTimerRef.current) {
      clearTimeout(buttonIdleTimerRef.current);
    }
    setIsButtonIdle(prev => {
      if (prev) snapToEdge(false);
      return false;
    });
  }, [snapToEdge]);

  useEffect(() => {
    if (!isOpen) {
      startButtonIdleTimer();
    } else {
      clearButtonIdleTimer();
    }
    return () => {
      if (buttonIdleTimerRef.current) {
        clearTimeout(buttonIdleTimerRef.current);
      }
    };
  }, [isOpen, startButtonIdleTimer, clearButtonIdleTimer]);

  const welcomeMessage = {
    id: 'welcome',
    sender: 'ai',
    text: `Chào ${user?.fullName}, tôi có thể giúp gì cho bạn?`,
    time: new Date(),
  };

  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    const initConversation = async () => {
      try {
        const convs = await chatApi.getConversations();
        if (convs && convs.length > 0) {
          const latestConvId = convs[0].id;
          setConversationId(latestConvId);
          const msgs = await chatApi.getMessages(latestConvId);
          if (msgs && msgs.length > 0) {
            const formattedMsgs = msgs.map(m => ({
              id: m.id.toString(),
              sender: m.role?.toLowerCase() === 'user' ? 'user' : 'ai',
              text: m.content || '',
              time: m.createdAt,
            }));
            setMessages(formattedMsgs);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải lịch sử chat widget:', error);
      }
    };
    
    // Chỉ tải khi mở widget lần đầu (nếu chưa có lịch sử ngoài câu chào)
    if (isOpen && messages.length === 1 && messages[0].id === 'welcome') {
      initConversation();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    const newUserMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      time: new Date(),
    };
    
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [newUserMsg];
      }
      return [...prev, newUserMsg];
    });
    
    setInput('');
    setIsTyping(true);

    try {
      const reqData = { message: text };
      if (conversationId) {
        reqData.conversationId = conversationId;
      }
      
      const response = await chatApi.chat(reqData);
      
      if (response && response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }

      const newAiMsg = {
        id: response?.id ? response.id.toString() : (Date.now() + 1).toString(),
        sender: 'ai',
        text: response?.content || 'Xin lỗi, tôi không thể trả lời lúc này.',
        time: response?.createdAt || new Date(),
      };
      
      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.error('Lỗi API chat widget:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Lỗi kết nối. Vui lòng thử lại sau.',
        time: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Không hiển thị widget ở trang Copilot chính
  if (location.pathname === '/copilot') {
    return null;
  }

  return (
    <>
    {/* Invisible full-viewport element used as drag boundary */}
    <div ref={constraintsRef} className="fixed inset-0 z-[-1] pointer-events-none" />

    <motion.div 
      ref={wrapperRef}
      style={{ x, y }}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={constraintsRef}
      dragElastic={0}
      onDragStart={() => {
        isDraggingRef.current = true;
        clearButtonIdleTimer();
      }}
      onDragEnd={() => {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 150);
        if (!isOpen) startButtonIdleTimer();
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden origin-bottom-right"
          >
            {/* Header */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shadow-sm cursor-move touch-none"
            >
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <RobotOutlined className="text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">StockFlow AI</h3>
                  <div className="text-[11px] text-indigo-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    Đang hoạt động
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white border-none outline-none cursor-pointer transition-colors"
                style={{ background: 'transparent' }}
              >
                <CloseOutlined style={{ color: '#ffffff', fontSize: '16px' }} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1 text-[10px] ${
                      msg.sender === 'user' 
                        ? 'bg-slate-200 text-slate-600' 
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    }`}>
                      {msg.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    </div>
                    
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className={`px-3 py-2 rounded-2xl text-[13px] ${
                        msg.sender === 'user' 
                          ? 'bg-slate-800 text-white rounded-tr-sm shadow-sm' 
                          : 'bg-white text-slate-700 rounded-tl-sm border border-slate-200 shadow-sm'
                      }`}>
                        <div className={`break-words ${msg.sender === 'user' ? '' : 'prose prose-sm prose-slate max-w-none'}`}>
                          {msg.sender === 'user' ? (
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                          ) : (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                            >
                              {msg.text || ''}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start gap-2 max-w-[85%]">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mt-1">
                    <RobotOutlined className="text-[10px]" />
                  </div>
                  <div className="px-3 py-3 bg-white rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm flex items-center gap-1 h-9">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Hỏi StockAI..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder:text-slate-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className={`absolute right-1.5 p-1.5 rounded-lg flex items-center justify-center transition-colors ${
                    input.trim() && !isTyping
                      ? 'text-indigo-600 hover:bg-indigo-50' 
                      : 'text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <SendOutlined className="text-lg" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onPointerDown={(e) => dragControls.start(e)}
        onMouseEnter={clearButtonIdleTimer}
        onMouseLeave={() => {
          if (!isOpen) startButtonIdleTimer();
        }}
        animate={{
          opacity: isButtonIdle && !isOpen ? 0.6 : 1,
        }}
        whileHover={{ scale: 1.05, opacity: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          if (isDraggingRef.current) {
            e.preventDefault();
            return;
          }
          setIsOpen(!isOpen);
        }}
        className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-[0_8px_16px_rgba(79,70,229,0.3)] flex items-center justify-center text-2xl hover:shadow-[0_12px_24px_rgba(79,70,229,0.4)] transition-shadow cursor-move touch-none"
      >
        <RobotOutlined />
      </motion.button>
    </motion.div>
    </>
  );
}
