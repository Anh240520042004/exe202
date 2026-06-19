import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bot, LogIn, MessageSquare, Plus, Send, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiService } from '../../services/api';

const AIAssistant = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadChats = async () => {
    try {
      const response = await aiService.getChats();
      setChats(response.data.data || []);
    } catch {
      toast.error('Không tải được lịch sử chat');
    }
  };

  const startNewChat = () => {
    setCurrentChat(null);
    setMessages([]);
    setInput('');
  };

  const selectChat = async (chat) => {
    try {
      const response = await aiService.getById(chat._id);
      setCurrentChat(response.data.data);
      setMessages(response.data.data.messages || []);
    } catch {
      toast.error('Không tải được cuộc trò chuyện');
    }
  };

  const deleteChat = async (event, chatId) => {
    event.stopPropagation();
    try {
      await aiService.deleteChat(chatId);
      setChats((prev) => prev.filter((chat) => chat._id !== chatId));
      if (currentChat?._id === chatId) {
        startNewChat();
      }
    } catch {
      toast.error('Không xóa được cuộc trò chuyện');
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    const content = input.trim();
    if (!content || isTyping) return;

    const optimisticMessage = {
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiService.chatbot({
        message: content,
        chatId: currentChat?._id,
      });

      const { chat, message } = response.data.data;
      setCurrentChat(chat);
      setMessages(chat.messages || [...messages, optimisticMessage, message]);
      loadChats();
    } catch {
      toast.error('AI Chatbot GPT hiện chưa phản hồi được');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
        <div className="text-center max-w-md glass-card rounded-[1.75rem] p-8">
          <div className="w-20 h-20 bg-primary-400/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-10 h-10 text-primary-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white mb-2">AI Chatbot GPT</h1>
          <p className="text-blue-100/75 mb-6">Đăng nhập để trò chuyện với chatbot GPT của F.EdTech.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="glass-nav-link px-6 py-3 bg-primary-400/60 text-white rounded-2xl font-medium hover:bg-primary-500/70 flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </Link>
            <Link to="/register" className="glass-nav-link px-6 py-3 glass-subtle rounded-2xl font-medium text-slate-800 dark:text-blue-100">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
      <div className="chat-shell flex h-[calc(100vh-7rem)] max-w-[1400px] mx-auto">
        <aside className="chat-sidebar w-80 flex flex-col flex-shrink-0 rounded-l-[inherit]">
          <div className="p-4 border-b glass-divider">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="text-primary-300" />
              <h1 className="font-bold text-lg text-slate-950 dark:text-white">AI Chatbot GPT</h1>
            </div>

            <button
              onClick={startNewChat}
              className="glass-nav-link w-full py-2.5 bg-primary-400/50 text-white rounded-xl hover:bg-primary-500/60 flex items-center justify-center gap-2 border border-white/10"
            >
              <Plus size={18} />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-slate-600 dark:text-blue-100/60">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Chưa có lịch sử chat</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectChat(chat)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') selectChat(chat);
                  }}
                  className={`glass-nav-link w-full p-3 rounded-xl group flex items-center justify-between text-left ${
                    currentChat?._id === chat._id ? 'glass-nav-active' : 'glass-nav-hover'
                  }`}
                >
                  <div className="flex-1 truncate min-w-0">
                    <p className="font-semibold truncate text-slate-800 dark:text-gray-200">{chat.title || 'AI Chatbot GPT'}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-blue-100/55">
                      {new Date(chat.lastMessageAt || chat.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => deleteChat(event, chat._id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') deleteChat(event, chat._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-600 dark:text-blue-100/50 dark:hover:text-red-300"
                    aria-label="Xóa chat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 rounded-r-[inherit]">
          <div className="p-4 border-b glass-divider glass-subtle/40">
            <h2 className="font-bold text-slate-950 dark:text-white">{currentChat?.title || 'AI Chatbot GPT'}</h2>
            <p className="text-sm text-blue-100/60">Hỏi bất kỳ điều gì, chatbot sẽ trả lời bằng GPT.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 glass-subtle rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bot size={40} className="text-primary-300" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-slate-950 dark:text-white">AI Chatbot GPT</h2>
                  <p className="text-blue-100/70 mb-6">Bạn có thể hỏi về môn học, mentor, tài liệu, code, ý tưởng dự án hoặc bất kỳ điều gì cần hỗ trợ.</p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={message._id || index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-primary-500/40 border border-primary-400/30'
                    : 'bg-primary-400/20 border border-white/10'
                }`}>
                  {message.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-primary-300" />}
                </div>

                <div className={`max-w-[76%] px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'chat-bubble-user text-white'
                    : 'chat-bubble-ai text-slate-800 dark:text-gray-100'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-400/20 flex items-center justify-center border border-white/10">
                  <Bot size={16} className="text-primary-300" />
                </div>
                <div className="chat-bubble-ai px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <div key={delay} className="w-2 h-2 bg-blue-100/70 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t glass-divider">
            <div className="chat-input-bar flex gap-3 p-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Hỏi bất kỳ điều gì..."
                className="flex-1 px-4 py-2.5 bg-transparent text-slate-900 placeholder-slate-500 focus:outline-none dark:text-gray-100 dark:placeholder-blue-100/45"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="glass-nav-link px-5 py-2.5 bg-primary-400/60 text-white rounded-xl hover:bg-primary-500/70 disabled:opacity-40 flex items-center gap-2 border border-white/10"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AIAssistant;
