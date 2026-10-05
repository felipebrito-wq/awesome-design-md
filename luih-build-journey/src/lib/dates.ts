import type { ISODate } from '@/domain/types'

/** Day numbers (days since Unix epoch, UTC) keep schedule math trivial. */
export type Day = number

const MS = 86_400_000

export const toDay = (iso: ISODate): Day => Math.floor(Date.parse(iso + 'T00:00:00Z') / MS)
export const fromDay = (d: Day): ISODate => new Date(Math.round(d) * MS).toISOString().slice(0, 10)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtDay(d: Day | ISODate, opts: { year?: boolean } = {}): string {
  const day = typeof d === 'string' ? toDay(d) : d
  const dt = new Date(Math.round(day) * MS)
  const s = `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`
  return opts.year ? `${s}, ${dt.getUTCFullYear()}` : s
}

export const monthShort = (d: Day) => MONTHS[new Date(Math.round(d) * MS).getUTCMonth()]

export const addDays = (iso: ISODate, n: number): ISODate => fromDay(toDay(iso) + n)

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
