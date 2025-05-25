import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json')

// Read and parse package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const currentVersion = packageJson.version

// Add lastCommit with current date in ISO 8601 format
packageJson.lastCommit = new Date().toISOString()

// Split version into major, minor, patch
const [major, minor, patch] = currentVersion.split('.').map(Number)
const newVersion = `${major}.${minor}.${patch + 1}`

// Update package.json
packageJson.version = newVersion
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')

console.log(`Version incremented from ${currentVersion} to ${newVersion}`)
console.log(`Added lastCommit: ${packageJson.lastCommit}`)

// Stage the changes to package.json (important for the pre-commit hook)
try {
  exec('git add package.json', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error staging package.json: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`)
      return
    }
    console.log('Changes to package.json staged for commit')
  })
} catch (error) {
  console.error(`Exception when staging package.json: ${error.message}`)
}
