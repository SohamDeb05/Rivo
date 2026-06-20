import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Send, User, Sparkles, PanelLeft, SquarePen, Search, Store, Menu, Image as ImageIcon, Mic, MessageSquare, Settings, HelpCircle, History, Square, Trash, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { AuthModal } from '@/components/ui/auth-modal';
import './index.css';

interface Message {
  role: 'user' | 'model';
  content: string;
  isAnimated?: boolean;
}

const TypingMessage = ({ content, isAnimating, onComplete, onTyping, onStop }: { content: string, isAnimating?: boolean, onComplete?: () => void, onTyping?: () => void, onStop?: (partialContent: string) => void }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  
  useEffect(() => {
    if (isAnimating === false && displayedContent.length > 0) {
      onStop?.(displayedContent);
      return;
    }

    let index = displayedContent.length;
    const timer = setInterval(() => {
      index++;
      setDisplayedContent(content.substring(0, index));
      onTyping?.();
      
      if (index >= content.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 15);

    return () => clearInterval(timer);
  }, [content, isAnimating]);

  return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};

const greetings = [
  "What's on the agenda today?",
  "How can I help you right now?",
  "Ready to build something amazing?",
  "What shall we create today?",
  "Awaiting your instructions..."
];

const HackerGreeting = () => {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIndex(prev => (prev + 1) % greetings.length);
    }, 45000); // Change greeting every 45 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let targetText = greetings[greetingIndex];
    let charIndex = 0;
    let isCancelled = false;
    const chars = '!<>-_\\\\/[]{}—=+*^?#_';

    const typeNextChar = () => {
      if (isCancelled) return;
      if (charIndex > targetText.length) return;
      
      let garbageTicks = 0;
      const maxTicks = 4; // Number of garbage characters to show before resolving
      
      const tickGarbage = () => {
        if (isCancelled) return;
        if (garbageTicks < maxTicks && charIndex < targetText.length) {
          const randomChar = chars[Math.floor(Math.random() * chars.length)];
          setDisplayedText(targetText.slice(0, charIndex) + randomChar);
          garbageTicks++;
          setTimeout(tickGarbage, 30);
        } else {
          setDisplayedText(targetText.slice(0, charIndex + 1));
          charIndex++;
          if (charIndex <= targetText.length) {
            setTimeout(typeNextChar, 80); // Base typing speed
          }
        }
      };
      tickGarbage();
    };

    typeNextChar();

    return () => {
      isCancelled = true;
    };
  }, [greetingIndex]);

  return <h2>{displayedText}</h2>;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, chatId: string} | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('googleUser');
    localStorage.removeItem('guestId');
    setMessages([]);
    setChatHistoryList([]);
    setCurrentChatId(null);
    setIsProfileMenuOpen(false);
    setShowAuthModal(true);
  };

  // We remove the localStorage effect so it doesn't force it open on reload
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistoryList, setChatHistoryList] = useState<any[]>([]);
  
  // Auth & Guest State
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [forceSignIn, setForceSignIn] = useState(false);
  const [guestCount, setGuestCount] = useState(() => parseInt(localStorage.getItem('guestCount') || '0', 10));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchChats = async (uid?: string) => {
    try {
      const currentUserId = uid || (user ? user.sub : localStorage.getItem('guestId'));
      if (!currentUserId) return;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';
      const response = await axios.get(`${apiUrl}/api/chats?userId=${currentUserId}`);
      setChatHistoryList(response.data);
    } catch (error) {
      console.error('Error fetching chat history list:', error);
    }
  };

  const handleLoginSuccess = async (tokenResponse: any) => {
    try {
      const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const userData = res.data; // contains { sub, name, email, picture }
      setUser(userData);
      localStorage.setItem('googleUser', JSON.stringify(userData));
      setShowAuthModal(false);
      
      const guestId = localStorage.getItem('guestId');
      if (guestId) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';
          await axios.post(`${apiUrl}/api/chats/link`, {
            guestId,
            userId: userData.sub
          });
        } catch (e) {
          console.error('Failed to link guest chats', e);
        }
      }

      fetchChats(userData.sub);
    } catch (error) {
      console.error('Failed to fetch user info', error);
      alert('Login failed. Please try again.');
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('googleUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchChats(parsed.sub);
      } catch (e) {
        localStorage.removeItem('googleUser');
        fetchChats(localStorage.getItem('guestId') || 'guest');
      }
    } else {
      fetchChats(localStorage.getItem('guestId') || 'guest');
    }

    if (!localStorage.getItem('hasSeenAuth') && !savedUser) {
      setShowAuthModal(true);
      localStorage.setItem('hasSeenAuth', 'true');
    }

    if (!localStorage.getItem('guestId')) {
      localStorage.setItem('guestId', 'guest-' + Math.random().toString(36).substring(2, 9));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const executeSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    if (!user && guestCount >= 10) {
      setForceSignIn(true);
      setShowAuthModal(true);
      return;
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const currentUserId = user ? user.sub : localStorage.getItem('guestId');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';
      const response = await axios.post(`${apiUrl}/api/chat`, {
        message: textToSend,
        chatId: currentChatId,
        userId: currentUserId
      }, {
        signal: abortControllerRef.current.signal
      });

      const botMessage: Message = { role: 'model', content: response.data.response, isAnimated: false };
      setMessages(prev => [...prev, botMessage]);
      setIsAnimating(true);
      
      if (!user) {
        const newCount = guestCount + 1;
        setGuestCount(newCount);
        localStorage.setItem('guestCount', newCount.toString());
      }

      if (!currentChatId && response.data.chatId) {
        setCurrentChatId(response.data.chatId);
        fetchChats(); // Refresh the sidebar list
      }

      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        const notifText = response.data.response.length > 60 
          ? response.data.response.substring(0, 60) + '...' 
          : response.data.response;
        new Notification('Rivo', { body: notifText });
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled by user');
        return; // Exit early without setting error message or changing loading state
      }
      console.error('Error fetching response:', error);
      const errorMessage: Message = { 
        role: 'model', 
        content: 'Sorry, I encountered an error connecting to the AI server. Please check if the backend is running and your API key is correct.',
        isAnimated: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    executeSend(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setCurrentChatId(null);
  };

  const loadChat = async (id: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';
      const response = await axios.get(`${apiUrl}/api/chats/${id}`);
      setCurrentChatId(id);
      setMessages(response.data.messages);
      if (window.innerWidth < 640) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';
      await axios.delete(`${apiUrl}/api/chats/${id}`);
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
      fetchChats();
      setContextMenu(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleSuggestionClick = (text: string) => {
    executeSend(text);
  };

  const renderInput = (isCentered = false) => (
    <div className={`flex flex-col w-full transition-all duration-300 ${isCentered ? 'max-w-[800px]' : 'max-w-3xl mx-auto'}`}>
      <div className="flex items-center bg-[#1e1f20]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-4 py-2 w-full transition-all duration-300">
        <button className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 shrink-0">
          <ImageIcon size={20} />
        </button>
        <input
          type="text"
          className={`flex-1 bg-transparent border-none outline-none text-gray-200 px-3 placeholder-gray-500 w-full ${isCentered ? 'text-lg' : 'text-base'}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
        />
        <div className="flex items-center shrink-0 gap-1">
          <button className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
            <Mic size={20} />
          </button>
          {isLoading || isAnimating ? (
            <button 
              className="flex items-center justify-center transition-all rounded-full bg-white hover:bg-gray-200 text-black w-[36px] h-[36px]" 
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                  abortControllerRef.current = null;
                }
                setIsLoading(false);
                setIsAnimating(false);
              }}
              title="Stop generating"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button 
              className={`flex items-center justify-center transition-all rounded-full ${input.trim() ? 'text-white bg-white/10 hover:bg-white/20' : 'text-gray-600'} w-[36px] h-[36px]`} 
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send size={18} className="mr-0.5 mt-0.5" />
            </button>
          )}
        </div>
      </div>
      <div className="disclaimer-text">
        Rivo can make mistakes. Consider verifying important information.
      </div>
    </div>
  );

  return (
    <div className="app-container" onClick={() => setContextMenu(null)}>
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-[#1e1f20]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl p-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg flex items-center gap-3 transition-colors font-medium"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteChat(contextMenu.chatId);
            }}
          >
            <Trash size={16} /> Delete Chat
          </button>
        </div>
      )}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          if (!forceSignIn) setShowAuthModal(false);
        }} 
        forceSignIn={forceSignIn}
        onSuccess={handleLoginSuccess}
      />
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'} flex flex-col`}>
        <div className={`p-4 flex items-center shrink-0 ${isSidebarOpen ? '' : 'justify-center'}`}>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            <Menu size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {isSidebarOpen && (
            <>
              <div className="px-4 py-2 flex shrink-0">
                <button 
                  onClick={handleNewChat} 
                  className="flex items-center text-gray-200 transition-colors rounded-full font-medium text-sm border border-white/5 gap-3 bg-[#1e1f20] hover:bg-[#2a2b2c] py-2.5 px-4 w-full"
                  title="New chat"
                >
                  <Plus size={20} className="shrink-0" />
                  <span>New chat</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4 px-4">
                <h3 className="text-xs font-semibold text-gray-500 mb-3 px-2">Recent</h3>
                {chatHistoryList.map((chat) => (
                  <button 
                    key={chat._id} 
                    onClick={() => loadChat(chat._id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, chatId: chat._id });
                    }}
                    className={`flex items-center w-full py-2.5 rounded-xl transition-colors text-sm text-left truncate gap-3 px-3 ${currentChatId === chat._id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                  >
                    <MessageSquare size={16} className="shrink-0" />
                    <span className="truncate">{chat.title || 'New Chat'}</span>
                  </button>
                ))}
              </div>
              

            </>
          )}
        </div>

        <div ref={profileMenuRef} className={`mt-auto shrink-0 p-3 relative border-t border-white/10 ${isSidebarOpen ? '' : 'flex justify-center'}`}>
          {user && isProfileMenuOpen && (
            <div className={`absolute bottom-full left-3 mb-2 bg-[#2f2f2f] border border-white/10 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${isSidebarOpen ? 'w-[260px]' : 'w-[260px] left-14 bottom-0 mb-0'}`}>
              <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[#6a737d] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-white truncate leading-tight">{user.name || user.email}</span>
                  <span className="text-xs text-gray-400 leading-tight">Go</span>
                </div>
              </div>
              
              <div className="h-px bg-white/10 my-1 mx-1" />
              
              <button className="flex items-center w-full gap-3 px-2 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
                <Sparkles size={16} /> Upgrade plan
              </button>
              <button className="flex items-center w-full gap-3 px-2 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
                <Sparkles size={16} /> Personalization
              </button>
              <button className="flex items-center w-full gap-3 px-2 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
                <User size={16} /> Profile
              </button>
              <button className="flex items-center w-full gap-3 px-2 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
                <Settings size={16} /> Settings
              </button>
              
              <div className="h-px bg-white/10 my-1 mx-1" />
              
              <button className="flex items-center w-full gap-3 px-2 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
                <HelpCircle size={16} /> Help
              </button>
              <button onClick={handleLogout} className="flex items-center w-full gap-3 px-2 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}

          {user ? (
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`flex items-center gap-3 transition-colors rounded-xl ${isSidebarOpen ? 'hover:bg-white/5 w-full text-left p-2' : 'w-10 h-10 hover:bg-white/10 justify-center p-0'}`}
            >
              <div className="w-8 h-8 rounded-full bg-[#6a737d] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
              </div>
              {isSidebarOpen && (
                <>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-sm font-medium text-white truncate leading-tight">{user.name || user.email}</span>
                    <span className="text-xs text-gray-400 leading-tight text-left">Go</span>
                  </div>
                  <div className="w-px h-5 bg-white/15 mx-1" />
                  <Store size={18} className="text-gray-400 shrink-0" />
                </>
              )}
            </button>
          ) : (
            <button 
              className={`flex items-center gap-3 transition-colors ${isSidebarOpen ? 'w-full text-left text-sm font-semibold text-black bg-white hover:bg-gray-100 px-4 py-2.5 rounded-full justify-center' : 'text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10'}`}
              onClick={() => {
                setForceSignIn(false);
                setShowAuthModal(true);
              }}
              title="Sign In"
            >
              {isSidebarOpen ? (
                <span className="text-center font-bold">Sign In</span>
              ) : (
                <User size={20} />
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content relative flex flex-col h-full">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 bg-transparent z-50 shrink-0">
          <div className="flex items-center w-1/4 sm:w-1/3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 sm:hidden" 
                title="Expand menu"
              >
                <Menu size={24} />
              </button>
            )}
          </div>
          
          <div className="flex justify-center w-2/4 sm:w-1/3">
            <div 
              className="flex items-center gap-2 sm:gap-3 text-white text-xl sm:text-3xl font-extrabold transition-colors tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Rivo
            </div>
          </div>

          <div className="flex items-center justify-end w-1/4 sm:w-1/3 gap-3">
            {!user && (
              <button 
                className="text-sm font-semibold text-black bg-white hover:bg-gray-100 px-5 py-1.5 rounded-full transition-colors hidden sm:block"
                onClick={() => {
                  setForceSignIn(false);
                  setShowAuthModal(true);
                }}
              >
                Sign In
              </button>
            )}
            {messages.length > 0 && (
              <button 
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10" 
                title="New Chat"
                onClick={handleNewChat}
              >
                <SquarePen size={24} />
              </button>
            )}
          </div>
        </header>

        {messages.length === 0 ? (
          <div className="empty-state-centered">
            <DottedSurface className="absolute inset-0 z-0 opacity-50 mix-blend-screen" />
            <div className="relative z-10 w-full flex flex-col items-center">
              <HackerGreeting />
              
              <div className="centered-input-container">
                {renderInput(true)}
              </div>


            </div>
          </div>
        ) : (
          <>
            <div className="chat-container">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  {msg.role === 'user' ? (
                    <div className="flex-shrink-0 ml-4 w-9 h-9 mt-1 rounded-full bg-black border border-white/20 shadow-sm flex items-center justify-center text-white font-bold text-sm">
                      {user?.email ? user.email[0].toUpperCase() : <User size={18} className="text-white" />}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 mr-4 w-9 h-9 mt-1 rounded-full bg-white/5 border border-white/10 shadow-sm flex items-center justify-center">
                      <img src="/favicon.svg" alt="Rivo" className="w-5 h-5 opacity-90" />
                    </div>
                  )}
                  <div className="message-content">
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      msg.isAnimated === false ? (
                        <TypingMessage 
                          content={msg.content} 
                          isAnimating={isAnimating}
                          onTyping={scrollToBottom}
                          onComplete={() => {
                            setMessages(prev => prev.map((m, i) => i === index ? { ...m, isAnimated: true } : m));
                            setIsAnimating(false);
                          }} 
                          onStop={(partial) => {
                            setMessages(prev => prev.map((m, i) => i === index ? { ...m, isAnimated: true, content: partial } : m));
                            setIsAnimating(false);
                          }}
                        />
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message bot">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              {renderInput()}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
