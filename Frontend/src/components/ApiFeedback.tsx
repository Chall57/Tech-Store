import { Alert, LinearProgress } from '@mui/material'
import { useDemoStore } from '../context/DemoContext'
import { errorMessage } from '../services/api'
export function ApiFeedback() {
  const { loading, error, reload } = useDemoStore()
  return <>{loading && <LinearProgress aria-label="Carregando dados" />}{error && <Alert severity="error" action={<button onClick={() => void reload()}>Tentar novamente</button>}>{errorMessage(error)}</Alert>}</>
}
