import { useGoogleLogin } from '@react-oauth/google';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceSignIn: boolean;
  onSuccess: (credentialResponse: any) => void;
}

export const AuthModal = ({ isOpen, onClose, forceSignIn, onSuccess }: AuthModalProps) => {
  const login = useGoogleLogin({
    onSuccess: tokenResponse => onSuccess(tokenResponse),
    onError: () => {
      console.error('Google Login Failed');
      alert('Login failed. Please try again or check your Client ID.');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => !forceSignIn && onClose()}></div>
      <div className="relative bg-[#1e1f20]/80 backdrop-blur-2xl border border-white/10 p-10 rounded-[2rem] shadow-2xl max-w-md w-full text-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative flex justify-center mb-8">
          <img src="/favicon.svg" alt="Rivo Logo" className="w-20 h-20 drop-shadow-2xl" />
        </div>
        
        <h2 className="relative text-3xl font-display font-bold text-white mb-3">Welcome to Rivo</h2>
        
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
          <button 
            onClick={() => login()}
            className="group flex items-center justify-center gap-3 w-full bg-[#131314] hover:bg-[#1e1f20] border border-white/10 text-gray-200 font-medium py-3 px-6 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            <div className="bg-white p-1 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"></path>
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"></path>
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"></path>
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"></path>
              </svg>
            </div>
            Sign in with Google
          </button>
          
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
