import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDemoStore } from '../context/DemoContext'
import { CartPage, ExchangesPage, OrderDetailPage, ProductDetailPage } from './StorePages'

vi.mock('../context/DemoContext', () => ({ useDemoStore: vi.fn() }))
afterEach(cleanup)
const useStore = vi.mocked(useDemoStore)
type Store = ReturnType<typeof useDemoStore>
const order: Store['orders'][number] = {
  id: 'pedido-1', numero: 111082, customerId: 'cliente-1', status: 'ENTREGUE',
  items: [{ productId: 'gpu-1', name: 'RTX 5060', quantity: 2 }],
  date: '17/10/2026', createdAt: '2026-10-17T12:00:00Z', subtotal: 100, total: 114.9, frete: 14.9,
  desconto: 0, creditValue: 0, productSummary: 'RTX 5060', addressSnapshot: 'Arujá/SP',
}
const product: Store['products'][number] = {
  id: 'gpu-1', name: 'RTX 5060', nome: 'RTX 5060', brand: 'NVIDIA', marca: 'NVIDIA',
  category: 'Placas de vídeo', categorias: [], specs: [], stock: 5, quantidade: 5, reservado: 0,
  price: 100, preco: 100, cost: 50, custo: 50, description: 'Placa de vídeo', descricao: 'Placa de vídeo',
  imagePath: '', imagem: '', color: '#262626', ativo: true, grupoPrecificacaoId: 'grupo-1',
}
function store(values: Partial<Store> = {}) {
  useStore.mockReturnValue({ activeCustomerId: 'cliente-1', orders: [], exchanges: [], products: [], productStatuses: {}, createExchange: vi.fn(), notify: vi.fn(), ...values } as Store)
}

describe('Seleções da loja após carregar dados reais', () => {
  it('seleciona o primeiro item quando o pedido da URL termina de carregar', async () => {
    store()
    const view = render(<MemoryRouter initialEntries={['/trocas?pedido=pedido-1']}><ExchangesPage /></MemoryRouter>)
    store({ orders: [order] as Store['orders'] })
    view.rerender(<MemoryRouter initialEntries={['/trocas?pedido=pedido-1']}><ExchangesPage /></MemoryRouter>)
    expect(screen.getByRole('combobox', { name: 'Item' })).toHaveValue('gpu-1')
    expect(screen.getByRole('option', { name: 'RTX 5060' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Solicitar troca' })).toBeEnabled()
  })

  it('desconta quantidades já solicitadas e impede uma nova troca acima do saldo', () => {
    store({ orders: [order] as Store['orders'], exchanges: [{ id: 'troca-1', orderId: 'pedido-1', productId: 'gpu-1', customerId: 'cliente-1', quantity: 2, status: 'TROCA ACEITA' }] as Store['exchanges'] })
    render(<MemoryRouter initialEntries={['/trocas?pedido=pedido-1']}><ExchangesPage /></MemoryRouter>)
    expect(screen.getByRole('button', { name: 'Solicitar troca' })).toBeDisabled()
  })

  it('ajusta a seleção de quantidade dos detalhes quando o estoque diminui', async () => {
    // O componente é testado com a mesma rota e uma atualização do catálogo.
    store({ products: [product] as Store['products'] })
    const content = <MemoryRouter initialEntries={['/produtos/gpu-1']}><Routes><Route path="/produtos/:productId" element={<ProductDetailPage />} /></Routes></MemoryRouter>
    const view = render(content)
    await userEvent.selectOptions(screen.getByRole('combobox'), '5')
    store({ products: [{ ...product, stock: 2 }] as Store['products'] })
    view.rerender(<MemoryRouter initialEntries={['/produtos/gpu-1']}><Routes><Route path="/produtos/:productId" element={<ProductDetailPage />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('combobox')).toHaveValue('2')
  })

  it('desabilita a finalização imediatamente após expirar a reserva, antes de nova consulta', () => {
    store({ products: [product], cart: [{ productId: product.id, quantity: 1 }],
      cartSummary: { items: [{ productId: product.id, quantity: 1 }], expiresAt: new Date(Date.now() - 1000).toISOString(), removed: [], warnings: [] } })
    render(<MemoryRouter><CartPage /></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'Finalizar compra' })
    expect(link).toHaveAttribute('aria-disabled', 'true')
    expect(link).toHaveAttribute('href', '/carrinho')
  })

  it.each(['CANCELADO', 'REPROVADA'] as const)('não anuncia crédito disponível de um pedido %s', status => {
    store({ orders: [{ ...order, status, date: '2026-10-17', subtotal: 100, total: 114.9, frete: 14.9,
      desconto: 114.9, creditValue: 35.1, creditCouponCode: 'SALDO-TESTE', payments: [], items: [] }] as Store['orders'], cards: [] })
    render(<MemoryRouter initialEntries={['/pedidos/pedido-1']}><Routes><Route path="/pedidos/:orderId" element={<OrderDetailPage />} /></Routes></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Pedido 111082' })).toBeInTheDocument()
    expect(screen.queryByText(/Crédito de/)).not.toBeInTheDocument()
  })
})
