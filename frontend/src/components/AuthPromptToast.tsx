import { useEffect } from 'react';
import { WalletMinimal } from 'lucide-react';

interface AuthPromptToastProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
  message: string;
  isAuthenticating: boolean;
}

function AuthPromptToast({
  isOpen,
  onClose,
  onAuthenticate,
  message,
  isAuthenticating,
}: AuthPromptToastProps) {
  // Auto-close after 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="auth-toast-overlay" onClick={onClose}>
      <div className="auth-toast" onClick={(e) => e.stopPropagation()}>
        <div className="auth-toast__content">
          <p className="auth-toast__message">{message}</p>
          <button
            className="wallet-connect-button wallet-connect-button--disconnected"
            type="button"
            onClick={onAuthenticate}
            disabled={isAuthenticating}
          >
            <WalletMinimal
              size={16}
              strokeWidth={2.4}
              className="wallet-connect-button--disconnected__icon"
              aria-hidden="true"
            />
            <span className="wallet-connect-button__text wallet-connect-button--disconnected__label">
              {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPromptToast;
