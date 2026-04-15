import fs from 'fs'
import path from 'path'

function findPages(dir) {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findPages(fullPath))
    } else if (entry.name === 'page.tsx') {
      results.push(fullPath)
    }
  }
  return results
}

const pages = findPages('app/admin')
let fixed = 0

for (const filePath of pages) {
  let content = fs.readFileSync(filePath, 'utf-8')
  
  if (!content.includes('DashboardLayout')) continue
  if (filePath.endsWith('layout.tsx')) continue

  // Remove import line for DashboardLayout
  content = content.replace(/import\s*\{\s*DashboardLayout\s*\}\s*from\s*["']@\/components\/dashboard-layout["']\s*\n?/g, '')
  
  // Remove <DashboardLayout requiredRole="admin"> wrapper
  content = content.replace(/<DashboardLayout\s+requiredRole="admin"\s*>\s*\n?/g, '')
  // Remove closing tag
  content = content.replace(/\s*<\/DashboardLayout>\s*\n/g, '\n')
  // Handle closing tag at end of return
  content = content.replace(/<\/DashboardLayout>/g, '')
  
  fs.writeFileSync(filePath, content)
  fixed++
  console.log(`Fixed: ${filePath}`)
}

console.log(`\nDone. Fixed ${fixed} files.`)
