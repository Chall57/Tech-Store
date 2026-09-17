import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert } from '@mui/material'
import { produtoService, type Produto } from '../services/produtoService'
import { errorMessage } from '../services/api'
import { Link } from 'react-router-dom'
import { MockEditor, type EditorField } from '../components/MockEditor'
import { SalesChart } from '../components/SalesChart'
import { StockEntries } from '../components/StockEntries'
import { nextExchangeStatus, useDemoStore, type DemoCustomer, type DemoExchange, type DemoOrder, type ExchangeStatus, type OrderStatus } from '../context/DemoContext'
import { adminTables } from '../data/catalogMetadata'

type AdminModule = keyof typeof adminTables
type AdminRow = { id: string; cells: readonly string[] }

function orderRow(order: DemoOrder, customers: DemoCustomer[]): AdminRow {
  return { id: order.id, cells: [`Pedido ${order.numero}`, customers.find(c => c.id === order.customerId)?.nome ?? order.customerId,
    order.date, String(order.items.length), order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), order.status] }
}

function statusClass(status: string) {
  if (['Ativo', 'Regular', 'ENTREGUE', 'APROVADA', 'PAGAMENTO REALIZADO', 'TROCA PROCESSADA'].includes(status)) return 'status--success'
  if (['Inativo', 'Sem estoque', 'CANCELADO', 'REPROVADA', 'TROCA NEGADA', 'Estoque baixo'].includes(status)) return 'status--warning'
  return 'status--info'
}

export function AdminDashboardPage() {
  const { orders, exchanges, products, customers } = useDemoStore()
  const approvedTotal = orders.filter((order) => ['APROVADA', 'PAGAMENTO REALIZADO', 'EM TRANSPORTE', 'EM TRÂNSITO', 'ENTREGUE'].includes(order.status)).reduce((sum, order) => sum + order.total - order.desconto, 0)
  return <><div className="admin-page-heading"><div><span className="eyebrow">VISÃO GERAL</span><h1>Painel administrativo</h1><p>Gestão da operação e do catálogo da Tech Store.</p></div><div className="date-filter">Período: <strong>Todos os registros</strong>⌄</div></div><section className="kpi-grid"><article><span className="kpi-icon kpi-icon--blue">↗</span><small>Receita aprovada</small><strong>{approvedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong><em>Pedidos pagos, em trânsito e entregues</em></article><article><span className="kpi-icon kpi-icon--green">◫</span><small>Pedidos registrados</small><strong>{orders.length}</strong><em>Fluxo alterável em tempo real</em></article><article><span className="kpi-icon kpi-icon--orange">↺</span><small>Trocas em aberto</small><strong>{exchanges.filter((exchange) => !['TROCA NEGADA', 'TROCA PROCESSADA'].includes(exchange.status)).length}</strong><em className="warning-text">Exigem acompanhamento</em></article><article><span className="kpi-icon kpi-icon--red">!</span><small>Produtos com estoque baixo</small><strong>{products.filter(p => p.stock < 8).length}</strong><em className="warning-text">Necessitam atenção</em></article></section><section className="dashboard-grid"><article className="admin-panel chart-panel"><div className="panel-heading"><div><h2>Vendas por categoria</h2><p>Pedidos com pagamento realizado, em trânsito ou entregues</p></div></div><SalesChart /></article><article className="admin-panel activity-panel"><div className="panel-heading"><div><h2>Fluxos disponíveis</h2><p>Ações disponíveis na gestão</p></div></div><ul><li><span className="activity-icon">1</span><p><strong>Pedidos</strong><small>Quatro transições administrativas</small></p></li><li><span className="activity-icon">2</span><p><strong>Trocas</strong><small>Aceite, negativa, recebimento e processamento</small></p></li><li><span className="activity-icon">3</span><p><strong>Clientes</strong><small>Cadastro, consulta, alteração e inativação</small></p></li></ul></article></section><section className="admin-panel quick-table"><div className="panel-heading"><div><h2>Pedidos recentes</h2><p>Fluxo completo dos status exigidos</p></div><Link className="button button--outline" to="/admin/pedidos">Ver todos</Link></div><AdminTable columns={adminTables.orders.columns} rows={orders.slice(0, 5).map(order => orderRow(order, customers))} /></section></>
}

function AdminTable({ columns, rows, actionLabels = [], actionLabelsForRow, onAction, actionsDisabled = false }: { columns: readonly string[]; rows: readonly AdminRow[]; actionLabels?: string[]; actionLabelsForRow?: (row: readonly string[]) => string[]; onAction?: (action: string, id: string) => void; actionsDisabled?: boolean }) {
  const showActions = actionLabels.length > 0 || Boolean(actionLabelsForRow)
  return <table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}{showActions && <th>Ações</th>}</tr></thead><tbody>{rows.map((row) => { const rowActions = actionLabelsForRow?.(row.cells) ?? actionLabels; return <tr key={row.id} data-record-id={row.id}>{row.cells.map((cell, index) => <td key={`${row.id}-${index}`}>{index === row.cells.length - 1 ? <span className={`status ${statusClass(cell)}`}>{cell}</span> : index === 0 ? <strong>{cell}</strong> : cell}</td>)}{showActions && <td><div className="row-actions">{rowActions.map((action) => <button key={action} disabled={actionsDisabled} onClick={() => onAction?.(action, row.id)}>{action}</button>)}</div></td>}</tr> })}</tbody></table>
}

