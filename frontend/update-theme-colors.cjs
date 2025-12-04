/**
 * Script to update App.css with CSS variables for dark mode support
 * Run with: node update-theme-colors.js
 */

const fs = require('fs');
const path = require('path');

const cssFilePath = path.join(__dirname, 'src', 'App.css');

// Color mappings: hardcoded value -> CSS variable
const colorMappings = [
  // Background colors
  { pattern: /background-color:\s*#ffffff(?![a-f0-9])/gi, replacement: 'background-color: var(--bg-primary)' },
  { pattern: /background:\s*#ffffff(?![a-f0-9])/gi, replacement: 'background: var(--bg-primary)' },
  { pattern: /background-color:\s*#f8f9fa/gi, replacement: 'background-color: var(--bg-secondary)' },
  { pattern: /background:\s*#f8f9fa/gi, replacement: 'background: var(--bg-secondary)' },
  { pattern: /background-color:\s*white(?!\s*!)/gi, replacement: 'background-color: var(--bg-primary)' },

  // Text colors
  { pattern: /color:\s*#1a1a1a/gi, replacement: 'color: var(--text-primary)' },
  { pattern: /color:\s*#536471/gi, replacement: 'color: var(--text-secondary)' },
  { pattern: /color:\s*#6b7280/gi, replacement: 'color: var(--text-tertiary)' },
  { pattern: /color:\s*#8b98a5/gi, replacement: 'color: var(--text-muted)' },
  { pattern: /color:\s*#ffffff/gi, replacement: 'color: var(--text-inverse)' },

  // Border colors
  { pattern: /border-bottom:\s*1px solid #e1e8ed/gi, replacement: 'border-bottom: 1px solid var(--border-light)' },
  { pattern: /border:\s*1px solid #e1e8ed/gi, replacement: 'border: 1px solid var(--border-light)' },
  { pattern: /border-color:\s*#e1e8ed/gi, replacement: 'border-color: var(--border-light)' },
  { pattern: /border:\s*1px solid #cfd9de/gi, replacement: 'border: 1px solid var(--border-medium)' },
  { pattern: /border-color:\s*#cfd9de/gi, replacement: 'border-color: var(--border-medium)' },

  // Keep wallet-specific blacks (they're intentionally dark in light mode)
  // But update generic backgrounds
  { pattern: /background-color:\s*rgba\(26,\s*26,\s*26,\s*0\.05\)/gi, replacement: 'background-color: var(--bg-hover)' },
  { pattern: /background-color:\s*rgba\(26,\s*26,\s*26,\s*0\.08\)/gi, replacement: 'background-color: var(--bg-active)' },
];

// Read the file
let cssContent = fs.readFileSync(cssFilePath, 'utf8');

// Track replacements
let totalReplacements = 0;

// Apply each mapping
colorMappings.forEach(({ pattern, replacement }) => {
  const matches = cssContent.match(pattern);
  if (matches) {
    console.log(`Replacing ${matches.length} instances of: ${pattern}`);
    totalReplacements += matches.length;
    cssContent = cssContent.replace(pattern, replacement);
  }
});

// Write back to file
fs.writeFileSync(cssFilePath, cssContent, 'utf8');

console.log(`\n✅ Theme update complete!`);
console.log(`📝 Total replacements: ${totalReplacements}`);
console.log(`📁 File updated: ${cssFilePath}`);
