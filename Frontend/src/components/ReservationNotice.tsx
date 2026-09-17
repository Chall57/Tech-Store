import { useEffect, useRef } from 'react'
import { Alert } from '@mui/material'
import { useDemoStore } from '../context/DemoContext'
import { useReservationClock } from '../hooks/useReservationClock'

export function ReservationNotice({ expiresAt }: { expiresAt?: string }) {
  const seconds = useReservationClock(expiresAt)
  const { notify } = useDemoStore()
  const warned = useRef('')
  useEffect(() => {
    if (expiresAt && seconds !== null && seconds > 0 && seconds <= 300 && warned.current !== expiresAt) {
      warned.current = expiresAt
      notify('Sua reserva de estoque expira em menos de 5 minutos. Finalize a compra para manter os itens.', 'warning')
    }
  }, [expiresAt, seconds, notify])
  if (seconds === null) return null
  return <Alert severity={seconds <= 300 ? 'warning' : 'info'}>
    {seconds === 0 ? 'A reserva expirou. Os itens serão liberados; adicione os produtos novamente.'
      : `Estoque reservado por ${Math.floor(seconds / 60)}min ${String(seconds % 60).padStart(2, '0')}s.`}
  </Alert>
}
