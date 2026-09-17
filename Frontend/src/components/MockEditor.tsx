import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Checkbox, FormControlLabel, TextField } from '@mui/material'
import { errorMessage } from '../services/api'

export type EditorField = {
  name: string; label: string; value?: string
  type?: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'password' | 'checkbox'
  options?: string[]; readOnly?: boolean; required?: boolean; maxLength?: number
}
type Props = {
  title: string; description: string; fields: EditorField[]; submitLabel?: string; successMessage?: string | null
  onSave?: (values: Record<string, string>) => void | Promise<unknown>; onClose: () => void
}
export function MockEditor({ title, description, fields, submitLabel = 'Salvar alterações', successMessage = 'Alterações salvas com sucesso.', onSave, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(f => [f.name, f.value ?? ''])))
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(false), 4500)
    return () => window.clearTimeout(timer)
  }, [saved])
  const change = (name: string, value: string) => { setValues(current => ({ ...current, [name]: value })); setSaved(false); setError('') }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setSaved(false)
    try {
      if (!onSave) throw new Error('Esta operação ainda não foi integrada.')
      await onSave(values)
      // Não manter senhas, PAN e CVV na tela após salvar.
      setValues(current => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, /senha|numeroCartao|codigoSeguranca/i.test(key) ? '' : value])))
      setSaved(true)
    } catch (cause) { setError(errorMessage(cause)) }
    finally { setBusy(false) }
  }
  return <form className="mock-editor" onSubmit={submit} aria-label={title}>
    <header><div><span className="eyebrow">FORMULÁRIO</span><h2>{title}</h2><p>{description}</p></div><button type="button" disabled={busy} onClick={onClose} aria-label="Fechar editor">×</button></header>
    <div className="mock-editor__grid">
      {fields.map(field => field.type === 'checkbox' ? <FormControlLabel key={field.name} label={field.label} control={<Checkbox name={field.name} checked={values[field.name] === 'true'} disabled={busy || field.readOnly} onChange={e => change(field.name, String(e.target.checked))} />} /> :
        <TextField key={field.name} id={'editor-' + field.name} name={field.name} label={field.label}
          value={values[field.name]} onChange={e => change(field.name, e.target.value)} required={field.required}
          type={['select', 'textarea'].includes(field.type ?? '') ? 'text' : field.type ?? 'text'}
          select={field.type === 'select'} multiline={field.type === 'textarea'} minRows={field.type === 'textarea' ? 3 : undefined}
          fullWidth size="small" disabled={busy} className={field.type === 'textarea' ? 'mock-editor__wide' : undefined}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { readOnly: field.readOnly, maxLength: field.maxLength, step: field.type === 'number' ? 'any' : undefined, autoComplete: field.type === 'password' ? 'new-password' : 'off' }, select: { native: true } }}>
          {field.type === 'select' ? field.options?.map(option => <option key={option} value={option}>{option || 'Selecione'}</option>) : undefined}
        </TextField>)}
    </div>
    {error && <Alert severity="error" role="alert">{error}</Alert>}
    {saved && successMessage && <Alert severity="success" role="status">{successMessage}</Alert>}
    <footer><button type="button" className="button button--outline" disabled={busy} onClick={onClose}>Cancelar</button><button className="button" type="submit" disabled={busy}>{busy ? 'Salvando…' : submitLabel}</button></footer>
  </form>
}
