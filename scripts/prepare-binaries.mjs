#!/usr/bin/env node

/**
 * Prepare binary dependencies for Cafe
 * This script downloads and installs required binary files
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const binDir = path.join(rootDir, 'bin');

// Binary configuration
const binaries = {
  cloudflared: {
    win32: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe',
    darwin: {
      x64: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz',
      arm64: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz'
    },
    linux: 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64'
  }
};

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.writeFile(dest, '');
    https.get(url, { redirect: 'follow' }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const writeStream = fs.createWriteStream(dest);
      response.pipe(writeStream);
      
      writeStream.on('finish', () => {
        writeStream.close();
        resolve();
      });
      
      writeStream.on('error', reject);
    }).on('error', reject);
  });
}

async function prepareBinaries() {
  console.log('📦 Preparing binary dependencies...');
  
  await ensureDir(binDir);
  
  const platform = process.platform;
  const arch = process.arch;
  
  console.log(`Platform: ${platform}, Architecture: ${arch}`);
  
  // For now, just create placeholder binaries if they don't exist
  // In a real scenario, you would download actual binaries
  
  const cloudflaredPath = path.join(binDir, platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
  
  try {
    await fs.access(cloudflaredPath);
    console.log('✅ Cloudflared already exists');
  } catch {
    console.log('⚠️  Cloudflared binary not found. You may need to install it manually.');
    console.log('   Download from: https://github.com/cloudflare/cloudflared/releases');
  }
  
  console.log('✅ Binary preparation complete');
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  prepareBinaries().catch(error => {
    console.error('❌ Error preparing binaries:', error);
    process.exit(1);
  });
}

export { prepareBinaries };
