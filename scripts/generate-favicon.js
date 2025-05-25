#!/usr/bin/env node

/* eslint-env node */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read the SVG favicon
const svgPath = join(__dirname, '..', 'public', 'favicon.svg')
const svgContent = readFileSync(svgPath, 'utf-8')

console.log('📄 SVG favicon found and ready')

// Create different size variations for web app manifest
const createManifestIcon = (size) => {
  return svgContent.replace('width="32" height="32"', `width="${size}" height="${size}"`)
}

// Generate web app manifest icons (these would be PNG in a real scenario, but SVG works too)
const sizes = [16, 32, 48, 64, 96, 128, 192, 256, 512]
const icons = sizes.map(size => ({
  src: `/favicon.svg`,
  sizes: `${size}x${size}`,
  type: 'image/svg+xml'
}))

// Create a simple web app manifest
const manifest = {
  name: 'EEN Capture',
  short_name: 'Capture',
  description: 'EEN Capture Application',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#3b82f6',
  icons
}

// Write the web app manifest
const manifestPath = join(__dirname, '..', 'public', 'manifest.json')
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

console.log('✅ Web app manifest created at public/manifest.json')
console.log('📱 Includes icon definitions for sizes:', sizes.join(', '))

// Create a simple HTML snippet to show how to include all favicon formats
const htmlSnippet = `
<!-- Favicon links for better browser compatibility -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon.svg" />
<link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#3b82f6" />
`

console.log('\n📝 Suggested HTML additions:')
console.log(htmlSnippet)

console.log('\n🎨 Favicon generation complete!')
console.log('✨ The SVG favicon will scale to all needed sizes automatically') 