import React, { useState, useEffect, useRef } from 'react';
import { Camera, X } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSave: (user: any) => void;
}

export function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setUsername(user.email ? user.email.split('@')[0] : '');
      setPhotoUrl(user.picture || null);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ ...user, name: displayName, picture: photoUrl });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#212121] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        <h2 className="text-xl font-semibold text-white mb-8">Edit profile</h2>

        <div className="flex justify-center mb-8">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full bg-[#7a8786] flex items-center justify-center text-white text-3xl font-medium shadow-inner transition-transform group-hover:scale-105 overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-[#303030] border-2 border-[#212121] p-1.5 rounded-full text-gray-300 hover:text-white hover:bg-[#404040] transition-colors shadow-sm">
              <Camera size={16} />
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-[#303030] border border-white/10 rounded-xl px-4 py-2 focus-within:border-white/30 focus-within:bg-[#383838] transition-colors">
            <label className="text-[11px] text-gray-400 font-medium block mb-0.5">Display name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 font-medium"
              placeholder="Enter display name"
            />
          </div>

          <div className="bg-[#303030] border border-white/10 rounded-xl px-4 py-2 focus-within:border-white/30 focus-within:bg-[#383838] transition-colors">
            <label className="text-[11px] text-gray-400 font-medium block mb-0.5">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 font-medium"
              placeholder="Enter username"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/20"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
