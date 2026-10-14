import { expect, mock, test } from 'claude-code/testing'

const props = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 60, scroll: { offset: 0, bodyRows: 10 }, view: {} }

test('the bar draws on mobile, desktop and terminal', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  mock.clock(on, { now: Date.parse('2026-10-14T10:00:00Z') })
  await $.session.measure({
    context: {} as never,
    rateLimits: [{ kind: 'five_hour', percentUsed: 62 }, { kind: 'seven_day', percentUsed: 27 }],
    changed: ['rateLimits'],
  })
  for (const surface of ['mobile', 'desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ plugin: 'limit-bar', surface, component: 'AbovePrompt', props })
    expect(await ui.find({ type: 'Text', text: /62%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /27%/ })).toBeDefined()
    await ui.unmount()
  }
})

test('the pinned pane draws on desktop', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  mock.clock(on, { now: Date.parse('2026-10-14T10:00:00Z') })
  await $.session.measure({ context: {} as never, rateLimits: [{ kind: 'five_hour', percentUsed: 44 }], changed: ['rateLimits'] })
  const ui = await $.ui.mount({ plugin: 'limit-bar', surface: 'desktop', component: 'Pane', requestId: 'limits', props: {} as never })
  expect(await ui.find({ type: 'Text', text: /44%/ })).toBeDefined()
  await ui.unmount()
})
