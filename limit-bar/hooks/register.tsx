import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limit } from '../types'

const limits = atom({ plugin: 'limit-bar', key: 'limits' } as const, [] as Limit[])

const WIDTH = 20
const PANE = 'limits'
const LABELS: Record<string, string> = { five_hour: '5h', seven_day: 'Week', spend_limit: 'Spend' }

export const bar = (pct: number): string => {
  const filled = Math.min(WIDTH, Math.max(0, Math.round((pct / 100) * WIDTH)))
  return '█'.repeat(filled) + '░'.repeat(WIDTH - filled)
}

export const tone = (pct: number) => (pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'success')

export const resetIn = (iso: string | undefined, now: number): string => {
  if (!iso) return ''
  const ms = Date.parse(iso) - now
  if (!(ms > 0)) return ''
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h >= 24 ? ` · resets ${Math.floor(h / 24)}d ${h % 24}h` : ` · resets ${h}h ${m}m`
}

export const summary = (rows: Limit[]): string =>
  rows.length === 0
    ? 'Limits: no reading yet'
    : rows.map(r => `${LABELS[r.kind] ?? r.kind} ${r.percentUsed.toFixed(0)}%`).join(' · ')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({ name: 'limits', description: 'Show how much of your usage limits you have used' })
    const { rateLimits } = await $.session.usage()
    await update($, limits, () => rateLimits)
    $.ui.status(summary(rateLimits))
    return result
  })

  on('session.measure', async ($, e, next) => {
    await update($, limits, () => e.rateLimits)
    $.ui.status(summary(e.rateLimits))
    return next(e)
  })

  on('command.run', { command: 'limits' }, async $ => {
    const { isPlaced } = await $.ui.open({ id: PANE, title: 'Usage limits' })
    const surfaces = await $.session.surfaces()
    const { rateLimits } = await $.session.usage()
    const now = await $.clock.now()
    const diag = `\n[panel ${isPlaced ? 'placed' : 'not placed'} · surfaces: ${surfaces.join(', ') || 'none'}]`
    if (rateLimits.length === 0) return { text: 'No usage-limit reading yet.' + diag }
    return {
      text: '\n' + rateLimits
        .map(r => `${(LABELS[r.kind] ?? r.kind).padEnd(6)} ${bar(r.percentUsed)} ${r.percentUsed.toFixed(0)}%${resetIn(r.resetsAt, now)}`)
        .join('\n') + diag,
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const rows = await read($, limits)
    const now = await $.clock.now()

    if (rows.length === 0) {
      return <Text dimColor>Waiting for first reading…</Text>
    }

    return (
      <Box flexDirection="column">
        {rows.map(r => (
          <Box key={r.kind} flexDirection="column" marginBottom={1}>
            <Text weight="semibold">{LABELS[r.kind] ?? r.kind}</Text>
            <Box>
              <Text color={tone(r.percentUsed)}>{bar(r.percentUsed)}</Text>
              <Text> {r.percentUsed.toFixed(0)}%</Text>
            </Box>
            <Text dimColor>{resetIn(r.resetsAt, now).replace(' · ', '')}</Text>
          </Box>
        ))}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const rows = await read($, limits)
    const now = await $.clock.now()

    if (rows.length === 0) {
      return (
        <Box>
          <Text dimColor>Usage limits: waiting for first reading…</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {rows.map(r => (
          <Box key={r.kind}>
            <Text dimColor>{(LABELS[r.kind] ?? r.kind).padEnd(6)}</Text>
            <Text color={tone(r.percentUsed)}>{bar(r.percentUsed)}</Text>
            <Text> {r.percentUsed.toFixed(0)}%</Text>
            <Text dimColor>{resetIn(r.resetsAt, now)}</Text>
          </Box>
        ))}
      </Box>
    )
  })
}
