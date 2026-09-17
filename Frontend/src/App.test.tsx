import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { MockEditor } from './components/MockEditor'
import { api, ApiError } from './services/api'

beforeEach(() => {
  sessionStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function renderApp(path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></QueryClientProvider>)
}
describe('Tech Store conectada à API', () => {
  it('mantém navegação e carrinho vazio quando não há registros', async () => {
    renderApp()
    expect(screen.getByRole('heading', { name: /componentes para montar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conta' })).toHaveAttribute('href', '/conta')
    await userEvent.click(screen.getAllByRole('link', { name: /carrinho/i })[0])
    expect(await screen.findByText('Seu carrinho está vazio.')).toBeInTheDocument()
    expect(screen.queryByText('GeForce RTX 5070 Gaming 12 GB')).not.toBeInTheDocument()
  })
  it('preserva o acesso direto ao administrador e não inventa clientes', async () => {
    renderApp('/perfis')
    expect(await screen.findByText('Administrador')).toBeInTheDocument()
    expect(screen.queryByText('Lucas Paulino')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Escolha um perfil' })).toBeInTheDocument()
  })
  it('retorna à loja pelo logo da barra lateral administrativa', async () => {
    renderApp('/admin/pedidos')
    await userEvent.click(screen.getByRole('link', { name: 'Tech Store — início' }))
    expect(await screen.findByRole('heading', { name: /componentes para montar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conta' })).toHaveAttribute('href', '/conta')
  })
  it('mostra falha de comunicação em vez de retornar um mock', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    renderApp('/perfis')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API')
    expect(screen.queryByText('Lucas Paulino')).not.toBeInTheDocument()
  })
  it('não mostra sucesso quando a gravação do formulário falha', async () => {
    render(<MockEditor title="Teste de gravação" description="" fields={[{ name: 'nome', label: 'Nome' }]} onClose={() => undefined} onSave={async () => { throw new Error('Gravação recusada') }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Gravação recusada')
    expect(screen.queryByText('Alterações salvas com sucesso.')).not.toBeInTheDocument()
  })
  it('aguarda a API antes de exibir confirmação', async () => {
    let finish!: () => void
    const pending = new Promise<void>(resolve => { finish = resolve })
    render(<MockEditor title="Teste de gravação" description="" fields={[]} onClose={() => undefined} onSave={() => pending} />)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
    finish()
    expect(await screen.findByText('Alterações salvas com sucesso.')).toBeInTheDocument()
  })
  it('centraliza status HTTP e erros de campo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Confira os dados', fields: { cpf: 'CPF inválido' } }), { status: 400 })))
    await expect(api('/clientes')).rejects.toMatchObject({ status: 400, fields: { cpf: 'CPF inválido' } } satisfies Partial<ApiError>)
  })
  it.each([502, 503, 504])('explica indisponibilidade da API com HTTP %s sem substituir por produtos fictícios', async status => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Bad Gateway', { status })))
    await expect(api('/produtos')).rejects.toMatchObject({ status, message: expect.stringContaining('Verifique se o backend está em execução') })
  })
  it('mantém a conversa do chatbot sem integrar Llama nesta etapa', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('button', { name: 'Ajuda com IA' }))
    expect(screen.getByRole('dialog', { name: 'Assistente de hardware' })).toBeInTheDocument()
    expect(screen.getByText('Me indique uma placa de vídeo.')).toBeInTheDocument()
  })
})
