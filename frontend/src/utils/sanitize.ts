/**
 * HTML Sanitization Utility
 *
 * Uses DOMPurify to prevent XSS attacks by sanitizing user-generated HTML content.
 * Configured specifically for article content from TinyMCE editor.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content for safe rendering
 *
 * What it does:
 * - Removes dangerous tags: <script>, <iframe>, <object>, <embed>
 * - Strips event handlers: onclick, onerror, onload, etc.
 * - Cleans URLs: Removes javascript:, data:, vbscript: protocols
 * - Preserves safe formatting: <p>, <h1-h6>, <img>, <a>, <strong>, etc.
 *
 * @param dirty - Untrusted HTML string from user input
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    // Allow these tags (safe formatting tags from TinyMCE)
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'u', 's', 'sub', 'sup',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr'
    ],

    // Allow these attributes
    ALLOWED_ATTR: [
      'href', 'target', 'rel',           // Links
      'src', 'alt', 'width', 'height',   // Images
      'class', 'id',                      // Styling
      'colspan', 'rowspan'                // Tables
    ],

    // Only allow safe URL protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

    // Add target="_blank" and rel="noopener noreferrer" to external links
    ADD_ATTR: ['target', 'rel'],

    // Additional security options
    KEEP_CONTENT: true,        // Keep text content from removed tags
    RETURN_DOM: false,         // Return string, not DOM
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,        // Sanitize DOM clobbering attacks
    WHOLE_DOCUMENT: false,

    // Hook to add rel="noopener noreferrer" to external links
    HOOKS: {
      afterSanitizeAttributes: (node) => {
        // Add security attributes to links
        if (node.tagName === 'A') {
          const href = node.getAttribute('href');
          if (href && !href.startsWith('/') && !href.startsWith('#')) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
        }
      }
    }
  });
}

/**
 * Sanitize text content (strips all HTML tags)
 * Use this for plain text fields like titles, author names, etc.
 *
 * @param dirty - Untrusted string that might contain HTML
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],      // Strip all HTML tags
    KEEP_CONTENT: true     // Keep the text content
  });
}
