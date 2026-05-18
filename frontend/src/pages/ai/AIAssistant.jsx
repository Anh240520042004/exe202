import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { aiService } from '../../services/api';
import { Send, Bot, User, Sparkles, BookOpen, FileText, Zap, Code, Map, Trash2, LogIn } from 'lucide-react';
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
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      const response = await aiService.getChats();
      setChats(response.data.data || []);
    } catch (error) {
      console.error('Failed to load chats');
    }
  };

  const createNewChat = async () => {
    try {
      const response = await aiService.createChat({ subject: selectedSubject });
      setChats([response.data.data, ...chats]);
      setCurrentChat(response.data.data);
      setMessages([]);
    } catch (error) {
      toast.error('Failed to create chat');
    }
  };

  const selectChat = async (chat) => {
    try {
      const response = await aiService.getById(chat._id);
      setCurrentChat(response.data.data);
      setMessages(response.data.data.messages || []);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      toast.error('Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedPrompts = {
    General: [
      'Explain this concept in simple terms',
      'Give me an example',
      'What are the key points?',
    ],
    SWP391: [
      'Explain design patterns',
      'How to implement MVC?',
      'What are SOLID principles?',
    ],
    PRJ301: [
      'Explain Agile methodology',
      'How to write user stories?',
      'Scrum vs Kanban?',
    ],
  };

  // Guest Login Prompt Component
  const GuestLoginPrompt = ({ message = 'vui lòng đăng nhập để sử dụng tính năng này' }) => (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Chào mừng đến AI Assistant!</h2>
        <p className="text-gray-500 mb-6">
          Bạn cần {message}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 flex items-center gap-2 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <aside className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-purple-600" />
            <h1 className="font-bold text-lg">AI Study Assistant</h1>
          </div>

          {isAuthenticated ? (
            <>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 mb-3"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={createNewChat}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                New Chat
              </button>
            </>
          ) : (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Đăng nhập để tạo cuộc trò chuyện
              </p>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline"
              >
                <LogIn className="w-3 h-3" /> Đăng nhập
              </Link>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isAuthenticated ? (
            chats.map(chat => (
              <div
                key={chat._id}
                className={`p-3 rounded-lg cursor-pointer group flex items-center justify-between ${
                  currentChat?._id === chat._id ? 'bg-purple-100 dark:bg-purple-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex-1 truncate" onClick={() => selectChat(chat)}>
                  <p className="font-medium truncate">{chat.title}</p>
                  <p className="text-xs text-gray-500">{chat.subject}</p>
                </div>
                <button
                  onClick={() => deleteChat(chat._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Đăng nhập để xem lịch sử chat</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {!isAuthenticated ? (
          <GuestLoginPrompt message="đăng nhập để bắt đầu trò chuyện với AI" />
        ) : !currentChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot size={40} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">AI Study Assistant</h2>
              <p className="text-gray-500 mb-6">
                Get help with your courses, summarize PDFs, generate flashcards, and more!
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setSelectedSubject('SWP391');
                    createNewChat();
                  }}
                  className="p-4 border rounded-xl hover:border-purple-500 transition-colors"
                >
                  <BookOpen className="mx-auto mb-2 text-purple-600" />
                  <span className="text-sm font-medium">Course Help</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedSubject('General');
                    createNewChat();
                  }}
                  className="p-4 border rounded-xl hover:border-purple-500 transition-colors"
                >
                  <FileText className="mx-auto mb-2 text-purple-600" />
                  <span className="text-sm font-medium">Summarize PDF</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="font-bold">{currentChat.title}</h2>
              <p className="text-sm text-gray-500">{currentChat.subject}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Try these prompts:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(suggestedPrompts[selectedSubject] || suggestedPrompts.General).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(prompt)}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm hover:bg-purple-200"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default AIAssistant;
