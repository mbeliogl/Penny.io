import { Wallet, Lock } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';

function AuthStatusBadges() {
  const { isConnected } = useWallet();
  const { isAuthenticated } = useAuth();

  return (
    <div className="auth-status-badges">
      {/* Wallet Connection Badge */}
      <div
        className={`auth-badge ${isConnected ? 'auth-badge--active' : 'auth-badge--inactive'}`}
        title={isConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
      >
        <Wallet size={16} strokeWidth={2} />
      </div>

      {/* JWT Authentication Badge */}
      <div
        className={`auth-badge ${isAuthenticated ? 'auth-badge--active' : 'auth-badge--inactive'}`}
        title={isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      >
        <Lock size={16} strokeWidth={2} />
      </div>
    </div>
  );
}

export default AuthStatusBadges;
