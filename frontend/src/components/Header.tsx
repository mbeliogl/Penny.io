import { Link } from 'react-router-dom';
import { House, LayoutDashboard, PenTool } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function Header() {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>Penny.io</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link"><House size={16}/>Home</Link>
          <Link to="/write" className="nav-link"><PenTool size={16}/>Write</Link>
          <Link to="/dashboard" className="nav-link"><LayoutDashboard size={16}/>Dashboard</Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}

export default Header;