#!/usr/bin/env node

/**
 * Bundle Size Check Script
 * Checks bundle size against configured budgets and reports results
 */

const fs = require('fs');
const path = require('path');

// Bundle size budgets (in bytes)
const BUNDLE_BUDGETS = {
  maxTotal: 300 * 1024,      // 300KB max total bundle
  warningTotal: 250 * 1024,  // 250KB warning threshold
  maxInitial: 200 * 1024,   // 200KB max initial JS
  warningInitial: 150 * 1024, // 150KB warning threshold
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getBuildStats() {
  const buildDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(buildDir)) {
    console.error(`${colors.red}Error: Build directory not found. Run 'pnpm build' first.${colors.reset}`);
    process.exit(1);
  }

  const staticDir = path.join(buildDir, 'static');
  let totalSize = 0;
  let initialSize = 0;
  const chunks = {};

  if (fs.existsSync(staticDir)) {
    // Calculate total static assets size
    function calculateDirSize(dir) {
      let size = 0;
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          size += calculateDirSize(filePath);
        } else {
          const stats = fs.statSync(filePath);
          size += stats.size;
          
          // Track JS chunks
          if (file.name.endsWith('.js')) {
            const chunkName = file.name;
            chunks[chunkName] = stats.size;
            
            // Estimate initial chunk (framework + main)
            if (chunkName.includes('framework') || chunkName.includes('main') || chunkName.includes('webpack')) {
              initialSize += stats.size;
            }
          }
        }
      }
      return size;
    }

    totalSize = calculateDirSize(staticDir);
  }

  return {
    totalSize,
    initialSize,
    chunks,
  };
}

function checkBundleSize() {
  console.log(`${colors.blue}📦 Checking bundle sizes...${colors.reset}\n`);

  const stats = getBuildStats();
  const { totalSize, initialSize, chunks } = stats;

  // Check total bundle size
  const totalStatus = 
    totalSize > BUNDLE_BUDGETS.maxTotal ? 'error' :
    totalSize > BUNDLE_BUDGETS.warningTotal ? 'warning' :
    'success';

  // Check initial bundle size
  const initialStatus = 
    initialSize > BUNDLE_BUDGETS.maxInitial ? 'error' :
    initialSize > BUNDLE_BUDGETS.warningInitial ? 'warning' :
    'success';

  // Display results
  console.log('Bundle Size Report:');
  console.log('─'.repeat(50));
  console.log(`Total Bundle:     ${formatBytes(totalSize)} / ${formatBytes(BUNDLE_BUDGETS.maxTotal)}`);
  console.log(`Initial JS:       ${formatBytes(initialSize)} / ${formatBytes(BUNDLE_BUDGETS.maxInitial)}`);
  console.log(`Chunks:           ${Object.keys(chunks).length} files`);
  console.log('─'.repeat(50));

  // Display status
  const totalIcon = totalStatus === 'error' ? '❌' : totalStatus === 'warning' ? '⚠️' : '✅';
  const initialIcon = initialStatus === 'error' ? '❌' : initialStatus === 'warning' ? '⚠️' : '✅';

  console.log(`\n${totalIcon} Total Bundle: ${totalStatus.toUpperCase()}`);
  console.log(`${initialIcon} Initial JS: ${initialStatus.toUpperCase()}`);

  // Display largest chunks
  if (Object.keys(chunks).length > 0) {
    console.log('\n📊 Largest Chunks:');
    const sortedChunks = Object.entries(chunks)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    sortedChunks.forEach(([name, size]) => {
      const percentage = ((size / totalSize) * 100).toFixed(1);
      console.log(`  ${name.padEnd(40)} ${formatBytes(size).padStart(10)} (${percentage}%)`);
    });
  }

  // Exit with error if budgets exceeded
  if (totalStatus === 'error' || initialStatus === 'error') {
    console.log(`\n${colors.red}❌ Bundle size exceeds maximum budget!${colors.reset}`);
    console.log(`${colors.yellow}💡 Consider:${colors.reset}`);
    console.log('  - Code splitting');
    console.log('  - Tree shaking');
    console.log('  - Removing unused dependencies');
    console.log('  - Lazy loading components');
    process.exit(1);
  }

  if (totalStatus === 'warning' || initialStatus === 'warning') {
    console.log(`\n${colors.yellow}⚠️  Bundle size exceeds warning threshold${colors.reset}`);
    console.log(`${colors.yellow}💡 Consider optimizing bundle size${colors.reset}`);
  }

  if (totalStatus === 'success' && initialStatus === 'success') {
    console.log(`\n${colors.green}✅ Bundle size is within limits!${colors.reset}`);
  }

  return { totalStatus, initialStatus };
}

// Run if called directly
if (require.main === module) {
  checkBundleSize();
}

module.exports = { checkBundleSize, BUNDLE_BUDGETS };
