import { Info, BookOpen, PenTool, HelpCircle, Mail, Shield, FileText, LayoutDashboard, Library } from 'lucide-react';

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
              <li><a href="/about"><Info size={16} /> About</a></li>
              <li><a href="/how-it-works"><BookOpen size={16} /> How it works</a></li>
              <li><a href="/pricing"><FileText size={16} /> Pricing</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Creators</h4>
            <ul>
              <li><a href="/write"><PenTool size ={16}/>Start writing</a></li>
              <li><a href="/dashboard"><LayoutDashboard size={16}/>Dashboard</a></li>
              <li><a href="/resources"><Library size={16} /> Resources</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="/help"><HelpCircle size={16}/>Help center</a></li>
              <li><a href="/contact"><Mail size={16}/>Contact</a></li>
              <li><a href="/privacy"><Shield size={16}/>Privacy</a></li>
              <li><a href="/terms"><FileText size={16}/>Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Penny.io. All rights reserved.</p>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;