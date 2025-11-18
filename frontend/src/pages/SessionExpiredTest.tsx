import { useState } from 'react';
import { WalletMinimal } from 'lucide-react';

function SessionExpiredTest() {
  const [showModal, setShowModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleReauthenticate = () => {
    setIsAuthenticating(true);
    // Simulate authentication
    setTimeout(() => {
      setIsAuthenticating(false);
      setShowModal(false);
      alert('Re-authenticated successfully!');
    }, 2000);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Session Expired Modal Test</h1>
      <p>Click the button below to preview the session expired modal:</p>

      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '12px 24px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginTop: '20px',
        }}
      >
        Show Session Expired Modal
      </button>

      <div style={{ marginTop: '40px', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
        <h3>Test Instructions:</h3>
        <ul>
          <li>Click "Show Session Expired Modal" to display the modal</li>
          <li>Test clicking outside the modal to dismiss it</li>
          <li>Test pressing ESC key to dismiss it</li>
          <li>Test the Dismiss button</li>
          <li>Test the Re-authenticate button (simulates 2s auth delay)</li>
          <li>Verify modal is centered and responsive</li>
          <li>Check that body scroll is prevented when modal is open</li>
        </ul>
      </div>

      {/* Modal Preview */}
      {showModal && (
        <div className="session-expired-overlay" onClick={() => setShowModal(false)}>
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
                onClick={() => setShowModal(false)}
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
      )}
    </div>
  );
}

export default SessionExpiredTest;
