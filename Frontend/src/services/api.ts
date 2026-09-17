export class ApiError extends Error {
  status: number
  fields: Record<string, string>
  constructor(message: string, status = 0, fields: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}
const baseUrl = import.meta.env.VITE_API_URL ?? '/api'
// Somente o ID do perfil é local. Dados cadastrais e transações vêm da API.
async function responseApi(path: string, options: RequestInit = {}): Promise<Response> {
  let response: Response
  try {
    response = await fetch(baseUrl + path, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', 'X-Perfil': sessionStorage.getItem('techstore.perfil') ?? 'VISITANTE', ...options.headers },
    })
  } catch {
    throw new ApiError('Não foi possível conectar à API. Verifique se o backend está em execução.')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message = [502, 503, 504].includes(response.status)
      ? 'A API está indisponível ou não respondeu ao encaminhamento. Verifique se o backend está em execução na porta configurada e tente novamente.'
      : 'Não foi possível concluir a operação.'
    throw new ApiError(error.message ?? message, response.status, error.fields)
  }
  return response
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await responseApi(path, options)
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}
export async function apiFile(path: string): Promise<Blob> {
  return (await responseApi(path)).blob()
}
export function errorMessage(error: unknown) {
  if (error instanceof ApiError && Object.keys(error.fields).length) return Object.entries(error.fields).map(([field, message]) => `${field}: ${message}`).join(' ')
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}
export const body = (data: unknown) => JSON.stringify(data)
