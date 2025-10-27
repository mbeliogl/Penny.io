import { useWallet } from '../contexts/WalletContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function Dashboard() {
  const { isConnected, address, balance } = useWallet();

  if (!isConnected) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="connect-prompt">
            <h1>Connect Your Wallet</h1>
            <p>Connect your wallet to access your writer dashboard and start earning from your content.</p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Writer Dashboard</h1>
          <div className="wallet-info">
            <p><strong>Address:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}</p>
            <p><strong>Balance:</strong> {balance}</p>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Earnings</h3>
            <p className="stat-value">$0.00</p>
          </div>
          <div className="stat-card">
            <h3>Articles Published</h3>
            <p className="stat-value">0</p>
          </div>
          <div className="stat-card">
            <h3>Total Reads</h3>
            <p className="stat-value">0</p>
          </div>
        </div>

        <div className="articles-section">
          <h2>Your Articles</h2>
          <div className="articles-list">
            <p>No articles published yet. <a href="/write">Write your first article!</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;