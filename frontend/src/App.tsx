import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Send, User, Sparkles, PanelLeft, SquarePen, Search, Store } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { DottedSurface } from '@/components/ui/dotted-surface';
import './index.css';

interface Message {
  role: 'user' | 'model';
  content: string;
  isAnimated?: boolean;
}

const TypingMessage = ({ content, onComplete, onTyping }: { content: string, onComplete?: () => void, onTyping?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setDisplayedContent(content.substring(0, index));
      onTyping?.();
      
      if (index >= content.length) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 15); // 15ms per character creates a nice 'slow typing' effect

    return () => clearInterval(timer);
  }, [content]); // Intentionally omitting onComplete and onTyping to prevent re-triggering

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const executeSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';
      const response = await axios.post(`${apiUrl}/api/chat`, {
        message: textToSend,
        history: messages
      });

      const botMessage: Message = { role: 'model', content: response.data.response, isAnimated: false };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
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
  };

  const renderInput = (isCentered = false) => (
    <div className={`flex items-center bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full pl-8 pr-2 py-2 w-full transition-all duration-300 ${isCentered ? 'max-w-[800px]' : 'max-w-3xl mx-auto'}`}>
      <input
        type="text"
        className={`flex-1 bg-transparent border-none outline-none text-gray-200 pl-2 pr-4 placeholder-gray-500 w-full ${isCentered ? 'text-lg' : 'text-base'}`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything"
      />
      
      <div className="flex items-center shrink-0">
        <button 
          className={`flex items-center justify-center transition-all shrink-0 rounded-full ${input.trim() && !isLoading ? 'text-white hover:bg-white/10' : 'text-gray-600'} w-[40px] h-[40px]`} 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send size={isCentered ? 22 : 20} strokeWidth={1.5} className="mr-0.5 mt-0.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Main Content */}
      <main className="main-content relative flex flex-col h-full">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 bg-[#000000] z-50 shrink-0">
          <div className="flex items-center w-1/4 sm:w-1/3">
            <button 
              className="text-gray-400 hover:text-white transition-colors p-2 sm:p-3 rounded-xl hover:bg-white/10" 
              title="New Chat"
              onClick={handleNewChat}
            >
              <SquarePen size={28} strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="flex justify-center w-2/4 sm:w-1/3">
            <button 
              className="flex items-center gap-2 sm:gap-3 text-white text-xl sm:text-3xl font-extrabold px-3 sm:px-5 py-2 sm:py-3 rounded-2xl hover:bg-white/5 transition-colors tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Rivo
            </button>
          </div>

          <div className="flex items-center justify-end w-1/4 sm:w-1/3">
            {/* Empty space to balance the navbar flex layout */}
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
                  <div className="message-content">
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      msg.isAnimated === false ? (
                        <TypingMessage 
                          content={msg.content} 
                          onTyping={scrollToBottom}
                          onComplete={() => {
                            setMessages(prev => prev.map((m, i) => i === index ? { ...m, isAnimated: true } : m));
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
