import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined, 
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Modal, message } from 'antd';
import { usePermissions } from '@/hooks/usePermissions';
import PageHeader from '@/components/ui/PageHeader';
import { chatApi } from '@/api/chat';
import { getErrorMessage } from '@/utils/getErrorMessage';
export default function CopilotPage() {
  const { role } = usePermissions();
  const { user } = useSelector(state => state.auth);
  
  const welcomeMessage = {
    id: 'welcome',
    sender: 'ai',
    text: `Xin chào ${user?.fullName}! Tôi là StockAI. Tôi có thể giúp bạn phân tích dữ liệu kho, truy xuất báo cáo tài chính, và tìm kiếm thông tin chênh lệch một cách nhanh chóng. Bạn cần tôi giúp gì hôm nay?`,
    time: new Date(),
  };

  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadConversationsList = async () => {
    try {
      const convs = await chatApi.getConversations();
      if (convs) {
        setConversations(convs);
      }
      return convs;
    } catch (error) {
      console.error('Lỗi khi tải danh sách hội thoại:', error);
      return [];
    }
  };

  const loadConversationMessages = async (id) => {
    try {
      const msgs = await chatApi.getMessages(id);
      if (msgs && msgs.length > 0) {
        const formattedMsgs = msgs.map(m => ({
          id: m.id.toString(),
          sender: m.role?.toLowerCase() === 'user' ? 'user' : 'ai',
          text: m.content || '',
          time: m.createdAt,
        }));
        setMessages(formattedMsgs);
      } else {
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Lỗi khi tải tin nhắn:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const convs = await loadConversationsList();
      if (convs && convs.length > 0) {
        setConversationId(convs[0].id);
        loadConversationMessages(convs[0].id);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Authorization check after hooks
  if (role !== 'ACCOUNTANT' && role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([welcomeMessage]);
  };

  const handleSelectConversation = (id) => {
    if (id === conversationId) return;
    setConversationId(id);
    loadConversationMessages(id);
  };

  const handleDeleteConversation = (id, e) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Xóa đoạn chat',
      content: 'Bạn có chắc chắn muốn xóa đoạn chat này không? Dữ liệu không thể khôi phục.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await chatApi.deleteConversation(id);
          message.success('Đã xóa đoạn chat');
          const newConvs = await loadConversationsList();
          if (id === conversationId) {
            if (newConvs && newConvs.length > 0) {
              setConversationId(newConvs[0].id);
              loadConversationMessages(newConvs[0].id);
            } else {
              handleNewChat();
            }
          }
        } catch (error) {
          message.error(getErrorMessage(error, 'Không thể xóa đoạn chat.'));
        }
      }
    });
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    // Add user message to UI immediately
    const newUserMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      time: new Date(),
    };
    
    // Nếu đang là new chat, xóa câu welcome
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [newUserMsg];
      }
      return [...prev, newUserMsg];
    });
    
    setInput('');
    setIsTyping(true);

    try {
      const reqData = { message: text.trim() };
      if (conversationId) {
        reqData.conversationId = conversationId;
      }
      
      const response = await chatApi.chat(reqData);
      
      let newConvCreated = false;
      if (response && response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
        newConvCreated = true;
      }

      const newAiMsg = {
        id: response?.id ? response.id.toString() : (Date.now() + 1).toString(),
        sender: 'ai',
        text: response?.content || 'Xin lỗi, tôi không thể trả lời lúc này.',
        time: response?.createdAt || new Date(),
      };
      
      setMessages(prev => [...prev, newAiMsg]);

      // Tải lại danh sách chat nếu vừa tạo chat mới
      if (newConvCreated) {
        await loadConversationsList();
      }
    } catch (error) {
      console.error('Lỗi khi gọi API chat:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Đã xảy ra lỗi kết nối với máy chủ AI. Vui lòng thử lại sau.',
        time: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
      <div className="shrink-0 px-6 pt-6 pb-2">
        <PageHeader 
          title={
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <RobotOutlined className="text-xl" />
              </div>
              <span className="font-bold tracking-tight">StockAI</span>
            </div>
          } 
          breadcrumb={[{ title: 'Hệ thống' }, { title: 'StockAI' }]}
        />
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6 flex gap-6 max-w-7xl mx-auto w-full">
        {/* Sidebar: Danh sách hội thoại */}
        <div className="w-64 shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors py-2.5 rounded-xl font-semibold text-sm border border-indigo-100 shadow-sm"
            >
              <PlusOutlined /> Cuộc trò chuyện mới
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gần đây
            </div>
            {conversations.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-400 text-center">
                Chưa có lịch sử chat
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 truncate group ${
                    conversationId === conv.id 
                      ? 'bg-slate-100 text-slate-800 font-medium' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <MessageOutlined className={conversationId === conv.id ? 'text-indigo-500' : 'text-slate-400'} />
                  <span className="truncate flex-1">{conv.title || 'Chat mới'}</span>
                  <DeleteOutlined 
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity" 
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                  />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                        msg.sender === 'user' 
                          ? 'bg-slate-200 text-slate-600' 
                          : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm'
                      }`}>
                        {msg.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      </div>
                      
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className={`px-5 py-3.5 rounded-2xl ${
                          msg.sender === 'user' 
                            ? 'bg-slate-800 text-white rounded-tr-sm shadow-md' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200'
                        }`}>
                          <div className={`text-[15px] leading-relaxed break-words ${msg.sender === 'user' ? '' : 'prose prose-sm prose-slate max-w-none'}`}>
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
                        <span className={`text-[11px] text-slate-400 font-medium px-1 ${
                          msg.sender === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {dayjs(msg.time).format('HH:mm')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start gap-3 max-w-[80%]"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mt-1 shadow-sm text-white">
                      <RobotOutlined />
                    </div>
                    <div className="px-5 py-4 bg-slate-100 rounded-2xl rounded-tl-sm border border-slate-200 flex items-center gap-1.5 h-12">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white p-4 border-t border-slate-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Hỏi StockAI bất cứ điều gì về dữ liệu kho..."
                className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[15px] placeholder:text-slate-400"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className={`absolute right-2 p-2.5 rounded-lg flex items-center justify-center transition-all ${
                  input.trim() && !isTyping
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <SendOutlined />
              </button>
            </div>
            <div className="text-center mt-3 text-[11px] text-slate-400 font-medium">
              StockAI có thể mắc sai lầm. Hãy luôn kiểm tra lại các số liệu tài chính quan trọng.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
