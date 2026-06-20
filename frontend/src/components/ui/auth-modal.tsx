import { GoogleLogin } from '@react-oauth/google';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceSignIn: boolean;
  onSuccess: (credentialResponse: any) => void;
}

export const AuthModal = ({ isOpen, onClose, forceSignIn, onSuccess }: AuthModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1e1f20] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white font-display">R</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Rivo</h2>
        
        {forceSignIn ? (
          <p className="text-gray-400 mb-8">
            You've reached the free trial limit of 10 messages. Please sign in to continue chatting and save your history!
          </p>
        ) : (
          <p className="text-gray-400 mb-8">
            Sign in to securely save your chat history across devices, or try it out as a guest first.
          </p>
        )}

        <div className="flex flex-col items-center gap-4">
          <GoogleLogin
            onSuccess={onSuccess}
            onError={() => {
              console.error('Google Login Failed');
              alert('Login failed. Please try again or check your Client ID.');
            }}
            useOneTap
            theme="filled_black"
            shape="pill"
          />
          
          {!forceSignIn && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white font-medium py-3 px-6 rounded-full transition-colors text-sm w-full"
            >
              Do it later
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
