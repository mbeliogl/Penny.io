import { Link } from 'react-router-dom';
import { LayoutDashboard, PenTool, BookOpen } from 'lucide-react';
import AppKitConnectButton from './AppKitConnectButton';
import AuthStatusBadges from './AuthStatusBadges';

function Header() {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>Readia.io</h1>
        </Link>
        <nav className="nav">
          <Link to="/explore" className="link">
            <span className="link-icon"><BookOpen size={20}/></span>
            <span className="link-title">Explore</span>
          </Link>
          <Link to="/write" className="link">
            <span className="link-icon"><PenTool size={20}/></span>
            <span className="link-title">Write</span>
          </Link>
          <Link to="/dashboard" className="link">
            <span className="link-icon"><LayoutDashboard size={20}/></span>
            <span className="link-title">Dashboard</span>
          </Link>
          <AppKitConnectButton />
        </nav>
      </div>
      <AuthStatusBadges />
    </header>
  );
}

export default Header;
