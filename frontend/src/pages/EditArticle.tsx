import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import AppKitConnectButton from '../components/AppKitConnectButton';
import { Save, Eye, ArrowLeft, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { apiService, Article } from '../services/api';
import { sanitizeHTML } from '../utils/sanitize';

function EditArticle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [price, setPrice] = useState<string>('0.05');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState<boolean>(false);
  const [showValidationSummary, setShowValidationSummary] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Content limits (match Write page)
  const MAX_TITLE_LENGTH = 200;
  const MIN_CONTENT_LENGTH = 50;
  const MAX_CONTENT_LENGTH = 50000;

  const clearSubmitFeedback = () => {
    if (submitError) {
      setSubmitError('');
    }
    if (submitSuccess) {
      setSubmitSuccess(false);
    }
  };

  const getFieldError = (field: 'title' | 'content' | 'price'): string | null => {
    switch (field) {
      case 'title':
        if (!title.trim()) return 'Title is required';
        if (title.trim().length > MAX_TITLE_LENGTH) return `Title must be ${MAX_TITLE_LENGTH} characters or less`;
        return null;
      case 'content': {
        if (!content.trim()) return 'Content is required';
        const textContent = content.replace(/<[^>]*>/g, '').trim();
        if (textContent.length < MIN_CONTENT_LENGTH) return `Content must be at least ${MIN_CONTENT_LENGTH} characters`;
        if (content.length > MAX_CONTENT_LENGTH) return `Content must be ${MAX_CONTENT_LENGTH.toLocaleString()} characters or less`;
        return null;
      }
      case 'price': {
        const priceValue = parseFloat(price);
        if (!Number.isFinite(priceValue)) return 'Valid price is required';
        if (priceValue < 0.01) return 'Price must be at least $0.01';
        if (priceValue > 1.0) return 'Price cannot exceed $1.00';
        return null;
      }
      default:
        return null;
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    const titleError = getFieldError('title');
    const contentError = getFieldError('content');
    const priceError = getFieldError('price');

    if (titleError) errors.push(titleError);
    if (contentError) errors.push(contentError);
    if (priceError) errors.push(priceError);

    return errors;
  };

  const computedValidationErrors = validateForm();
  const validationErrors = showValidationSummary ? computedValidationErrors : [];
  const summaryMessages = showValidationSummary
    ? [...validationErrors, ...(submitError ? [submitError] : [])]
    : [];
  const hasSummaryErrors = summaryMessages.length > 0;

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;

  // Load article data on component mount
  useEffect(() => {
    if (id) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await apiService.getArticleById(parseInt(id));
      if (response.success && response.data) {
        const articleData = response.data;
        setArticle(articleData);
        setTitle(articleData.title);
        setContent(articleData.content);
        setPrice(articleData.price.toString());
        setSubmitError('');
        setSubmitSuccess(false);
        setShowValidationSummary(false);
      } else {
        setSubmitError('Article not found');
      }
    } catch (error) {
      setSubmitError('Error loading article');
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authorized to edit this article
  const isAuthorized = Boolean(article && address && article.authorAddress === address);

  const handleUpdateArticle = async () => {
    if (!address || !article) return;

    const priceValue = parseFloat(price);
    if (!Number.isFinite(priceValue)) {
      setSubmitError('Valid price is required');
      setShowValidationSummary(true);
      return;
    }

    setIsSubmitting(true);
    setShowUpdateConfirm(false);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const response = await apiService.updateArticle(article.id, {
        title: title.trim(),
        content: content.trim(),
        price: priceValue,
        authorAddress: address
      });

      if (response.success) {
        setShowValidationSummary(false);
        setSubmitError('');
        setSubmitSuccess(true);
      } else {
        setSubmitError(response.error || 'Failed to update article');
        setShowValidationSummary(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred');
      setShowValidationSummary(true);
      console.error('Error updating article:', error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate read time estimate
  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
  };

  const handleUpdateConfirm = async () => {
    if (!address) {
      setSubmitError('Please connect your wallet first');
      setShowValidationSummary(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      setShowValidationSummary(true);
      setSubmitError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (submitError) {
      setShowValidationSummary(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const priceValue = parseFloat(price);
    if (!Number.isFinite(priceValue)) {
      setSubmitError('Valid price is required');
      setShowValidationSummary(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitError('');
    setShowValidationSummary(false);
    setSubmitSuccess(false);
    setShowUpdateConfirm(true);
  };

  if (!isConnected) {
    return (
      <div className="write-page">
        <div className="container">
          <div className="connect-prompt">
            <h1>Connect Your Wallet</h1>
            <p>Connect your wallet to edit articles.</p>
            <AppKitConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="write-page">
        <div className="container">
          <div className="loading-state">
            <p>Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="write-page">
        <div className="container">
          <div className="error-message">
            <p>❌ Article not found</p>
            <button onClick={() => navigate('/dashboard')} className="retry-btn">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="write-page">
        <div className="container">
          <div className="error-message">
            <p>❌ You are not authorized to edit this article</p>
            <button onClick={() => navigate('/dashboard')} className="retry-btn">
              Back to Dashboard
            </button>
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
          <form className="write-form">
            {/* Success Message */}
            {submitSuccess && (
              <div className="submit-success">
                <div className="success-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="success-content">
                  <h4>Article Updated Successfully! 🎉</h4>
                  <p>Your changes have been saved and the article is now updated.</p>
                  <div className="success-actions">
                    <button 
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="action-btn secondary-btn"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSubmitSuccess(false)}
                  className="success-close-btn"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Submit Error Message */}
            {submitError && !showValidationSummary && (
              <div className="submit-error">
                <div className="error-icon">
                  <X size={24} />
                </div>
                <div className="error-content">
                  <h4>Unable to Update Article</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{submitError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError('')}
                  className="error-close-btn"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Validation Summary */}
            {showValidationSummary && hasSummaryErrors && (
              <div className="validation-summary validation-summary--errors">
                <div className="summary-icon">
                  <AlertTriangle size={22} />
                </div>
                <div className="summary-content">
                  <h4>Please fix the following issues</h4>
                  <ul>
                    {summaryMessages.map((error, index) => (
                      <li key={`${error}-${index}`} style={{ whiteSpace: 'pre-wrap' }}>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="article-actions">
              <div className="draft-actions">
                <button 
                  type="button" 
                  onClick={() => navigate('/dashboard')}
                  className="action-btn draft-btn"
                >
                  <ArrowLeft size={18} />
                  Back to Dashboard
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowPreview(true)}
                  className="action-btn preview-btn"
                  disabled={!title.trim() || !content.trim()}
                >
                  <Eye size={18} />
                  Preview
                </button>
              </div>
              <button 
                type="button" 
                onClick={handleUpdateConfirm}
                className="action-btn publish-btn"
                disabled={isSubmitting}
              >
                <Save size={18} />
                {isSubmitting ? 'Updating...' : 'Update Article'}
              </button>
            </div>

            {/* Article Details */}
            <div className="article-inputs">
              <div className="title-section">
                <label htmlFor="title" className="input-label">Article Title</label>
                <textarea
                  id="title"
                  value={title}
                  onChange={(e) => {
                    clearSubmitFeedback();
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
                    onChange={(e) => {
                      clearSubmitFeedback();
                      setPrice(e.target.value);
                    }}
                    min="0.01"
                    max="1.00"
                    step="0.01"
                    placeholder="0.05"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="form-group">
              <div className="content-header">
                <label htmlFor="content" className="input-label">Article Body</label>
                <div className="write-stats">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount}/{MAX_CONTENT_LENGTH.toLocaleString()} characters</span>
                </div>
              </div>
              <div className="tinymce-wrapper">
                <Editor
                  apiKey="7ahasmo84ufchymcd8xokq6qz4l1lh2zdf1wnucvaaeuaxci"
                  value={content}
                  onEditorChange={(content) => {
                    clearSubmitFeedback();
                    setContent(content);
                  }}
                  init={{
                    height: 700,
                    menubar: false,
                    resize: false,
                    statusbar: false,
                    plugins: [
                      'image', 'link', 'lists', 'code', 'table', 'media', 'codesample', 'autolink', 'powerpaste', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | bold italic underline | link image media table | code codesample | bullist numlist outdent indent | removeformat',
                    
                    // Image upload configuration
                    images_upload_url: 'http://localhost:3001/api/upload',
                    images_upload_credentials: false,
                    automatic_uploads: true,
                    
                    // File picker for more control
                    file_picker_types: 'image',
                    file_picker_callback: (callback: any, value: any, meta: any) => {
                      if (meta.filetype === 'image') {
                        const input = document.createElement('input');
                        input.setAttribute('type', 'file');
                        input.setAttribute('accept', 'image/*');
                        
                        input.onchange = function() {
                          const file = (this as HTMLInputElement).files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            fetch('http://localhost:3001/api/upload', {
                              method: 'POST',
                              body: formData
                            })
                            .then(response => response.json())
                            .then(result => {
                              if (result.success) {
                                callback(result.url, { alt: file.name });
                              }
                            })
                            .catch(error => {
                              console.error('Upload failed:', error);
                            });
                          }
                        };
                        
                        input.click();
                      }
                    },
                    
                    content_style: `
                      body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
                        font-size: 16px; 
                        line-height: 1.6; 
                        color: #1a1a1a;
                        padding: 20px;
                        max-width: none;
                      }
                      h1, h2, h3, h4, h5, h6 { 
                        color: #1a1a1a; 
                        font-weight: 600; 
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                      }
                      h1 { font-size: 2rem; }
                      h2 { font-size: 1.5rem; }
                      h3 { font-size: 1.25rem; }
                      p { margin: 0 0 1rem 0; }
                      blockquote { 
                        border-left: 4px solid #1d9bf0; 
                        padding-left: 16px; 
                        margin: 1rem 0; 
                        font-style: italic; 
                        color: #536471;
                      }
                      code { 
                        background: #f1f3f4; 
                        padding: 2px 6px; 
                        border-radius: 4px; 
                        font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
                        font-size: 0.9em;
                      }
                      pre { 
                        background: #f8f9fa; 
                        padding: 16px; 
                        border-radius: 8px; 
                        overflow-x: auto;
                        border: 1px solid #e1e8ed;
                      }
                      img { 
                        max-width: 100%; 
                        height: auto; 
                        border-radius: 8px;
                        margin: 1rem 0;
                      }
                      a { 
                        color: #1d9bf0; 
                        text-decoration: none; 
                      }
                      a:hover { 
                        text-decoration: underline; 
                      }
                      ul, ol { 
                        padding-left: 2rem; 
                        margin: 1rem 0; 
                      }
                      li { 
                        margin: 0.5rem 0; 
                      }
                      table { 
                        border-collapse: collapse; 
                        width: 100%; 
                        margin: 1rem 0; 
                      }
                      table td, table th { 
                        border: 1px solid #e1e8ed; 
                        padding: 8px 12px; 
                      }
                      table th { 
                        background: #f8f9fa; 
                        font-weight: 600; 
                      }
                    `,
                    
                    setup: (editor: any) => {
                      editor.on('change', () => {
                        setContent(editor.getContent());
                      });
                    }
                  }}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="modal-overlay" onClick={handlePreviewClose}>
            <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="preview-modal-header">
                <h3>Article Preview</h3>
                <button 
                  type="button" 
                  onClick={handlePreviewClose}
                  className="close-btn"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="preview-content">
                <div className="preview-meta">
                  <h1 className="preview-title">{title}</h1>
                  <div className="preview-stats">
                    <span className="preview-price">${parseFloat(price).toFixed(2)}</span>
                    <span>•</span>
                    <span className="preview-read-time">{calculateReadTime(content)}</span>
                    <span>•</span>
                    <span className="preview-word-count">{wordCount} words</span>
                  </div>
                </div>
                <div className="preview-body">
                  <div className="preview-text" dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
                </div>
              </div>
              <div className="preview-actions">
                <button 
                  type="button" 
                  onClick={handlePreviewClose}
                  className="action-btn secondary-btn"
                >
                  Edit Article
                </button>
                <button 
                  type="button" 
                  onClick={async () => {
                    setShowPreview(false);
                    await handleUpdateConfirm();
                  }}
                  className="action-btn publish-btn"
                >
                  <Save size={18} />
                  Update Article
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Confirmation Modal */}
        {showUpdateConfirm && (
          <div className="modal-overlay">
            <div className="confirm-modal">
              <div className="confirm-modal-header">
                <h3>Ready to Update?</h3>
              </div>
              <div className="confirm-content">
                <div className="confirm-article-info">
                  <h4>{title}</h4>
                  <div className="confirm-stats">
                    <span>Price: <strong>${parseFloat(price).toFixed(2)}</strong></span>
                    <span>Read time: <strong>{calculateReadTime(content)}</strong></span>
                    <span>Word count: <strong>{wordCount} words</strong></span>
                  </div>
                </div>
                <p className="confirm-message">
                  Your article will be updated with the new content. 
                  This will overwrite the existing article.
                </p>
              </div>
              <div className="confirm-actions">
                <button 
                  type="button" 
                  onClick={() => setShowUpdateConfirm(false)}
                  className="action-btn secondary-btn"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleUpdateArticle}
                  className="action-btn publish-btn"
                  disabled={isSubmitting}
                >
                  <CheckCircle size={18} />
                  {isSubmitting ? 'Updating...' : 'Confirm & Update'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditArticle;
