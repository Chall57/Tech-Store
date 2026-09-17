/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { clienteService, enderecoService, cartaoService, type PerfilCliente, type ClienteInput, type Endereco, type EnderecoInput, type Cartao, type CartaoInput } from '../services/clienteService'
import { produtoService } from '../services/produtoService'
import { vendaService } from '../services/vendaService'
import { errorMessage } from '../services/api'
export type { OrderStatus, ExchangeStatus, CartItem, Pedido as DemoOrder, Troca as DemoExchange } from '../services/vendaService'
import type { OrderStatus, ExchangeStatus, CheckoutInput, TrocaInput } from '../services/vendaService'
export type ProductStatus = 'Ativo' | 'Inativo' | 'Sem estoque'
export type DemoCustomer = PerfilCliente & { name: string; status: 'Ativo' | 'Inativo' }
export type DemoAddress = Endereco & { customerId: string; label: string; line: string; type: string; preferred: boolean }
export type DemoCard = Cartao & { customerId: string; brand: string; lastDigits: string; holder: string; expiry: string; preferred: boolean }
type Notification = { id: number; message: string; tone: 'success' | 'info' | 'warning' }

// Mantém os imports existentes; todos os registros agora vêm da API.
function useStoreData() {
  const queryClient = useQueryClient()
  const [activeCustomerId, setActiveCustomerId] = useState(() => {
    const id = sessionStorage.getItem('techstore.perfil') ?? ''
    return id === 'ADMIN' ? '' : id
  })
  const [notification, setNotification] = useState<Notification | null>(null)
  useEffect(() => {
    if (!notification) return
    const timer = window.setTimeout(() => setNotification(null), notification.tone === 'warning' ? 7000 : 4500)
    return () => window.clearTimeout(timer)
  }, [notification])
  const customersQuery = useQuery({ queryKey: ['perfis'], queryFn: clienteService.perfis })
  const productsQuery = useQuery({ queryKey: ['produtos'], queryFn: produtoService.listar, refetchInterval: 30000 })
  const ordersQuery = useQuery({ queryKey: ['pedidos'], queryFn: vendaService.pedidos })
  const exchangesQuery = useQuery({ queryKey: ['trocas'], queryFn: vendaService.trocas })
  const addressesQuery = useQuery({ queryKey: ['enderecos', activeCustomerId], queryFn: () => enderecoService.listar(activeCustomerId), enabled: !!activeCustomerId })
  const cardsQuery = useQuery({ queryKey: ['cartoes', activeCustomerId], queryFn: () => cartaoService.listar(activeCustomerId), enabled: !!activeCustomerId })
  const couponsQuery = useQuery({ queryKey: ['cupons', activeCustomerId], queryFn: () => vendaService.cupons(activeCustomerId), enabled: !!activeCustomerId })
  const cartQuery = useQuery({ queryKey: ['carrinho', activeCustomerId], queryFn: () => vendaService.resumoCarrinho(activeCustomerId), enabled: !!activeCustomerId, refetchInterval: 15000 })
  const queries = [customersQuery, productsQuery, ordersQuery, exchangesQuery, addressesQuery, cardsQuery, couponsQuery, cartQuery]
  const notify = (message: string, tone: Notification['tone'] = 'success') => setNotification({ id: Date.now(), message, tone })
  async function mutate<T>(operation: () => Promise<T>, message: string): Promise<T> {
    try {
      const result = await operation()
      await queryClient.invalidateQueries()
      notify(message)
      return result
    } catch (error) { notify(errorMessage(error), 'warning'); throw error }
  }
  const selectCustomer = (id: string) => {
    sessionStorage.setItem('techstore.perfil', id)
    setActiveCustomerId(id === 'ADMIN' ? '' : id)
    setNotification(null)
  }
  const customers: DemoCustomer[] = (customersQuery.data ?? []).map(c => ({
    ...c, name: c.nome, status: c.ativo ? 'Ativo' : 'Inativo',
  }))
  const products = (productsQuery.data ?? []).map(p => ({
    ...p, name: p.nome, brand: p.marca, category: p.categorias.map(c => c.nome).join(', '), price: p.preco,
    cost: p.custo, stock: p.quantidade - p.reservado, description: p.descricao, imagePath: p.imagem ?? '',
    specs: p.categorias.map(c => c.nome), color: '#262626',
  }))
  const addresses: DemoAddress[] = (addressesQuery.data ?? []).map(e => ({
    ...e, customerId: e.clienteId, label: e.nome,
    line: e.tipoLogradouro + ' ' + e.logradouro + ', ' + e.numero + ' · ' + e.bairro + ' · ' + e.cidade + '/' + e.estado + ' · ' + e.cep,
    type: [e.residencial && 'Residencial', e.entrega && 'Entrega', e.cobranca && 'Cobrança'].filter(Boolean).join(', '), preferred: e.residencial,
  }))
  const cards: DemoCard[] = (cardsQuery.data ?? []).map(c => ({
    ...c, customerId: c.clienteId, brand: c.bandeira, lastDigits: c.ultimosDigitos, holder: c.titular, expiry: c.validade, preferred: c.preferencial,
  }))
  const cart = cartQuery.data?.items ?? []
  const changeCart = (productId: string, quantity: number) => {
    if (!activeCustomerId) { notify('Selecione um perfil de cliente antes de adicionar produtos.', 'warning'); return }
    void mutate(() => vendaService.quantidade(activeCustomerId, productId, quantity), 'Carrinho atualizado.').catch(() => undefined)
  }
  return {
    activeCustomerId, customers, addresses, cards, products, cart, cartSummary: cartQuery.data,
    orders: (ordersQuery.data ?? []).map(o => ({ ...o, createdAt: o.date, date: new Date(o.date).toLocaleDateString('pt-BR') })),
    exchanges: exchangesQuery.data ?? [], coupons: couponsQuery.data ?? [],
    productStatuses: Object.fromEntries(products.map(p => [p.id, !p.ativo ? 'Inativo' : p.stock > 0 ? 'Ativo' : 'Sem estoque'])) as Record<string, ProductStatus>,
    loading: queries.some(q => q.isLoading), error: queries.find(q => q.error)?.error,
    reload: () => queryClient.invalidateQueries(), mutate, notification, notify, selectCustomer,
    clearNotification: () => setNotification(null),
    addCustomer: (data: ClienteInput) => mutate(() => clienteService.cadastrar(data), 'Cliente cadastrado com sucesso.'),
    updateCustomer: (id: string, data: ClienteInput) => mutate(() => clienteService.alterar(id, data), 'Dados do cliente alterados com sucesso.'),
    setCustomerStatus: (id: string, ativo: boolean) => mutate(() => clienteService.status(id, ativo), ativo ? 'Cliente reativado com sucesso.' : 'Cliente inativado com sucesso.'),
    saveAddress: (data: EnderecoInput, id?: string) => mutate(() => enderecoService.salvar(activeCustomerId, data, id), 'Endereço salvo com sucesso.'),
    removeAddress: (id: string) => mutate(() => enderecoService.excluir(activeCustomerId, id), 'Endereço excluído.'),
    saveCard: (data: CartaoInput, id?: string) => mutate(() => cartaoService.salvar(activeCustomerId, data, id), 'Cartão salvo com sucesso.'),
    removeCard: (id: string) => mutate(() => cartaoService.excluir(activeCustomerId, id), 'Cartão excluído.'),
    setPreferredCard: (id: string) => mutate(() => cartaoService.preferencial(activeCustomerId, id), 'Cartão preferencial alterado.'),
    addToCart: (id: string, quantity = 1) => {
      if (!activeCustomerId) { notify('Selecione um perfil de cliente antes de adicionar produtos.', 'warning'); return }
      void mutate(() => vendaService.adicionar(activeCustomerId, id, quantity), 'Produto adicionado ao carrinho.').catch(() => undefined)
    },
    updateCartQuantity: changeCart, removeFromCart: (id: string) => changeCart(id, 0),
    createOrder: async (data: CheckoutInput) => {
      const registrado = await vendaService.finalizar(activeCustomerId, data)
      let resultado = registrado
      let falha = ''
      try { resultado = await vendaService.processarPagamento(registrado.id) }
      catch (error) { falha = errorMessage(error) }
      await queryClient.invalidateQueries({ predicate: q => q.queryKey[0] !== 'checkout' })
      notify(falha ? `Pedido registrado. Pagamento aguardando processamento: ${falha}`
        : resultado.status === 'REPROVADA' ? 'Pagamento recusado no ambiente local. Estoque e cupons liberados.'
          : 'Compra realizada com sucesso.', falha || resultado.status === 'REPROVADA' ? 'warning' : 'success')
      return resultado
    },
    updateOrderStatus: (id: string, status: OrderStatus) => mutate(() => vendaService.statusPedido(id, status), 'Status do pedido alterado.'),
    customerOrderStatus: (id: string, status: OrderStatus) => mutate(() => vendaService.statusCliente(activeCustomerId, id, status), 'Pedido atualizado.'),
    processOrderPayment: (id: string) => mutate(() => vendaService.processarPagamento(id), 'Pagamento processado no ambiente local.'),
    createExchange: (data: TrocaInput) => mutate(() => vendaService.solicitarTroca(activeCustomerId, data), 'Troca solicitada com sucesso.'),
    updateExchangeStatus: (id: string, status: ExchangeStatus, reentrada?: boolean, observacoes?: string) => mutate(() => vendaService.statusTroca(id, status, reentrada, observacoes), 'Troca atualizada.'),
    dispatchExchange: (id: string, carrier: string, tracking: string, date: string) => mutate(() => vendaService.despacharTroca(activeCustomerId, id, carrier, tracking, date), 'Despacho registrado.'),
  }
}
const DemoContext = createContext<ReturnType<typeof useStoreData> | null>(null)
export function DemoProvider({ children }: { children: ReactNode }) {
  const value = useStoreData()
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
export function useDemoStore() {
  const value = useContext(DemoContext)
  if (!value) throw new Error('useDemoStore deve ser utilizado dentro de DemoProvider')
  return value
}
export const nextExchangeStatus: Partial<Record<ExchangeStatus, ExchangeStatus>> = { 'ITEM ENVIADO': 'ITEM RECEBIDO', 'ITEM RECEBIDO': 'TROCA PROCESSADA' }
