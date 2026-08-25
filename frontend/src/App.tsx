import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Send, User, Sparkles, PanelLeft, SquarePen, Search, Store, Menu, Image as ImageIcon, Mic, MessageSquare, Settings, HelpCircle, History, Square, Trash, LogOut, Paperclip, Triangle, MoreHorizontal, ImagePlus, X, File as FileIcon, Copy, ThumbsUp, ThumbsDown, RotateCcw, Check, ArrowUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { AuthModal } from '@/components/ui/auth-modal';
import { EditProfileModal } from '@/components/ui/edit-profile-modal';
import { SettingsModal } from '@/components/ui/settings-modal';
import './index.css';

interface Message {
  role: 'user' | 'model';
  content: string;
  isAnimated?: boolean;
  attachments?: { data: string, mimeType: string }[];
}

interface Attachment {
  file: File;
  base64: string;
  mimeType: string;
  previewUrl?: string;
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
const WebsiteLogo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <img 
    src="/favicon.svg" 
    alt="Rivo Logo" 
    width={size} 
    height={size} 
    className={className} 
    style={{ borderRadius: '50%' }}
  />
);

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setInput(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, chatId: string} | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [modelPreference, setModelPreference] = useState('gemini-1.5-pro');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(e.target as Node)) {
        setIsModelSelectorOpen(false);
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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [forceSignIn, setForceSignIn] = useState(false);
  const [guestCount, setGuestCount] = useState(() => parseInt(localStorage.getItem('guestCount') || '0', 10));

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        let resolvedMimeType = file.type;
        if (!resolvedMimeType) {
          const lowerName = file.name.toLowerCase();
          if (lowerName.endsWith('.pdf')) resolvedMimeType = 'application/pdf';
          else if (lowerName.endsWith('.png')) resolvedMimeType = 'image/png';
          else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) resolvedMimeType = 'image/jpeg';
        }
        
        const previewUrl = resolvedMimeType.startsWith('image/') ? URL.createObjectURL(file) : undefined;
        setAttachments(prev => [...prev, {
          file,
          base64: base64Data,
          mimeType: resolvedMimeType,
          previewUrl
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsAttachmentMenuOpen(false);
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

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

    const formattedAttachments = attachments.length > 0 ? attachments.map(a => ({ data: a.base64, mimeType: a.mimeType })) : undefined;
    const userMessage: Message = { 
      role: 'user', 
      content: textToSend + (attachments.length > 0 ? '\n[File(s) Attached]' : ''),
      attachments: formattedAttachments
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const currentUserId = user ? user.sub : localStorage.getItem('guestId');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';
      const response = await axios.post(`${apiUrl}/api/chat`, {
        message: textToSend,
        chatId: currentChatId,
        userId: currentUserId,
        files: hasAttachments ? filesData : undefined,
        modelPreference: modelPreference,
      }, {
        signal: abortControllerRef.current.signal
      });

      const isImageGen = response.data.response.includes('![Generated Image]');
      const botMessage: Message = { role: 'model', content: response.data.response, isAnimated: isImageGen };
      setMessages(prev => [...prev, botMessage]);
      if (!isImageGen) {
        setIsAnimating(true);
      }
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

  const handleRegenerate = async () => {
    if (messages.length < 2 || !currentChatId) return;
    
    const msgs = [...messages];
    if (msgs[msgs.length - 1].role === 'model') {
      msgs.pop();
    }
    const lastUserMsg = msgs[msgs.length - 1];
    if (!lastUserMsg || lastUserMsg.role !== 'user') return;

    let contentToRegenerate = lastUserMsg.content.replace('\n[File(s) Attached]', '');
    let filesToRegenerate = lastUserMsg.attachments;

    // Optimistically remove the last bot response from UI
    setMessages(msgs);
    
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const currentUserId = user ? user.sub : localStorage.getItem('guestId');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';
      const response = await axios.post(`${apiUrl}/api/chat`, {
        regenerate: true,
        message: contentToRegenerate,
        files: filesToRegenerate,
        chatId: currentChatId,
        userId: currentUserId,
        modelPreference: modelPreference,
      }, {
        signal: abortControllerRef.current.signal
      });

      const isImageGen = response.data.response.includes('![Generated Image]');
      const botMessage: Message = { role: 'model', content: response.data.response, isAnimated: isImageGen };
      setMessages(prev => [...prev, botMessage]);
      if (!isImageGen) {
        setIsAnimating(true);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled by user');
        return; 
      }
      console.error('Error regenerating response:', error);
      const errorMessage: Message = { 
        role: 'model', 
        content: 'Sorry, I encountered an error regenerating the response.',
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

  const handleClearHistory = async () => {
    try {
      const currentUserId = user ? user.sub : localStorage.getItem('guestId');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';
      await axios.delete(`${apiUrl}/api/chat/all?userId=${currentUserId}`);
      setChatHistoryList([]);
      if (currentChatId) {
        setMessages([]);
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleSuggestionClick = (text: string) => {
    executeSend(text);
  };
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSaveProfile = (updatedUser: any) => {
    setUser(updatedUser);
    if (localStorage.getItem('googleUser')) {
      localStorage.setItem('googleUser', JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    if (input === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  const renderInput = (isCentered = false) => (
    <div className={`flex flex-col w-full transition-all duration-300 ${isCentered ? 'max-w-[800px]' : 'max-w-3xl mx-auto'}`}>
      <div className={`flex flex-col bg-[#1e1f20] border border-white/10 shadow-2xl transition-all duration-300 rounded-[28px] p-3 w-full`}>
        
        {attachments.length > 0 && (
          <div className="flex gap-3 mb-2 flex-wrap px-2 pt-1">
            {attachments.map((att, i) => {
              const isPdf = att.file.name.toLowerCase().endsWith('.pdf') || att.mimeType === 'application/pdf' || att.file.type === 'application/pdf';
              return (
              <div key={i} className="relative group animate-in fade-in zoom-in-95 duration-200">
                {isPdf ? (
                  <div className="w-[80px] h-[80px] flex flex-col items-start justify-start bg-[#2a2a2a] rounded-2xl shadow-lg p-3 overflow-hidden hover:bg-[#333] transition-colors">
                    <div className="bg-[#ea4335] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] mb-2 shadow-sm">PDF</div>
                    <span className="text-[10px] text-gray-200 font-medium break-all line-clamp-2 leading-snug">{att.file.name}</span>
                  </div>
                ) : att.previewUrl ? (
                  <img src={att.previewUrl} alt="attachment" className="w-[80px] h-[80px] object-cover rounded-2xl shadow-lg hover:brightness-110 transition-all cursor-pointer" />
                ) : (
                  <div className="w-[80px] h-[80px] flex flex-col items-center justify-center bg-[#2a2a2a] rounded-2xl shadow-lg p-2 overflow-hidden hover:bg-[#333] transition-colors cursor-pointer">
                    <FileIcon size={24} className="text-gray-400 mb-1" />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">{att.file.name}</span>
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-2 -right-2 bg-[#1e1f20] text-gray-300 rounded-full p-1 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-xl"
                >
                  <X size={12} />
                </button>
              </div>
            )})}
          </div>
        )}

        {/* Text and Actions Row */}
        <div className="flex items-end w-full gap-2 px-1">
          {/* + Button */}
          <div ref={attachmentMenuRef} className="relative pb-1 shrink-0">
            <input type="file" ref={fileInputRef} hidden multiple accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
            <button 
              onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
            >
              <Plus size={22} />
            </button>
            
            {isAttachmentMenuOpen && (
              <div className="absolute bottom-full left-0 mb-3 bg-[#2f2f2f] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 w-64 animate-in fade-in zoom-in-95 duration-100 origin-bottom-left">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center w-full gap-3 px-3 py-2.5 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors font-medium">
                  <Paperclip size={18} className="shrink-0" /> Upload files
                </button>
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="flex-1 flex flex-col justify-center min-h-[44px]">
            <textarea
              ref={textareaRef}
              className={`bg-transparent border-none outline-none text-gray-200 placeholder-gray-500 w-full resize-none custom-scrollbar py-2.5 ${isCentered ? 'text-lg' : 'text-base'}`}
              value={input}
              onChange={(e) => {
                 setInput(e.target.value);
                 e.target.style.height = 'auto';
                 e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything"
              rows={1}
              style={{ height: 'auto' }}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center shrink-0 gap-1 pb-1 pr-1">
            <button 
              className={`transition-colors p-2 rounded-full ${isListening ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={handleMicClick}
              title={isListening ? "Stop listening" : "Start Voice Input"}
            >
              <Mic size={20} />
            </button>
            {isLoading || isAnimating ? (
              <button 
                className="flex items-center justify-center transition-all rounded-full bg-[#3b82f6] hover:bg-blue-600 text-white w-[32px] h-[32px]" 
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
                className={`flex items-center justify-center transition-all rounded-full ${input.trim() || attachments.length > 0 ? 'bg-[#3b82f6] hover:bg-blue-600 text-white' : 'bg-white/10 text-gray-500'} w-[32px] h-[32px]`} 
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
              >
                <ArrowUp size={20} />
              </button>
            )}
          </div>
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
      <aside className={`sidebar group ${isSidebarOpen ? '' : 'collapsed'} flex flex-col`}>
        {isSidebarOpen ? (
          <div className="p-3 flex items-center justify-between shrink-0">
            <button className="text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2">
              <WebsiteLogo size={20} />
              <span className="font-semibold text-[15px]">Rivo</span>
            </button>
            <div className="flex items-center gap-0.5">
              <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Search size={18} />
              </button>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                <PanelLeft size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 flex flex-col items-center shrink-0 gap-3 pt-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="relative flex items-center justify-center text-white hover:bg-white/10 w-10 h-10 rounded-lg transition-colors mb-2"
              title="Expand sidebar"
            >
              <WebsiteLogo size={24} className="absolute transition-opacity duration-200 group-hover:opacity-0" />
              <PanelLeft size={20} className="absolute opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-gray-400 group-hover:text-white" />
            </button>
            
            <button onClick={() => { handleNewChat(); setIsSidebarOpen(true); }} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
              <SquarePen size={20} />
            </button>
            
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Search size={20} />
            </button>
            
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
              <MessageSquare size={20} />
            </button>
          </div>
        )}
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {isSidebarOpen && (
            <>
              <div className="px-3 py-1 flex shrink-0">
                <button 
                  onClick={handleNewChat} 
                  className="flex items-center text-gray-200 transition-colors rounded-xl font-medium text-sm gap-3 hover:bg-white/5 py-2.5 px-3 w-full"
                  title="New chat"
                >
                  <SquarePen size={20} className="shrink-0" />
                  <span>New chat</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4 px-4 no-scrollbar">
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
              <div onClick={() => setShowEditProfile(true)} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                  {user.picture ? (
                    <img src={user.picture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-white truncate leading-tight">{user.name || user.email}</span>
                </div>
              </div>
              
              <div className="h-px bg-white/10 my-1 mx-1" />
              
              <button onClick={() => setShowEditProfile(true)} className="flex items-center w-full gap-3 px-2 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
                <User size={16} /> Profile
              </button>
              <button onClick={() => { setShowSettings(true); setIsProfileMenuOpen(false); }} className="flex items-center w-full gap-3 px-2 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors">
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
              <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                {user.picture ? (
                  <img src={user.picture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')
                )}
              </div>
              {isSidebarOpen && (
                <>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-sm font-medium text-white truncate leading-tight">{user.name || user.email}</span>
                  </div>
                  <div className="w-px h-5 bg-white/15 mx-1" />
                  <Settings size={18} className="text-gray-400 shrink-0" />
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
        {/* Model Selector */}
        <div className="absolute top-4 left-4 sm:left-1/2 sm:-translate-x-1/2 z-50 pointer-events-auto">
          <div ref={modelSelectorRef} className="relative">
            <button 
              onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-transparent hover:bg-white/10 rounded-xl text-lg font-medium text-gray-200 transition-colors"
            >
              {modelPreference === 'gemini-1.5-pro' ? 'Pro' : 'Flash'}
              <Triangle size={10} className={`text-gray-400 transition-transform ${isModelSelectorOpen ? 'rotate-180' : 'rotate-180'} fill-current`} style={{ transform: isModelSelectorOpen ? 'rotate(180deg)' : 'rotate(180deg) scaleY(-1)' }} />
            </button>
            
            {isModelSelectorOpen && (
              <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 w-[280px] bg-[#2f2f2f] border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => { setModelPreference('gemini-1.5-flash'); setIsModelSelectorOpen(false); }}
                  className="w-full flex items-start text-left p-3 rounded-xl hover:bg-white/5 transition-colors relative"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      Flash {modelPreference === 'gemini-1.5-flash' && <Check size={14} className="text-white" />}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">Fastest answers</div>
                  </div>
                </button>
                <button 
                  onClick={() => { setModelPreference('gemini-1.5-pro'); setIsModelSelectorOpen(false); }}
                  className="w-full flex items-start text-left p-3 rounded-xl hover:bg-white/5 transition-colors relative"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      Pro {modelPreference === 'gemini-1.5-pro' && <Check size={14} className="text-white" />}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">Advanced reasoning</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

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
            <div className="chat-container no-scrollbar">
              {messages.map((msg, index) => (
                <div key={index} className={`message group ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  {msg.role === 'model' && (
                    <div className="flex-shrink-0 w-9 h-9 mt-1 rounded-full bg-white/5 border border-white/10 shadow-sm flex items-center justify-center overflow-hidden">
                      <img src="/favicon.svg" alt="Rivo" className="w-7 h-7 opacity-90 scale-110" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-2 w-full ${msg.role === 'user' ? 'max-w-[75%] items-end' : 'max-w-[85%] items-start'}`}>
                    {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-col items-end gap-2 w-full">
                        {msg.attachments.map((att, i) => {
                           const isImage = att.mimeType?.startsWith('image/');
                           return isImage ? (
                             <img key={i} src={`data:${att.mimeType};base64,${att.data}`} alt="attachment" className="max-w-[280px] sm:max-w-sm max-h-[400px] object-cover rounded-3xl shadow-lg border border-white/10" />
                           ) : (
                             <div key={i} className="w-[120px] h-[120px] flex flex-col items-start justify-start bg-[#2a2a2a] rounded-2xl shadow-lg p-3 overflow-hidden border border-white/10">
                               <div className="bg-[#ea4335] text-white text-[10px] font-bold px-2 py-0.5 rounded-[6px] mb-2 shadow-sm">PDF</div>
                               <span className="text-[11px] text-gray-300 font-medium break-all line-clamp-3 leading-tight">Attached Document</span>
                             </div>
                           )
                        })}
                      </div>
                    )}
                    <div className="message-content">
                      {msg.role === 'user' ? (
                        <div className="flex flex-col gap-2">
                            {msg.content.includes('[File(s) Attached]') && (!msg.attachments || msg.attachments.length === 0) && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <div className="w-[80px] h-[80px] flex flex-col items-start justify-start bg-[#2a2a2a] rounded-xl shadow-lg p-2 overflow-hidden border border-white/10">
                                      <div className="bg-[#ea4335] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] mb-1.5 shadow-sm">FILE</div>
                                      <span className="text-[10px] text-gray-300 font-medium break-all line-clamp-3 leading-tight">Attached</span>
                                    </div>
                                </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.content.replace('\n[File(s) Attached]', '')}</p>
                        </div>
                      ) : (
                      msg.isAnimated === false ? (
                        <div className="markdown-body text-gray-200">
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
                        </div>
                      ) : (
                        <div className="markdown-body text-gray-200">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )
                    )}
                    {msg.role === 'model' && (
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-1">
                        <button onClick={() => handleCopy(msg.content, index)} className="text-gray-400 hover:text-gray-200 hover:bg-white/10 p-1.5 rounded-lg transition-colors" title="Copy">
                          {copiedIndex === index ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                        {index === messages.length - 1 && currentChatId && (
                          <button onClick={handleRegenerate} className="text-gray-400 hover:text-gray-200 hover:bg-white/10 p-1.5 rounded-lg transition-colors" title="Regenerate">
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
      <EditProfileModal 
        isOpen={showEditProfile} 
        onClose={() => setShowEditProfile(false)} 
        user={user}
        onSave={handleSaveProfile}
      />
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        modelPreference={modelPreference}
        setModelPreference={setModelPreference}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

export default App;
