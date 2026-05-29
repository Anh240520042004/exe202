import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { Link, useLocation } from 'react-router-dom';
import { Send, Paperclip, Image, X, Phone, MoreVertical, Search } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
let socket = null;

const getId = (value) => value?._id || value?.id || value;

const buildPendingConversation = (user) => ({
  _id: `follow-${getId(user)}`,
  type: 'direct',
  participants: [user],
  displayName: user?.name || 'Unknown',
  displayAvatar: user?.avatar,
  otherUser: user,
  lastMessage: null,
  unreadCount: 0,
  isPending: true,
});

const MessageBubble = ({ message, currentUserId }) => {
  const isOwn = message.sender?._id === currentUserId || message.sender === currentUserId;
  const isImage = message.type === 'image';
  const isFile = message.type === 'file';

  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <img
          src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${message.sender?.name || 'U'}&background=6366f1&color=fff&size=40`}
          alt={message.sender?.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
        />
      )}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {isImage ? (
          <img src={message.attachmentUrl} alt="" className="max-w-xs rounded-2xl max-h-64 object-cover" />
        ) : isFile ? (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm hover:bg-white/15 transition-colors"
          >
            <Paperclip className="w-4 h-4 text-primary-400" />
            <span className="text-white/80 truncate max-w-[200px]">{message.attachmentName || 'File'}</span>
          </a>
        ) : (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? 'chat-bubble-user text-white'
              : 'chat-bubble-ai text-gray-200'
          }`}>
            {message.content}
          </div>
        )}
        <span className="text-white/25 text-xs px-1">
          {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

const ConversationItem = ({ conv, isActive, onClick, currentUserId }) => {
  const other = conv.type === 'direct' ? conv.otherUser : null;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 glass-nav-hover rounded-xl transition-all text-left ${isActive ? 'glass-nav-active' : ''}`}
    >
      {other?.avatar || conv.displayAvatar ? (
        <img
          src={other?.avatar || conv.displayAvatar}
          alt={conv.displayName}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {conv.displayName?.[0]?.toUpperCase() || 'G'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-semibold text-sm truncate ${conv.unreadCount > 0 ? 'text-white' : 'text-white/80'}`}>
            {conv.displayName || 'Unknown'}
          </p>
          {conv.lastMessage?.createdAt && (
            <span className="text-white/30 text-xs flex-shrink-0">
              {new Date(conv.lastMessage.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
        {conv.lastMessage && (
          <p className="text-white/40 text-xs truncate mt-0.5">
            {conv.lastMessage.sender === currentUserId ? 'Ban: ' : ''}{conv.lastMessage.content || (conv.lastMessage.type === 'image' ? '[Hinh anh]' : '[File]')}
          </p>
        )}
        {!conv.lastMessage && conv.isPending && (
          <p className="text-white/30 text-xs truncate mt-0.5">Bat dau nhan tin</p>
        )}
      </div>
      {conv.unreadCount > 0 && (
        <div className="w-5 h-5 bg-primary-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0">
          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
        </div>
      )}
    </button>
  );
};

export default function ChatPage() {
  const { user, accessToken, isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();
  // Navigate state: { participantId } from profile page
  const navigateState = location.state || {};
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserId = user?.id || user?._id;

  // Socket connection
  useEffect(() => {
    if (!accessToken) return;

    socket = io(API_URL, { auth: { token: accessToken }, reconnectionAttempts: 5 });

    socket.on('connect', () => console.log('[Socket] Connected'));
    socket.on('message:new', (message) => {
      if (activeConv && message.conversation === activeConv._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        socket.emit('message:seen', { conversationId: activeConv._id, messageId: message._id });
      }
      setConversations(prev => prev.map(c =>
        c._id === message.conversation
          ? { ...c, lastMessage: { content: message.content, sender: message.sender, createdAt: message.createdAt } }
          : c
      ));
    });

    socket.on('typing:start', ({ conversationId, userId }) => {
      if (activeConv?._id === conversationId && userId !== currentUserId) {
        setTypingUser(userId);
      }
    });

    socket.on('typing:stop', ({ conversationId, userId }) => {
      if (activeConv?._id === conversationId && userId === typingUser) {
        setTypingUser(null);
      }
    });

    socket.on('message:seen', ({ conversationId }) => {
      if (activeConv?._id === conversationId) {
        setMessages(prev => prev.map(m => ({
          ...m,
          seenBy: [...(m.seenBy || []), currentUserId],
        })));
      }
    });

    return () => { if (socket) socket.disconnect(); };
  }, [accessToken, activeConv?._id, currentUserId, typingUser]);

  // Fetch conversations — try to auto-select based on navigate state
  useEffect(() => {
    if (!accessToken) return;
    const fetchConvs = async () => {
      try {
        const json = await fetch(`${API_URL}/api/conversations`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(r => r.json());
        const convs = json.data || [];

        let followingUsers = [];
        if (currentUserId) {
          const followingJson = await fetch(`${API_URL}/api/users/${currentUserId}/following`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }).then(r => r.json());
          followingUsers = followingJson.data?.users || [];
        }

        const existingUserIds = new Set(
          convs
            .map(c => getId(c.otherUser) || getId(c.participants?.find(p => getId(p) !== currentUserId)))
            .filter(Boolean)
            .map(String)
        );
        const pendingConvs = followingUsers
          .filter(followed => !existingUserIds.has(String(getId(followed))))
          .map(buildPendingConversation);

        const mergedConvs = [...convs, ...pendingConvs];
        setConversations(mergedConvs);

        // Auto-select conversation with the participant we navigated from
        if (navigateState.participantId) {
          const match = mergedConvs.find(c =>
            c.type === 'direct' &&
            (getId(c.otherUser) === navigateState.participantId ||
              c.participants?.some(p => getId(p) === navigateState.participantId))
          );
          if (match) setActiveConv(match);
        } else if (navigateState.conversationId) {
          const match = mergedConvs.find(c => c._id === navigateState.conversationId);
          if (match) setActiveConv(match);
        }
      } catch (err) { console.error('Failed to fetch conversations:', err); }
    };
    fetchConvs();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch messages when selecting conversation
  useEffect(() => {
    if (!activeConv || !accessToken) return;
    if (activeConv.isPending) return;
    const fetchMessages = async () => {
      try {
        const json = await fetch(`${API_URL}/api/conversations/${activeConv._id}/messages`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(r => r.json());
        setMessages(json.data?.messages || []);

        if (socket) {
          socket.emit('conversation:join', activeConv._id);
          socket.emit('message:seen', { conversationId: activeConv._id });
        }
      } catch (err) { console.error('Failed to fetch messages:', err); }
    };
    fetchMessages();
    return () => {
      if (socket && activeConv) socket.emit('conversation:leave', activeConv._id);
    };
  }, [activeConv?._id, accessToken]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      if (socket && activeConv) socket.emit('typing:start', { conversationId: activeConv._id });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && activeConv) socket.emit('typing:stop', { conversationId: activeConv._id });
    }, 2000);
  };

  const handleSend = () => {
    if (!input.trim() || !activeConv) return;
    const content = input.trim();
    setInput('');
    if (socket) {
      socket.emit('message:send', { conversationId: activeConv._id, content, type: 'text' });
      socket.emit('typing:stop', { conversationId: activeConv._id });
    }
  };

  const openConversation = async (conv) => {
    if (!conv.isPending) {
      setActiveConv(conv);
      return;
    }

    try {
      const participantId = getId(conv.otherUser);
      const json = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId }),
      }).then(r => r.json());

      if (!json.success) throw new Error(json.message);

      const created = {
        ...json.data,
        displayName: conv.displayName,
        displayAvatar: conv.displayAvatar,
        otherUser: conv.otherUser,
        unreadCount: 0,
      };

      setConversations(prev => prev.map(item => item._id === conv._id ? created : item));
      setMessages([]);
      setActiveConv(created);
    } catch (err) {
      console.error('Failed to open conversation:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-white/50 mb-4">Vui long dang nhap de su dung chat</p>
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Dang nhap ngay</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="chat-shell flex h-[calc(100vh-7rem)] max-w-[1400px] mx-auto text-white">
      {/* Conversation List */}
      <div className={`chat-sidebar w-80 flex flex-col flex-shrink-0 rounded-l-[inherit] ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b glass-divider">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Tin nhắn</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm cuộc trò chuyện..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-9 pr-3 py-2 text-gray-200 placeholder-gray-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.filter(c =>
            c.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
          ).map(conv => (
            <ConversationItem
              key={conv._id}
              conv={conv}
              isActive={activeConv?._id === conv._id}
              onClick={() => openConversation(conv)}
              currentUserId={currentUserId}
            />
          ))}
          {conversations.length === 0 && (
            <p className="text-center text-white/30 text-sm py-8">Chua co cuoc tro chuyen nao</p>
          )}
        </div>
      </div>

      {/* Chat Window */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0 rounded-r-[inherit]">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b glass-divider glass-subtle/30">
            <button
              onClick={() => setActiveConv(null)}
              className="md:hidden w-8 h-8 flex items-center justify-center text-white/50"
            >
              <X className="w-5 h-5" />
            </button>
            {activeConv.otherUser?.avatar ? (
              <img
                src={activeConv.otherUser.avatar}
                alt={activeConv.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                {activeConv.displayName?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{activeConv.displayName}</p>
              {typingUser && (
                <p className="text-primary-400 text-xs">Dang nhap...</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.map(msg => (
              <MessageBubble
                key={msg._id}
                message={msg}
                currentUserId={currentUserId}
              />
            ))}
            {activeConv.isPending && (
              <div className="flex h-full items-center justify-center">
                <p className="text-white/30 text-sm">Gui tin nhan dau tien de bat dau cuoc tro chuyen</p>
              </div>
            )}
            {typingUser && (
              <div className="flex items-center gap-2 text-white/30 text-sm px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>dang nhap</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t glass-divider">
            <div className="chat-input-bar flex items-end gap-2 px-4 py-2">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhan tin..."
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none resize-none py-1.5 max-h-32"
                style={{ minHeight: '36px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 bg-primary-400/60 rounded-xl text-white hover:bg-primary-500/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 border border-white/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center rounded-r-[inherit]">
          <div className="text-center glass-subtle rounded-2xl p-10 mx-6">
            <div className="w-20 h-20 mx-auto rounded-full glass-chip flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg mb-2">Chọn cuộc trò chuyện</p>
            <p className="text-gray-500 text-sm">Chọn một cuộc trò chuyện từ danh sách bên trái</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
