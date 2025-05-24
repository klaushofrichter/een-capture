#!/usr/bin/env node

/* eslint-env node */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the required Node version from package.json
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
const requiredNodeVersion = packageJson.engines?.node || '>=20.19.0';

// Get current Node version
const currentVersion = process.version;

// Extract minimum version from requirement (e.g., ">=20.19.0" -> "20.19.0")
const versionMatch = requiredNodeVersion.match(/(\d+)\.(\d+)\.(\d+)/);
if (!versionMatch) {
  console.error('❌ Could not parse required Node version from package.json');
  process.exit(1);
}

const [, requiredMajor, requiredMinor, requiredPatch] = versionMatch.map(Number);
const requiredVersionString = `${requiredMajor}.${requiredMinor}.${requiredPatch}`;

// Parse current version
const currentMatch = currentVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
if (!currentMatch) {
  console.error('❌ Could not parse current Node version');
  process.exit(1);
}

const [, currentMajor, currentMinor, currentPatch] = currentMatch.map(Number);

// Check if current version meets requirements
function versionSatisfies(current, required) {
  const [cMajor, cMinor, cPatch] = current;
  const [rMajor, rMinor, rPatch] = required;
  
  if (cMajor > rMajor) return true;
  if (cMajor < rMajor) return false;
  
  if (cMinor > rMinor) return true;
  if (cMinor < rMinor) return false;
  
  return cPatch >= rPatch;
}

const isVersionValid = versionSatisfies(
  [currentMajor, currentMinor, currentPatch],
  [requiredMajor, requiredMinor, requiredPatch]
);

console.log('\n🔍 Node.js Version Check');
console.log('========================');
console.log(`📍 Current version: ${currentVersion}`);
console.log(`📋 Required version: ${requiredNodeVersion}`);

if (isVersionValid) {
  console.log('✅ Node.js version meets requirements!');
  console.log('🚀 You can proceed with development and testing.\n');
  process.exit(0);
} else {
  console.log('❌ Node.js version does not meet requirements!');
  console.log('\n💡 To fix this issue:');
  console.log('   1. If using nvm:');
  console.log('      nvm install 20.19.0');
  console.log('      nvm use');
  console.log('   2. Or install Node.js 20.19.0+ from https://nodejs.org/');
  console.log('   3. Then run this script again to verify\n');
  process.exit(1);
} 