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
    expect(await screen.findByRole('heading', { name: /componentes para montar/i })).toBeInTheDocument()
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
  it.each([null, [], { fields: null }, { message: 123, fields: { cpf: {} } }])('preserva erro HTTP mesmo com corpo inválido %j', async payload => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(payload), { status: 400 })))
    await expect(api('/clientes')).rejects.toMatchObject({ name: 'ApiError', status: 400, fields: {} })
  })
  it('consulta somente os pedidos e trocas do cliente selecionado na loja', async () => {
    sessionStorage.setItem('techstore.perfil', 'cliente-1')
    renderApp('/pedidos')
    await screen.findByText('Este perfil ainda não possui pedidos.')
    expect(fetch).toHaveBeenCalledWith('/api/pedidos?clienteId=cliente-1', expect.anything())
    expect(fetch).toHaveBeenCalledWith('/api/trocas?clienteId=cliente-1', expect.anything())
    expect(fetch).not.toHaveBeenCalledWith('/api/pedidos', expect.anything())
  })
  it('abre o pedido do histórico administrativo sem exigir perfil de cliente', async () => {
    const pedido = { id: 'pedido-1', numero: 111082, customerId: 'cliente-1', date: '2026-10-17T12:00:00Z',
      total: 114.9, subtotal: 100, frete: 14.9, desconto: 0, status: 'ENTREGUE', items: [], payments: [], couponCodes: [], addressSnapshot: 'Arujá/SP' }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const path = new URL(url, 'http://localhost').pathname
      const payload = path === '/api/pedidos' ? [pedido]
        : path === '/api/clientes/cliente-1' ? { id: 'cliente-1', nome: 'Cliente do histórico', email: 'cliente@techstore.test', ativo: true, ranking: 1 }
          : path.endsWith('/transacoes') ? { pedidos: [pedido], pagamentos: [], trocas: [], cupons: [], atividades: [], notificacoes: [] } : []
      return new Response(JSON.stringify(payload), { status: 200 })
    }))
    renderApp('/admin/clientes?cliente=cliente-1')
    await userEvent.click(await screen.findByRole('link', { name: 'Pedido 111082' }))
    expect(await screen.findByRole('heading', { name: 'Pedido 111082' })).toBeInTheDocument()
    for (const link of screen.getAllByRole('link', { name: 'Pedidos' })) expect(link).toHaveAttribute('href', '/admin/pedidos')
    expect(screen.queryByText('Página não encontrada')).not.toBeInTheDocument()
  })
  it('mantém a conversa do chatbot sem integrar Llama nesta etapa', async () => {
    renderApp()
    await screen.findByRole('heading', { name: /componentes para montar/i })
    await userEvent.click(screen.getByRole('button', { name: 'Ajuda com IA' }))
    expect(screen.getByRole('dialog', { name: 'Assistente de hardware' })).toBeInTheDocument()
    expect(screen.getByText('Me indique uma placa de vídeo.')).toBeInTheDocument()
  })
  it.each([
    ['/produtos/teste', '/produtos', 'Carregando produto...'],
    ['/pedidos/teste', '/pedidos', 'Carregando pedido...'],
  ])('mostra spinner e não 404 enquanto a consulta da rota %s está pendente', async (path, endpoint, message) => {
    if (endpoint === '/pedidos') sessionStorage.setItem('techstore.perfil', 'cliente-1')
    let respond!: (value: Response) => void
    const pending = new Promise<Response>(resolve => { respond = resolve })
    vi.stubGlobal('fetch', vi.fn((url: string) => new URL(url, 'http://localhost').pathname.endsWith(endpoint)
      ? pending : Promise.resolve(new Response('[]', { status: 200 }))))
    renderApp(path)
    expect(screen.getByRole('progressbar', { name: message })).toBeInTheDocument()
    expect(screen.queryByText('Página não encontrada')).not.toBeInTheDocument()
    respond(new Response('[]', { status: 200 }))
    expect(await screen.findByText('Página não encontrada')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar', { name: message })).not.toBeInTheDocument()
  })
  it.each(['/produtos/teste', '/pedidos/teste'])('trata falha de API da rota %s como erro, não como 404', async path => {
    if (path.startsWith('/pedidos/')) sessionStorage.setItem('techstore.perfil', 'cliente-1')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Bad Gateway', { status: 503 })))
    renderApp(path)
    expect(await screen.findByRole('alert')).toHaveTextContent('Verifique se o backend está em execução')
    expect(screen.queryByText('Página não encontrada')).not.toBeInTheDocument()
  })
})
