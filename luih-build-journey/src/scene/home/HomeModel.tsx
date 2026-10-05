/**
 * AssetAdapter: decides which home representation to render.
 *   /public/models/home.glb present → GlbHome (real BIM/architectural model)
 *   otherwise                       → ProceduralHome (placeholder)
 * Everything else (timeline, X-Ray, inspector, data) is identical.
 */
import { Suspense, useEffect, useState } from 'react'
import { GlbHome } from './GlbHome'
import { ProceduralHome } from './ProceduralHome'

export const HOME_MODEL_URL = 'models/home.glb'

function useAssetAvailable(url: string) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    fetch(url, { method: 'HEAD' })
      .then((r) => alive && setOk(r.ok && !(r.headers.get('content-type') ?? '').includes('text/html')))
      .catch(() => alive && setOk(false))
    return () => {
      alive = false
    }
  }, [url])
  return ok
}

export function HomeModel() {
  const hasGlb = useAssetAvailable(HOME_MODEL_URL)
  if (hasGlb === null) return null
  if (hasGlb)
    return (
      <Suspense fallback={<ProceduralHome />}>
        <GlbHome url={HOME_MODEL_URL} />
      </Suspense>
    )
  return <ProceduralHome />
}
