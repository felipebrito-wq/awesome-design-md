/**
 * Regenerates the placeholder site photos in /public/photos by rendering the
 * home at each photo's date from its jobsite camera station.
 *
 *   npm run dev            (in another terminal)
 *   npm run photos         (requires: npm i -D playwright && npx playwright install chromium)
 *
 * Real Buildertrend photos replace these automatically once the API adapter
 * is wired — this only exists so the prototype has consistent imagery.
 */
import { writeFileSync, mkdirSync } from 'node:fs'

const { chromium } = await import('playwright')
const base = process.env.APP_URL ?? 'http://localhost:5173'
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
await page.goto(`${base}/?capture=1&quality=low`)
await page.waitForFunction(() => window.__capture && window.__luih?.getState().project, null, { timeout: 60000 })
await page.waitForTimeout(4000)
const photos = await page.evaluate(() => window.__luih.getState().project.photos.filter((p) => p.station))
mkdirSync('public/photos', { recursive: true })
for (const p of photos) {
  const url = await page.evaluate(([station, date]) => window.__capture(station, { date, width: 1500 }), [p.station, p.date])
  writeFileSync(`public/photos/${p.id}.jpg`, Buffer.from(url.split(',')[1], 'base64'))
  console.log('✓', p.id, p.date, p.station, p.caption)
}
await browser.close()
