import type { ReactElement } from 'react'
import { UserIcon } from '@heroicons/react/24/outline'

const USER_COLOR_CLASSES = [
  'text-emerald-400',
  'text-sky-400',
  'text-violet-400',
  'text-amber-400',
  'text-rose-400',
  'text-cyan-400',
  'text-indigo-400',
  'text-lime-400',
] as const

const USER_BG_CLASSES = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-lime-500',
] as const

function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** Stable accent color class from user id or name (not family-name keyed). */
export function getUserColorClass(seed: string | null | undefined): string {
  if (!seed) return 'text-slate-400'
  return USER_COLOR_CLASSES[hashSeed(seed) % USER_COLOR_CLASSES.length]
}

export function getUserBgClass(seed: string | null | undefined): string {
  if (!seed) return 'bg-slate-500'
  return USER_BG_CLASSES[hashSeed(seed) % USER_BG_CLASSES.length]
}

export function getUserIcon(
  seed: string | null | undefined,
  className = 'w-4 h-4 inline-block'
): ReactElement {
  return <UserIcon className={`${className} ${getUserColorClass(seed)}`} />
}
