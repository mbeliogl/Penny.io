/**
 * CSS Splitting Script
 * Splits the monolithic App.css into organized, maintainable files
 */

const fs = require('fs');
const path = require('path');

const APP_CSS_PATH = path.join(__dirname, 'src', 'App.css');
const STYLES_DIR = path.join(__dirname, 'src', 'styles');

// File definitions with their selector patterns
const fileDefinitions = {
  'base.css': {
    patterns: [
      /^\/\* Import theme/,
      /^@import/,
      /^\*/,
      /^html/,
      /^body/,
      /^\.App\s*{/,
    ],
  },
  'layout.css': {
    patterns: [
      /^\.header/,
      /^\.footer/,
      /^\.container/,
      /^\.hero-grid-section/,
      /^\.grid/,
      /^main\s*{/,
      /^section\s*{/,
    ],
  },
  'components/navigation.css': {
    patterns: [
      /^\.nav-links-center/,
      /^\.link(?![a-z])/,  // .link but not .link-title
      /^\.link-/,
      /^\.link:/,
      /^\.link\./,
      /^\.link\s/,
      /^\.link,/,
    ],
  },
  'components/badges.css': {
    patterns: [
      /^\.auth-status-badges/,
      /^\.auth-badge/,
      /^\.network-label/,
      /^\.auth-container/,
    ],
  },
  'components/wallet.css': {
    patterns: [
      /^\.wallet-/,
      /^wui-/,
      /^w3m-/,
      /^wcm-/,
      /^\.appkit-/,
      /^\.web3modal-/,
      /^\[data-testid.*wallet/i,
    ],
  },
  'components/buttons.css': {
    patterns: [
      /^\.cta-/,
      /^\.button(?![a-z])/,
      /^\.btn-/,
      /^\.scroll-to-top/,
      /^button\s*{/,
      /^button\./,
      /^button:/,
      /^\.action-button/,
      /^\.icon-button/,
    ],
  },
  'components/cards.css': {
    patterns: [
      /^\.article-card/,
      /^\.card(?![a-z])/,
      /^\.card-/,
      /^\.info-card/,
      /^\.stats-card/,
    ],
  },
  'components/forms.css': {
    patterns: [
      /^input/,
      /^textarea/,
      /^select/,
      /^\.form-/,
      /^\.input-/,
      /^\.search-/,
      /^label\s*{/,
      /^\.field-/,
      /^\.checkbox/,
      /^\.radio/,
    ],
  },
  'components/modals.css': {
    patterns: [
      /^\.modal/,
      /^\.dialog/,
      /^\.overlay/,
      /^\.popup/,
      /^\.session-expired/,
      /^\.auth-prompt/,
    ],
  },
  'pages/home.css': {
    patterns: [
      /^\.home(?![a-z])/,
      /^\.hero(?![a-z])/,
      /^\.hero\s/,
      /^\.hero:/,
      /^\.hero-/,
      /^\.featured-articles/,
      /^\.typing-text/,
      /^\.cursor/,
    ],
  },
  'pages/dashboard.css': {
    patterns: [
      /^\.dashboard/,
      /^\.stats-/,
      /^\.my-articles/,
      /^\.earnings-/,
      /^\.analytics/,
    ],
  },
  'pages/explore.css': {
    patterns: [
      /^\.explore/,
      /^\.category-/,
      /^\.filter-/,
      /^\.view-toggle/,
      /^\.article-grid/,
      /^\.article-list/,
      /^\.load-more/,
      /^\.end-of-results/,
      /^\.loading-more/,
    ],
  },
  'pages/article.css': {
    patterns: [
      /^\.article(?![a-z])/,
      /^\.article\s/,
      /^\.article:/,
      /^\.article-content/,
      /^\.article-header/,
      /^\.article-body/,
      /^\.article-meta/,
      /^\.article-stats/,
      /^\.payment-/,
      /^\.paywall/,
      /^\.like-button/,
      /^\.author-/,
      /^\.read-time/,
      /^\.price(?![a-z])/,
      /^\.usdc-/,
    ],
  },
  'pages/write.css': {
    patterns: [
      /^\.write/,
      /^\.editor/,
      /^\.tox/,
      /^\.mce-/,
      /^\.tinymce/,
      /^\.draft-/,
      /^\.preview-modal/,
      /^\.category-selector/,
      /^\.publish-/,
    ],
  },
  'pages/static.css': {
    patterns: [
      /^\.about/,
      /^\.help/,
      /^\.privacy/,
      /^\.terms/,
      /^\.contact/,
      /^\.resources/,
      /^\.pricing/,
      /^\.how-it-works/,
      /^\.whitepaper/,
      /^\.static-page/,
      /^\.content-section/,
    ],
  },
  'pages/x402-test.css': {
    patterns: [
      /^\.x402/,
      /^\.test-page/,
      /^\.payment-test/,
    ],
  },
};

// Fallback for unmatched styles
const fallbackFile = 'components/misc.css';

function matchesPattern(line, patterns) {
  return patterns.some(pattern => pattern.test(line));
}

function determineFileForBlock(block) {
  const firstLine = block.split('\n')[0].trim();

  for (const [filename, { patterns }] of Object.entries(fileDefinitions)) {
    if (matchesPattern(firstLine, patterns)) {
      return filename;
    }
  }

  return fallbackFile;
}

function splitCSS() {
  console.log('📖 Reading App.css...');
  const content = fs.readFileSync(APP_CSS_PATH, 'utf8');

  // Skip the @import line if it exists
  const lines = content.split('\n');
  let startIndex = 0;
  if (lines[0].includes('@import') && lines[0].includes('theme.css')) {
    startIndex = 3; // Skip import, blank line, and comment
  }

  // Parse into blocks (selector + rules)
  const blocks = [];
  let currentBlock = [];
  let braceDepth = 0;
  let inComment = false;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    currentBlock.push(line);

    // Track multi-line comments
    if (line.includes('/*')) inComment = true;
    if (line.includes('*/')) inComment = false;

    // Track braces
    if (!inComment) {
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
    }

    // End of block
    if (braceDepth === 0 && currentBlock.length > 0 && line.trim() !== '') {
      blocks.push(currentBlock.join('\n'));
      currentBlock = [];
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  console.log(`✂️  Parsed ${blocks.length} CSS blocks`);

  // Categorize blocks
  const fileContents = {};

  blocks.forEach((block, index) => {
    const targetFile = determineFileForBlock(block);

    if (!fileContents[targetFile]) {
      fileContents[targetFile] = [];
    }

    fileContents[targetFile].push(block);
  });

  // Write files
  console.log('\n📝 Writing split CSS files...');
  let totalWritten = 0;

  for (const [filename, blocks] of Object.entries(fileContents)) {
    const filePath = path.join(STYLES_DIR, filename);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Add header comment
    const fileHeader = `/* ${filename} */\n/* Auto-generated from App.css refactoring */\n\n`;
    const content = fileHeader + blocks.join('\n\n');

    fs.writeFileSync(filePath, content, 'utf8');
    totalWritten += blocks.length;
    console.log(`   ✓ ${filename} (${blocks.length} blocks, ${content.split('\n').length} lines)`);
  }

  console.log(`\n✅ Split complete! ${totalWritten} blocks written to ${Object.keys(fileContents).length} files`);

  return Object.keys(fileContents);
}

function createIndexCSS(filenames) {
  console.log('\n📋 Creating new App.css with imports...');

  const imports = [
    '/* Readia.io - Modular CSS Architecture */',
    '/* This file imports all styles in the correct cascade order */',
    '',
    '/* 1. Theme Variables (must load first) */',
    "@import './styles/theme.css';",
    '',
    '/* 2. Base Styles */',
    "@import './styles/base.css';",
    '',
    '/* 3. Layout */',
    "@import './styles/layout.css';",
    '',
    '/* 4. Components */',
  ];

  // Add component imports
  const componentFiles = filenames.filter(f => f.startsWith('components/'));
  componentFiles.forEach(file => {
    imports.push(`@import './styles/${file}';`);
  });

  imports.push('', '/* 5. Page-Specific Styles */');

  // Add page imports
  const pageFiles = filenames.filter(f => f.startsWith('pages/'));
  pageFiles.forEach(file => {
    imports.push(`@import './styles/${file}';`);
  });

  const newAppCSS = imports.join('\n') + '\n';

  // Backup old App.css
  const backupPath = APP_CSS_PATH + '.backup';
  fs.copyFileSync(APP_CSS_PATH, backupPath);
  console.log(`   📦 Backed up original to App.css.backup`);

  // Write new App.css
  fs.writeFileSync(APP_CSS_PATH, newAppCSS, 'utf8');
  console.log(`   ✓ Created new App.css with ${imports.length} lines`);
}

// Run the script
try {
  const writtenFiles = splitCSS();
  createIndexCSS(writtenFiles);

  console.log('\n🎉 CSS refactoring complete!');
  console.log('📁 Check frontend/src/styles/ for organized CSS files');
  console.log('⚠️  Original App.css backed up to App.css.backup');
  console.log('\n💡 Next: Run `npm run dev` to test the build');
} catch (error) {
  console.error('❌ Error during CSS split:', error);
  process.exit(1);
}
