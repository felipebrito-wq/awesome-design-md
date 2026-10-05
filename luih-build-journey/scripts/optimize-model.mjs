/**
 * Architectural model optimization: BIM export → web-ready GLB.
 *
 *   npm run optimize-model -- path/to/raw.glb [public/models/home.glb]
 *
 * Steps (via @gltf-transform/cli, fetched on demand with npx):
 *   dedup → prune → weld → simplify (ratio 0.5, error 0.001) → instance
 *   → resize textures 2048 → webp → draco
 * Node names / extras (luih_component) are preserved for component mapping.
 */
import { execSync } from 'node:child_process'
import { statSync } from 'node:fs'

const [input, output = 'public/models/home.glb'] = process.argv.slice(2)
if (!input) {
  console.error('Usage: npm run optimize-model -- <input.glb> [output.glb]')
  process.exit(1)
}
const run = (cmd) => {
  console.log('›', cmd)
  execSync(cmd, { stdio: 'inherit' })
}
const tmp = output.replace(/\.glb$/, '.tmp.glb')
run(`npx -y @gltf-transform/cli optimize "${input}" "${tmp}" --compress false --texture-compress webp --texture-size 2048 --simplify true --simplify-ratio 0.5 --simplify-error 0.001 --instance true`)
run(`npx -y @gltf-transform/cli draco "${tmp}" "${output}" --method edgebreaker`)
run(`rm -f "${tmp}"`)
const mb = (f) => (statSync(f).size / 1e6).toFixed(1) + ' MB'
console.log(`\n${input} (${mb(input)}) → ${output} (${mb(output)})`)
