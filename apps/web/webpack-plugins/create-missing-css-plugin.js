/**
 * Webpack plugin to create missing CSS file during build
 * This handles the case where some dependencies try to access
 * .next/browser/default-stylesheet.css during static generation
 */
const fs = require('fs');
const path = require('path');

class CreateMissingCssPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tap('CreateMissingCssPlugin', () => {
      const cssPath = path.join(compiler.options.output.path, 'browser', 'default-stylesheet.css');
      const cssDir = path.dirname(cssPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(cssDir)) {
        fs.mkdirSync(cssDir, { recursive: true });
      }
      
      // Create empty CSS file if it doesn't exist
      if (!fs.existsSync(cssPath)) {
        fs.writeFileSync(cssPath, '/* Empty stylesheet - created by webpack plugin */\n', 'utf8');
      }
    });

    compiler.hooks.afterEmit.tap('CreateMissingCssPlugin', (compilation) => {
      const cssPath = path.join(compilation.outputOptions.path, 'browser', 'default-stylesheet.css');
      const cssDir = path.dirname(cssPath);
      
      // Ensure the file exists after emit
      if (!fs.existsSync(cssDir)) {
        fs.mkdirSync(cssDir, { recursive: true });
      }
      
      if (!fs.existsSync(cssPath)) {
        fs.writeFileSync(cssPath, '/* Empty stylesheet - created by webpack plugin */\n', 'utf8');
      }
    });
  }
}

module.exports = CreateMissingCssPlugin;

