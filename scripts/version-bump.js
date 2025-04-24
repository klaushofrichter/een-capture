import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json')
const constantsPath = path.join(__dirname, '..', 'src', 'constants.js')

// Read and parse package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const currentVersion = packageJson.version

// Split version into major, minor, patch
const [major, minor, patch] = currentVersion.split('.').map(Number)
const newVersion = `${major}.${minor}.${patch + 1}`

// Update package.json
packageJson.version = newVersion
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')

// Read and update constants.js
const constantsContent = fs.readFileSync(constantsPath, 'utf8')
const updatedConstantsContent = constantsContent.replace(
  /export const APP_VERSION = ['"].*['"]/,
  `export const APP_VERSION = '${newVersion}'`
)
fs.writeFileSync(constantsPath, updatedConstantsContent)

console.log(`Version incremented from ${currentVersion} to ${newVersion}`)
