import { execSync } from 'child_process'
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const sourceIcon = join(projectRoot, 'resources', 'icon.png')
const androidResDir = join(projectRoot, 'android', 'app', 'src', 'main', 'res')

const splashDirs = [
  'drawable',
  'drawable-land-hdpi',
  'drawable-land-mdpi',
  'drawable-land-xhdpi',
  'drawable-land-xxhdpi',
  'drawable-land-xxxhdpi',
  'drawable-port-hdpi',
  'drawable-port-mdpi',
  'drawable-port-xhdpi',
  'drawable-port-xxhdpi',
  'drawable-port-xxxhdpi',
]

if (!existsSync(sourceIcon)) {
  console.error('Source icon not found:', sourceIcon)
  process.exit(1)
}

console.log('Updating Android splash screens with icon:', sourceIcon)

for (const dir of splashDirs) {
  const targetDir = join(androidResDir, dir)
  const targetFile = join(targetDir, 'splash.png')
  
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }
  
  copyFileSync(sourceIcon, targetFile)
  console.log('Updated:', targetFile)
}

console.log('\nDone! Android splash screens updated.')
console.log('Run "npm run cap:sync" to sync with Capacitor.')
