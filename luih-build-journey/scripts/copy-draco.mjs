// Copies the Draco decoder shipped with three.js into /public/draco so
// compressed GLB models load offline (no CDN dependency).
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const src = resolve('node_modules/three/examples/jsm/libs/draco/gltf')
const dest = resolve('public/draco')
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true })
  cpSync(src, dest, { recursive: true })
}
