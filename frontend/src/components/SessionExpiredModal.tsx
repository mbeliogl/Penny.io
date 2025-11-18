import { useEffect } from 'react';
import { WalletMinimal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function SessionExpiredModal() {
  const { sessionExpired, clearSessionExpired, login, isAuthenticating } = useAuth();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (sessionExpired) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sessionExpired]);

  // Handle ESC key
  useEffect(() => {
    if (!sessionExpired) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSessionExpired();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [sessionExpired, clearSessionExpired]);

  const handleReauthenticate = async () => {
    const success = await login();
    if (success) {
      clearSessionExpired();
    }
  };

  if (!sessionExpired) return null;

  return (
    <div className="session-expired-overlay" onClick={clearSessionExpired}>
      <div className="session-expired-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="session-expired-modal__title">Session Expired</h2>

        <p className="session-expired-modal__message">
          Your session has expired.<br />
          Please authenticate again to continue.
        </p>

        <div className="session-expired-modal__actions">
          <button
            className="session-expired-modal__cancel"
            type="button"
            onClick={clearSessionExpired}
            disabled={isAuthenticating}
          >
            Dismiss
          </button>

          <button
            className="wallet-connect-button wallet-connect-button--disconnected"
            type="button"
            onClick={handleReauthenticate}
            disabled={isAuthenticating}
          >
            <WalletMinimal
              size={16}
              strokeWidth={2.4}
              className="wallet-connect-button--disconnected__icon"
              aria-hidden="true"
            />
            <span className="wallet-connect-button__text wallet-connect-button--disconnected__label">
              {isAuthenticating ? 'Authenticating...' : 'Re-authenticate'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
