import React from 'react';
import { X, Moon, Sun, Monitor, Trash2, Cpu, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelPreference: string;
  setModelPreference: (model: string) => void;
  onClearHistory: () => void;
}

export function SettingsModal({ isOpen, onClose, modelPreference, setModelPreference, onClearHistory }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all your chat history? This action cannot be undone.')) {
      onClearHistory();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#212121] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-semibold text-white mb-6">Settings</h2>

        {/* Theme Settings */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Appearance</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl border ${theme === 'light' ? 'border-[#8e44ad] bg-[#8e44ad]/10 text-[#8e44ad]' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
            >
              <Sun size={20} className="mb-2" />
              <span className="text-xs font-medium">Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl border ${theme === 'dark' ? 'border-[#8e44ad] bg-[#8e44ad]/10 text-[#8e44ad]' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
            >
              <Moon size={20} className="mb-2" />
              <span className="text-xs font-medium">Dark</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl border ${theme === 'system' ? 'border-[#8e44ad] bg-[#8e44ad]/10 text-[#8e44ad]' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
            >
              <Monitor size={20} className="mb-2" />
              <span className="text-xs font-medium">System</span>
            </button>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">AI Intelligence</h3>
          <div className="space-y-3">
            <button
              onClick={() => setModelPreference('gemini-2.5-pro')}
              className={`w-full flex items-center p-3 rounded-xl border text-left transition-colors ${modelPreference === 'gemini-2.5-pro' ? 'border-[#8e44ad] bg-[#8e44ad]/10' : 'border-white/10 hover:bg-white/5'}`}
            >
              <div className={`p-2 rounded-lg mr-3 ${modelPreference === 'gemini-2.5-pro' ? 'bg-[#8e44ad]/20 text-[#8e44ad]' : 'bg-white/5 text-gray-400'}`}>
                <Cpu size={18} />
              </div>
              <div>
                <div className={`text-sm font-medium ${modelPreference === 'gemini-2.5-pro' ? 'text-white' : 'text-gray-300'}`}>Gemini 2.5 Pro</div>
                <div className="text-xs text-gray-500 mt-0.5">Most capable model for complex reasoning and tasks</div>
              </div>
            </button>

            <button
              onClick={() => setModelPreference('gemini-2.5-flash')}
              className={`w-full flex items-center p-3 rounded-xl border text-left transition-colors ${modelPreference === 'gemini-2.5-flash' ? 'border-[#8e44ad] bg-[#8e44ad]/10' : 'border-white/10 hover:bg-white/5'}`}
            >
              <div className={`p-2 rounded-lg mr-3 ${modelPreference === 'gemini-2.5-flash' ? 'bg-[#8e44ad]/20 text-[#8e44ad]' : 'bg-white/5 text-gray-400'}`}>
                <Zap size={18} />
              </div>
              <div>
                <div className={`text-sm font-medium ${modelPreference === 'gemini-2.5-flash' ? 'text-white' : 'text-gray-300'}`}>Gemini 2.5 Flash</div>
                <div className="text-xs text-gray-500 mt-0.5">Fastest model for standard everyday queries</div>
              </div>
            </button>
          </div>
        </div>

        {/* Data Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Data & Privacy</h3>
          <button
            onClick={handleClearHistory}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
          >
            <div className="flex items-center">
              <Trash2 size={18} className="mr-3" />
              <span className="text-sm font-medium">Clear Chat History</span>
            </div>
          </button>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
