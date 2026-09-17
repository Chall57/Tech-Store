import { describe, expect, it } from 'vitest'
import { localDate } from './localDate'

describe('Data civil dos formulários', () => {
  it('conserva o dia local próximo da meia-noite, sem converter para UTC', () => {
    expect(localDate(new Date(2026, 8, 16, 23, 59))).toBe('2026-09-16')
  })
  it('preenche mês e dia com dois dígitos', () => {
    expect(localDate(new Date(2026, 0, 2, 0, 1))).toBe('2026-01-02')
  })
})