function exchangeAdminAction(exchange: DemoExchange) {
  if (exchange.status === 'TROCA SOLICITADA') return 'Aceitar ou negar'
  if (exchange.status === 'ITEM ENVIADO') return 'Confirmar recebimento'
  if (exchange.status === 'ITEM RECEBIDO') return 'Processar troca'
  return null
}

function exchangeWaitingLabel(exchange: DemoExchange) {
  if (exchange.status === 'TROCA ACEITA') return 'Aguardando despacho do cliente'
  if (exchange.status === 'TROCA NEGADA') return 'Troca negada'
  if (exchange.status === 'TROCA PROCESSADA') return 'Fluxo concluído'
  return 'Aguardando próxima etapa'
}

function AdminExchangeStatusTable({ exchanges, customers, updateExchangeStatus }: { exchanges: DemoExchange[]; customers: DemoCustomer[]; updateExchangeStatus: (id: string, status: ExchangeStatus, reentrada?: boolean, observacoes?: string) => Promise<unknown> }) {
  const [selectedExchange, setSelectedExchange] = useState<DemoExchange | null>(null)
  const nextOptions = selectedExchange?.status === 'TROCA SOLICITADA'
    ? ['TROCA ACEITA', 'TROCA NEGADA']
    : selectedExchange && nextExchangeStatus[selectedExchange.status]
      ? [nextExchangeStatus[selectedExchange.status]!]
      : []
  const fields: EditorField[] = selectedExchange ? [
    { name: 'exchange', label: 'Solicitação', value: selectedExchange.id, readOnly: true },
    { name: 'order', label: 'Pedido original', value: `Pedido ${selectedExchange.orderNumber}`, readOnly: true },
    { name: 'customer', label: 'Cliente', value: customers.find((customer) => customer.id === selectedExchange.customerId)?.name ?? selectedExchange.customerId, readOnly: true },
    { name: 'currentStatus', label: 'Status atual', value: selectedExchange.status, readOnly: true },
    { name: 'nextStatus', label: selectedExchange.status === 'TROCA SOLICITADA' ? 'Decisão' : 'Próximo status permitido', value: nextOptions[0], type: 'select', options: nextOptions },
    ...(selectedExchange.status === 'ITEM ENVIADO' ? [{ name: 'reentrada', label: 'Retornar item ao estoque?', value: '', type: 'select' as const, options: ['', 'Sim', 'Não'], required: true }] : []),
    { name: 'notes', label: 'Observações', value: '', type: 'textarea' },
  ] : []

  return <><table><thead><tr><th>Solicitação</th><th>Pedido</th><th>Cliente</th><th>Produto</th><th>Status</th><th>Próxima ação</th></tr></thead><tbody>{exchanges.map((exchange) => { const action = exchangeAdminAction(exchange); return <tr key={exchange.id}><td><strong>{exchange.id}</strong></td><td>Pedido {exchange.orderNumber}</td><td>{customers.find((customer) => customer.id === exchange.customerId)?.name ?? exchange.customerId}</td><td>{exchange.productName}</td><td><span className={`status ${statusClass(exchange.status)}`}>{exchange.status}</span></td><td>{action ? <button className="table-action" disabled={selectedExchange !== null} onClick={() => setSelectedExchange(exchange)}>{action}</button> : <span>{exchangeWaitingLabel(exchange)}</span>}</td></tr> })}</tbody></table>{selectedExchange && <MockEditor key={selectedExchange.id + selectedExchange.status} title={`${exchangeAdminAction(selectedExchange)}: ${selectedExchange.id}`} description="A alteração será refletida imediatamente para o administrador e para o cliente." fields={fields} submitLabel="Aplicar transição" onSave={async (values) => { await updateExchangeStatus(selectedExchange.id, values.nextStatus as ExchangeStatus, selectedExchange.status === 'ITEM ENVIADO' ? values.reentrada === 'Sim' : undefined, values.notes); setSelectedExchange(current => current === selectedExchange ? null : current) }} onClose={() => setSelectedExchange(current => current === selectedExchange ? null : current)} />}</>
}

