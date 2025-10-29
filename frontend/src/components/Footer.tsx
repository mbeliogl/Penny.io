import { Link } from 'react-router-dom';
import { Info, BookOpen, PenTool, HelpCircle, Mail, Shield, FileText, LayoutDashboard, Library, Zap } from 'lucide-react';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Penny.io</h3>
            <p>Micropayments for quality content</p>
          </div>
          
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><Link to="/about"><Info size={16} /> About</Link></li>
              <li><Link to="/how-it-works"><BookOpen size={16} /> How it works</Link></li>
              <li><Link to="/pricing"><FileText size={16} /> Pricing</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Creators</h4>
            <ul>
              <li><Link to="/write"><PenTool size ={16}/>Start writing</Link></li>
              <li><Link to="/dashboard"><LayoutDashboard size={16}/>Dashboard</Link></li>
              <li><Link to="/resources"><Library size={16} /> Resources</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/help"><HelpCircle size={16}/>Help center</Link></li>
              <li><Link to="/contact"><Mail size={16}/>Contact</Link></li>
              <li><Link to="/privacy"><Shield size={16}/>Privacy</Link></li>
              <li><Link to="/terms"><FileText size={16}/>Terms</Link></li>
              <li><Link to="/x402-test"><Zap size={16}/>x402 Test</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Penny.io. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;