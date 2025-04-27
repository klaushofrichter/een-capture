import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Format date in a more readable way
function formatDate(date) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit' 
  }
  return date.toLocaleDateString(undefined, options)
}

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json')

// Read and parse package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const currentVersion = packageJson.version

// Add lastCommit with current date
packageJson.lastCommit = formatDate(new Date())

// Split version into major, minor, patch
const [major, minor, patch] = currentVersion.split('.').map(Number)
const newVersion = `${major}.${minor}.${patch + 1}`

// Update package.json
packageJson.version = newVersion
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')

console.log(`Version incremented from ${currentVersion} to ${newVersion}`)
console.log(`Added lastCommit: ${packageJson.lastCommit}`)