function ProductEditor({ product, onClose }: { product?: Produto; onClose: () => void }) {
  const { mutate } = useDemoStore()
  const domains = useQuery({ queryKey: ['dominios-catalogo'], queryFn: produtoService.dominios })
  if (!domains.data) return domains.error ? <Alert severity="error">{errorMessage(domains.error)}</Alert> : <p>Carregando domínios…</p>
  const { categorias, grupos } = domains.data
  const fields: EditorField[] = [
    { name: 'nome', label: 'Produto', value: product?.nome ?? '', required: true },
    { name: 'marca', label: 'Marca', value: product?.marca ?? '', required: true },
    { name: 'descricao', label: 'Descrição', value: product?.descricao ?? '', type: 'textarea', required: true },
    { name: 'imagem', label: 'Caminho da imagem', value: product?.imagem ?? '' },
    { name: 'preco', label: 'Preço de venda', value: String(product?.preco ?? ''), type: 'number', required: true },
    { name: 'custo', label: 'Custo', value: String(product?.custo ?? ''), type: 'number', required: true },
    { name: 'quantidade', label: 'Quantidade em estoque', value: String(product?.quantidade ?? 0), type: 'number', required: true },
    { name: 'grupo', label: 'Grupo de precificação', value: grupos.find(g => g.id === product?.grupoPrecificacaoId)?.nome ?? '', type: 'select', options: ['', ...grupos.map(g => g.nome)], required: true },
    { name: 'ativo', label: 'Produto ativo', type: 'checkbox', value: String(product?.ativo ?? true) },
    { name: 'justificativa', label: 'Justificativa da ativação/inativação', value: '', type: 'textarea' },
    { name: 'categoriaStatus', label: 'Categoria da ativação/inativação', value: '' },
    ...categorias.map(c => ({ name: 'categoria-' + c.id, label: c.nome, type: 'checkbox' as const, value: String(product?.categorias.some(item => item.id === c.id) ?? false) })),
  ]
  return <MockEditor title={product ? 'Editar produto' : 'Cadastrar produto'} description="Selecione ao menos uma categoria. Sem estoque é calculado pela quantidade disponível." fields={fields} onClose={onClose} onSave={async v => {
    const categoryIds = categorias.filter(c => v['categoria-' + c.id] === 'true').map(c => c.id)
    if (!categoryIds.length) throw new Error('Selecione ao menos uma categoria.')
    const grupo = grupos.find(g => g.nome === v.grupo)
    if (!grupo) throw new Error('Selecione o grupo de precificação.')
    await mutate(() => produtoService.salvar({ nome: v.nome, marca: v.marca, descricao: v.descricao, imagem: v.imagem,
      preco: Number(v.preco), custo: Number(v.custo), quantidade: Number(v.quantidade),
      ativo: v.ativo === 'true', grupoPrecificacaoId: grupo.id, categorias: categoryIds, justificativaStatus: v.justificativa, categoriaStatus: v.categoriaStatus }, product?.id), 'Produto salvo com sucesso.')
    onClose()
  }} />
}
export function AdminModulePage({ module }: { module: AdminModule }) {
  const { products, orders, customers, updateOrderStatus } = useDemoStore()
  const [editor, setEditor] = useState<Produto | 'new' | null>(null)
  const [orderEditor, setOrderEditor] = useState<DemoOrder | null>(null)
  const [query, setQuery] = useState('')
  const content = adminTables[module]
  const rows = module === 'orders' ? orders.map(o => orderRow(o, customers))
    : module === 'inventory' ? products.map(p => ({ id: p.id, cells: [p.id, p.name, String(p.stock), String(p.reservado), p.cost.toFixed(2), p.stock < 8 ? 'Estoque baixo' : 'Regular'] }))
    : products.map(p => ({ id: p.id, cells: [p.id, p.name, p.category, p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), String(p.stock), !p.ativo ? 'Inativo' : p.stock === 0 ? 'Sem estoque' : 'Ativo'] }))
  const visible = rows.filter(row => row.cells.join(' ').toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))
  return <><div className="admin-page-heading"><div><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.description}</p></div>
    {module === 'products' && <button className="button" disabled={editor !== null} onClick={() => setEditor('new')}>＋ Cadastrar produto</button>}</div>
    <section className="admin-panel module-panel"><div className="table-toolbar"><label className="table-search"><input value={query} onChange={e => setQuery(e.target.value)} placeholder={'Buscar em ' + content.title.toLowerCase()} /></label></div>
    <AdminTable columns={content.columns} rows={visible} actionLabels={module === 'orders' ? ['Alterar status'] : ['Editar']} actionsDisabled={Boolean(editor || orderEditor)} onAction={(_action, id) => module === 'orders' ? setOrderEditor(orders.find(o => o.id === id) ?? null) : setEditor(products.find(p => p.id === id) ?? null)} />
    {!visible.length && <p>Nenhum registro encontrado.</p>}</section>
    {orderEditor && <MockEditor key={orderEditor.id + orderEditor.status} title="Alterar status do pedido" description="A atualização será persistida e refletida na conta do cliente. O pagamento utiliza o processador local de testes." fields={[
      { name: 'pedido', label: 'Pedido', value: `Pedido ${orderEditor.numero}`, readOnly: true },
      { name: 'atual', label: 'Status atual', value: orderEditor.status, readOnly: true },
      { name: 'status', label: 'Novo status', value: orderOptions(orderEditor)[0], type: 'select', options: orderOptions(orderEditor) },
    ]} onClose={() => setOrderEditor(current => current === orderEditor ? null : current)} onSave={async v => { await updateOrderStatus(orderEditor.id, v.status as OrderStatus); setOrderEditor(current => current === orderEditor ? null : current) }} />}
    {editor && <ProductEditor key={editor === 'new' ? 'new' : editor.id} product={editor === 'new' ? undefined : editor} onClose={() => setEditor(current => current === editor ? null : current)} />}
    {module === 'inventory' && <StockEntries />}
  </>
}

