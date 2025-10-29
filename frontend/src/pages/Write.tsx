import { useState, useEffect, FormEvent } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Save, Send } from 'lucide-react';
import { getCurrentDateString } from '../utils/dateUtils';
import { apiService } from '../services/api';
import { Editor } from '@tinymce/tinymce-react';

function Write() {
  const { isConnected, address } = useWallet();
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [price, setPrice] = useState<string>('0.05');
  const [isDraft, setIsDraft] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState<boolean>(false);
  
  // Content limits
  const MAX_TITLE_LENGTH = 200;
  const MAX_CONTENT_LENGTH = 50000; // ~25-30 pages of text
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  
  // Typing animation state
  const [displayText, setDisplayText] = useState<string>('');
  const [hasTyped, setHasTyped] = useState<boolean>(false);
  const fullText = "Your words can change the world.";

  // Typing animation effect
  useEffect(() => {
    if (!hasTyped && displayText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length + 1));
      }, 100);
      return () => clearTimeout(timeout);
    } else if (displayText.length === fullText.length && !hasTyped) {
      setHasTyped(true);
    }
  }, [displayText, hasTyped, fullText]);

  // Real-time validation (only update errors, don't show them yet)
  useEffect(() => {
    const errors = validateForm();
    setValidationErrors(errors);
    // Clear submit error when validation changes and no errors
    if (submitError && errors.length === 0 && showValidation) {
      setSubmitError('');
    }
  }, [title, content, price, submitError, showValidation]);


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Show validation from now on
    setShowValidation(true);
    
    if (!address) {
      setSubmitError('Please connect your wallet first');
      return;
    }

    // Check for validation errors
    const errors = validateForm();
    if (errors.length > 0) {
      setSubmitError('Please fix the validation errors above before publishing');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const articleData = {
        title,
        content,
        price: parseFloat(price),
        authorAddress: address
      };

      const response = await apiService.createArticle(articleData);

      if (response.success) {
        setSubmitSuccess(true);
        setTitle('');
        setContent('');
        setPrice('0.05');
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setSubmitError(response.error || 'Failed to create article');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred');
      console.error('Error creating article:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation helper
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!title.trim()) {
      errors.push('Article title is required');
    }
    
    if (!content.trim()) {
      errors.push('Article content is required');
    }
    
    if (!price || parseFloat(price) <= 0) {
      errors.push('Valid price is required');
    }
    
    if (title.length > MAX_TITLE_LENGTH) {
      errors.push(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
    }
    
    if (content.length > MAX_CONTENT_LENGTH) {
      errors.push(`Content must be ${MAX_CONTENT_LENGTH} characters or less`);
    }
    
    const priceNum = parseFloat(price);
    if (price && priceNum < 0.01) {
      errors.push('Article price must be at least $0.01');
    }
    
    if (price && priceNum > 1.00) {
      errors.push('Article price cannot exceed $1.00');
    }
    
    return errors;
  };


  const saveDraft = () => {
    setIsDraft(true);
    console.log('Draft saved:', { title, content, price });
    setTimeout(() => setIsDraft(false), 2000);
  };


  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;

  if (!isConnected) {
    return (
      <div className="write">
        <div className="container">
          <div className="connect-prompt">
            <h1>Connect Your Wallet</h1>
            <p>Connect your wallet to start writing and publishing articles on Penny.io.</p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="write">
      <div className="write-container">

        {/* Main Content */}
        <div className="write-layout">
          <form id="write-form" onSubmit={handleSubmit} className="write-form">
            {/* Article Details */}
            <div className="article-inputs">
              <div className="title-section">
                <label htmlFor="title" className="input-label">Article Title</label>
                <textarea
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    // Auto-resize height
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                    }
                  }}
                  placeholder="Enter your article title..."
                  className="title-input-auto"
                  rows={1}
                  style={{ resize: 'none', overflow: 'hidden' }}
                  maxLength={MAX_TITLE_LENGTH}
                  required
                />
                <div className="title-counter">
                  <span className={title.length > MAX_TITLE_LENGTH * 0.9 ? 'char-warning' : ''}>
                    {title.length}/{MAX_TITLE_LENGTH} characters
                  </span>
                </div>
              </div>
              <div className="price-section">
                <label htmlFor="price" className="input-label">Price</label>
                <div className="price-input-simple">
                  <span>$</span>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0.01"
                    max="1.00"
                    step="0.01"
                    placeholder="0.05"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="article-actions">
              <button 
                type="button" 
                onClick={saveDraft}
                className="action-btn save-btn"
                disabled={isDraft}
              >
                <Save size={18} />
                {isDraft ? 'Saved!' : 'Save Draft'}
              </button>
              <button 
                type="submit" 
                className="action-btn publish-btn"
                disabled={isSubmitting}
              >
                <Send size={18} />
                {isSubmitting ? 'Publishing...' : 'Publish Article'}
              </button>
            </div>

            {/* Content Editor */}
            <div className="form-group">
              <div className="content-header">
                <label htmlFor="content" className="input-label">Article Body</label>
                <div className="write-stats">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span className={charCount > MAX_CONTENT_LENGTH * 0.9 ? 'char-warning' : ''}>
                    {charCount.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()} characters
                  </span>
                </div>
              </div>
              <div className="tinymce-wrapper">
                <Editor
                  apiKey="7ahasmo84ufchymcd8xokq6qz4l1lh2zdf1wnucvaaeuaxci"
                  value={content}
                  onEditorChange={(content) => setContent(content)}
                  init={{
                    height: 700,
                    menubar: false,
                    resize: false,
                    statusbar: false,
                    plugins: [
                      'link', 'lists', 'code', 'table', 'media', 'codesample', 'autolink', 'powerpaste', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | bold italic underline | link media table | code codesample | bullist numlist outdent indent | removeformat',
                    content_style: `
                      body { 
                        font-family: 'Inter', system-ui, -apple-system, sans-serif; 
                        font-size: 16px; 
                        line-height: 1.7; 
                        max-width: none; 
                        margin: 0;
                        padding: 20px;
                        color: #1a1a1a;
                      }
                      h1, h2, h3 { color: #1a1a1a; margin-top: 2em; margin-bottom: 0.5em; }
                      h1 { font-size: 2em; font-weight: 700; }
                      h2 { font-size: 1.5em; font-weight: 600; }
                      h3 { font-size: 1.25em; font-weight: 600; }
                      p { margin-bottom: 1em; }
                      code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
                      pre { background: #f8f9fa; padding: 1em; border-radius: 8px; overflow-x: auto; }
                      blockquote { border-left: 4px solid #e5e7eb; margin: 1.5em 0; padding-left: 1em; color: #6b7280; }
                    `,
                    skin: 'oxide',
                    branding: false,
                    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Quote=blockquote',
                    paste_as_text: false,
                    smart_paste: true
                  }}
                />
              </div>
            </div>

            {/* Validation Status - only show after publish attempt */}
            {showValidation && (
              validationErrors.length > 0 ? (
                <div className="validation-errors">
                  <h4>Please fix the following issues:</h4>
                  <ul>
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="validation-success">
                  <h4>✅ Ready to publish!</h4>
                  <p>Your article looks good and is ready to be published.</p>
                </div>
              )
            )}

            {/* Submit Error Message */}
            {submitError && validationErrors.length === 0 && (
              <div className="submit-error">
                {submitError}
              </div>
            )}

            {/* Success Message */}
            {submitSuccess && (
              <div className="submit-success">
                ✅ Article published successfully!
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}

export default Write;