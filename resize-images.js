#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TARGET_PORTRAIT = { width: 1242, height: 2688 };
const TARGET_LANDSCAPE = { width: 2688, height: 1242 };

const imagePaths = [
  './assets/images/partial-react-logo.png',
  './assets/images/react-logo.png',
  './assets/images/react-logo@2x.png',
  './assets/images/react-logo@3x.png'
];

function getImageDimensions(imagePath) {
  try {
    const output = execSync(`sips -g pixelWidth -g pixelHeight "${imagePath}"`, { encoding: 'utf8' });
    const widthMatch = output.match(/pixelWidth: (\d+)/);
    const heightMatch = output.match(/pixelHeight: (\d+)/);
    
    if (widthMatch && heightMatch) {
      return {
        width: parseInt(widthMatch[1]),
        height: parseInt(heightMatch[1])
      };
    }
  } catch (error) {
    console.error(`Error getting dimensions for ${imagePath}:`, error.message);
  }
  return null;
}

function resizeImage(imagePath, targetWidth, targetHeight) {
  try {
    const backupPath = imagePath.replace(/(\.[^.]+)$/, '_backup$1');
    
    // Create backup
    execSync(`cp "${imagePath}" "${backupPath}"`);
    
    // Resize image
    execSync(`sips -z ${targetHeight} ${targetWidth} "${imagePath}"`);
    
    console.log(`✓ Resized ${imagePath} to ${targetWidth}×${targetHeight}px`);
    console.log(`  Backup saved as ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`✗ Error resizing ${imagePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🖼️  Image Resizer');
  console.log('Target dimensions: 1242×2688px (portrait) or 2688×1242px (landscape)\n');

  for (const imagePath of imagePaths) {
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  Skipping ${imagePath} - file not found`);
      continue;
    }

    const dimensions = getImageDimensions(imagePath);
    if (!dimensions) {
      console.log(`⚠️  Skipping ${imagePath} - could not get dimensions`);
      continue;
    }

    console.log(`📏 Current dimensions for ${imagePath}: ${dimensions.width}×${dimensions.height}px`);

    // Determine if image is more portrait or landscape oriented
    const isPortrait = dimensions.height > dimensions.width;
    const target = isPortrait ? TARGET_PORTRAIT : TARGET_LANDSCAPE;

    console.log(`🎯 Target: ${target.width}×${target.height}px (${isPortrait ? 'portrait' : 'landscape'})`);
    
    const success = resizeImage(imagePath, target.width, target.height);
    console.log('');
  }

  console.log('✅ Resize operation completed!');
}

if (require.main === module) {
  main();
}