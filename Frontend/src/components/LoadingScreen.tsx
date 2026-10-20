import { CircularProgress } from '@mui/material'

export function LoadingScreen({ message = 'Carregando...' }: { message?: string }) {
  return <section className="page-width loading-screen" role="status" aria-live="polite" aria-busy="true">
    <CircularProgress aria-label={message} />
    <p>{message}</p>
  </section>
}
