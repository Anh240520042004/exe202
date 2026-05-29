import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { aiService } from '../../services/api';
import { Send, Bot, User, Sparkles, BookOpen, FileText, Trash2, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const AIAssistant = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('General');
  const messagesEndRef = useRef(null);

  const subjects = ['General', 'SWP391', 'PRJ301', 'DBI202', 'MAD101'];

  useEffect(() => {
    if (isAuthenticated) loadChats();
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      const response = await aiService.getChats();
      setChats(response.data.data || []);
    } catch {
      console.error('Failed to load chats');
    }
  };

  const createNewChat = async () => {
    try {
      const response = await aiService.createChat({ subject: selectedSubject });
      setChats([response.data.data, ...chats]);
      setCurrentChat(response.data.data);
      setMessages([]);
    } catch {
      toast.error('Failed to create chat');
    }
  };

  const selectChat = async (chat) => {
    try {
      const response = await aiService.getById(chat._id);
      setCurrentChat(response.data.data);
      setMessages(response.data.data.messages || []);
    } catch {
      toast.error('Failed to load chat');
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await aiService.deleteChat(chatId);
      setChats(chats.filter(c => c._id !== chatId));
      if (currentChat?._id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChat) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiService.sendMessage(currentChat._id, { content: input, subject: selectedSubject });
      setMessages(prev => [...prev, response.data.data.message]);
      loadChats();
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedPrompts = {
    General: ['Explain this concept in simple terms', 'Give me an example', 'What are the key points?'],
    SWP391: ['Explain design patterns', 'How to implement MVC?', 'What are SOLID principles?'],
    PRJ301: ['Explain Agile methodology', 'How to write user stories?', 'Scrum vs Kanban?'],
  };

  const GuestLoginPrompt = ({ message = 'vui lòng đăng nhập để sử dụng tính năng này' }) => (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md glass-card rounded-[1.75rem] p-8">
        <div className="w-20 h-20 bg-primary-400/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Chào mừng đến AI Assistant!</h2>
        <p className="text-gray-400 mb-6">Bạn cần {message}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/login" className="glass-nav-link px-6 py-3 bg-primary-400/60 text-white rounded-2xl font-medium hover:bg-primary-500/70 flex items-center gap-2">
            <LogIn className="w-4 h-4" /> Đăng nhập
          </Link>
          <Link to="/register" className="glass-nav-link px-6 py-3 glass-subtle rounded-2xl font-medium text-gray-300">
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
      <div className="chat-shell flex h-[calc(100vh-7rem)] max-w-[1400px] mx-auto">
        <aside className="chat-sidebar w-80 flex flex-col flex-shrink-0 rounded-l-[inherit]">
          <div className="p-4 border-b glass-divider">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-primary-400" />
              <h1 className="font-bold text-lg text-white">AI Study Assistant</h1>
            </div>

            {isAuthenticated ? (
              <>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="glass-input w-full px-3 py-2 mb-3 text-gray-200"
                >
                  {subjects.map(s => (
                    <option key={s} value={s} className="bg-gray-900">{s}</option>
                  ))}
                </select>
                <button
                  onClick={createNewChat}
                  className="glass-nav-link w-full py-2.5 bg-primary-400/50 text-white rounded-xl hover:bg-primary-500/60 flex items-center justify-center gap-2 border border-white/10"
                >
                  <Sparkles size={18} /> New Chat
                </button>
              </>
            ) : (
              <div className="glass-subtle rounded-xl p-3 text-center">
                <p className="text-sm text-gray-400">Đăng nhập để tạo cuộc trò chuyện</p>
                <Link to="/login" className="mt-2 inline-flex items-center gap-1 text-sm text-primary-400 font-medium hover:text-primary-300">
                  <LogIn className="w-3 h-3" /> Đăng nhập
                </Link>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {isAuthenticated ? (
              chats.map(chat => (
                <div
                  key={chat._id}
                  className={`glass-nav-link p-3 rounded-xl cursor-pointer group flex items-center justify-between ${
                    currentChat?._id === chat._id ? 'glass-nav-active' : 'glass-nav-hover'
                  }`}
                >
                  <div className="flex-1 truncate min-w-0" onClick={() => selectChat(chat)}>
                    <p className="font-medium truncate text-gray-200">{chat.title}</p>
                    <p className="text-xs text-gray-500">{chat.subject}</p>
                  </div>
                  <button
                    onClick={() => deleteChat(chat._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-gray-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Đăng nhập để xem lịch sử chat</p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 rounded-r-[inherit]">
          {!isAuthenticated ? (
            <GuestLoginPrompt message="đăng nhập để bắt đầu trò chuyện với AI" />
          ) : !currentChat ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 glass-subtle rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bot size={40} className="text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white">AI Study Assistant</h2>
                <p className="text-gray-400 mb-6">
                  Hỗ trợ học tập, tóm tắt PDF, tạo flashcard và nhiều hơn nữa!
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => { setSelectedSubject('SWP391'); createNewChat(); }}
                    className="glass-hover-card glass-subtle p-4 rounded-2xl text-gray-200"
                  >
                    <BookOpen className="mx-auto mb-2 text-primary-400" />
                    <span className="text-sm font-medium">Course Help</span>
                  </button>
                  <button
                    onClick={() => { setSelectedSubject('General'); createNewChat(); }}
                    className="glass-hover-card glass-subtle p-4 rounded-2xl text-gray-200"
                  >
                    <FileText className="mx-auto mb-2 text-primary-400" />
                    <span className="text-sm font-medium">Summarize PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b glass-divider glass-subtle/50">
                <h2 className="font-bold text-white">{currentChat.title}</h2>
                <p className="text-sm text-gray-500">{currentChat.subject}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Thử các gợi ý sau:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(suggestedPrompts[selectedSubject] || suggestedPrompts.General).map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(prompt)}
                          className="glass-chip glass-nav-link px-3 py-1.5 text-primary-300 text-sm"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, index) => (
                  <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-primary-500/40 border border-primary-400/30' : 'bg-primary-400/20 border border-white/10'
                    }`}>
                      {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-primary-300" />}
                    </div>
                    <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user' ? 'chat-bubble-user text-white' : 'chat-bubble-ai text-gray-200'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
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
                          <div key={delay} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
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
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Hỏi bất cứ điều gì..."
                    className="flex-1 px-4 py-2.5 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none"
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AIAssistant;
