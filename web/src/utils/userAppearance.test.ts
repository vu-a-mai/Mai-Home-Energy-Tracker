import { describe, expect, it } from 'vitest'
import { getUserBgClass, getUserColorClass } from './userAppearance'

describe('userAppearance', () => {
  it('returns stable colors for the same seed', () => {
    expect(getUserColorClass('user-123')).toBe(getUserColorClass('user-123'))
    expect(getUserBgClass('Alex')).toBe(getUserBgClass('Alex'))
  })

  it('does not special-case Mai family names', () => {
    // Previously Vu/Thuy/Vy/Han were hard-coded; they should now just hash like anyone else
    const vu = getUserColorClass('Vu')
    const stranger = getUserColorClass('Jordan')
    expect(vu).toMatch(/^text-/)
    expect(stranger).toMatch(/^text-/)
  })

  it('handles empty seeds', () => {
    expect(getUserColorClass('')).toBe('text-slate-400')
    expect(getUserBgClass(null)).toBe('bg-slate-500')
  })
})
