import { useEffect, useState } from 'react'

export function useReservationClock(expiresAt?: string) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!expiresAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [expiresAt])
  return expiresAt ? Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000)) : null
}
