#!/usr/bin/env bun

import { watch } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths to watch
const templatesDir = join(__dirname, '../services/delivery/email-templates');
const previewScript = join(__dirname, 'preview-email-template.ts');

// Keep track of the preview server process
let previewProcess: any = null;
let isGenerating = false;
let pendingRegeneration = false;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Function to generate preview
async function generatePreview() {
  if (isGenerating) {
    pendingRegeneration = true;
    return;
  }

  isGenerating = true;
  
  try {
    log('\n🔄 Regenerating email template preview...', colors.cyan);
    
    // Run the preview script
    const result = await new Promise((resolve, reject) => {
      const proc = spawn('bun', ['run', previewScript], {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        console.error(data.toString());
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Preview generation failed with code ${code}`));
        }
      });
    });

    log('✅ Preview regenerated successfully!', colors.green);
    
    // If there was a pending regeneration request, run it now
    if (pendingRegeneration) {
      pendingRegeneration = false;
      setTimeout(() => generatePreview(), 100);
    }
  } catch (error) {
    log(`❌ Error generating preview: ${error}`, colors.yellow);
  } finally {
    isGenerating = false;
  }
}

// Simple HTTP server to serve the preview with auto-reload
async function startPreviewServer() {
  const previewPath = join(process.cwd(), 'email-preview.html');
  
  Bun.serve({
    port: 3333,
    async fetch(req) {
      const url = new URL(req.url);
      
      if (url.pathname === '/') {
        try {
          const file = Bun.file(previewPath);
          let content = await file.text();
          
          // Inject auto-reload script
          const autoReloadScript = `
            <script>
              // Auto-reload functionality
              let lastModified = Date.now();
              
              async function checkForUpdates() {
                try {
                  const response = await fetch('/check-update');
                  const data = await response.json();
                  
                  if (data.modified > lastModified) {
                    lastModified = data.modified;
                    location.reload();
                  }
                } catch (error) {
                  console.error('Failed to check for updates:', error);
                }
              }
              
              // Check for updates every second
              setInterval(checkForUpdates, 1000);
              
              console.log('📧 Email template preview with auto-reload enabled');
            </script>
          `;
          
          // Inject before closing body tag
          content = content.replace('</body>', `${autoReloadScript}</body>`);
          
          return new Response(content, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        } catch (error) {
          return new Response('Preview file not found. Generating...', { status: 404 });
        }
      }
      
      if (url.pathname === '/check-update') {
        try {
          const file = Bun.file(previewPath);
          const stats = await file.exists();
          
          return new Response(JSON.stringify({ 
            modified: stats ? Date.now() : 0 
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ modified: 0 }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      return new Response('Not found', { status: 404 });
    }
  });
  
  log(`\n🌐 Preview server running at: ${colors.bright}http://localhost:3333${colors.reset}`, colors.green);
  log('📺 The preview will auto-reload when templates change\n', colors.blue);
}

// Watch for changes
function startWatching() {
  log(`\n👀 Watching for changes in: ${templatesDir}`, colors.cyan);
  
  // Watch the templates directory recursively
  watch(templatesDir, { recursive: true }, async (eventType, filename) => {
    if (filename && (filename.endsWith('.pug') || filename.endsWith('.ts'))) {
      log(`\n📝 Detected change in: ${filename}`, colors.yellow);
      await generatePreview();
    }
  });

  // Also watch the email-templates.ts file
  const emailTemplatesFile = join(__dirname, '../services/delivery/email-templates.ts');
  watch(emailTemplatesFile, async () => {
    log(`\n📝 Detected change in email-templates.ts`, colors.yellow);
    await generatePreview();
  });
}

// Main function
async function main() {
  console.clear();
  log('🚀 Starting Email Template Development Server', colors.bright);
  log('=' .repeat(50), colors.cyan);
  
  // Generate initial preview
  await generatePreview();
  
  // Start the preview server
  await startPreviewServer();
  
  // Start watching for changes
  startWatching();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n\n👋 Shutting down development server...', colors.yellow);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    process.exit(0);
  });
}

// Run the main function
main().catch((error) => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});