function orderOptions(order: DemoOrder): OrderStatus[] {
  const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    'EM ABERTO': ['EM PROCESSAMENTO', 'CANCELADO'],
    'EM PROCESSAMENTO': ['APROVADA', 'PAGAMENTO REALIZADO', 'CANCELADO', 'REPROVADA'],
    'APROVADA': ['EM TRANSPORTE', 'EM TRÂNSITO'], 'PAGAMENTO REALIZADO': ['EM TRANSPORTE', 'EM TRÂNSITO'],
    'EM TRANSPORTE': ['ENTREGUE'], 'EM TRÂNSITO': ['ENTREGUE'],
  }
  return transitions[order.status] ?? [order.status]
}

export function AdminExchangesPage() {
  const { exchanges, customers, updateExchangeStatus } = useDemoStore()
  return <><div className="admin-page-heading"><div><span className="eyebrow">PÓS-VENDA</span><h1>Gestão de trocas</h1><p>Autorize trocas, registre o recebimento e escolha a reentrada no estoque. O crédito é gerado ao receber o item.</p></div></div><section className="exchange-flow exchange-flow--six"><div className="active"><b>1</b><span><strong>TROCA SOLICITADA</strong><small>Análise administrativa</small></span></div><i>→</i><div><b>2</b><span><strong>TROCA ACEITA/NEGADA</strong><small>Decisão registrada</small></span></div><i>→</i><div><b>3</b><span><strong>ITEM ENVIADO</strong><small>Despacho do cliente</small></span></div><i>→</i><div><b>4</b><span><strong>ITEM RECEBIDO</strong><small>Confirmação administrativa</small></span></div><i>→</i><div><b>5</b><span><strong>TROCA PROCESSADA</strong><small>Fluxo concluído</small></span></div></section><section className="admin-panel module-panel"><AdminExchangeStatusTable exchanges={exchanges} customers={customers} updateExchangeStatus={updateExchangeStatus} /></section></>
}

export function AdminAnalyticsPage() {
  return <><div className="admin-page-heading"><div><span className="eyebrow">ANÁLISE DE VENDAS</span><h1>Evolução das vendas</h1><p>Valores provenientes dos pedidos persistidos com pagamento aprovado.</p></div></div><section className="admin-panel analytics-chart"><SalesChart /></section></>
}
