import { useState, type FormEvent } from 'react'
import { Alert } from '@mui/material'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { MockEditor, type EditorField } from '../components/MockEditor'
import { useDemoStore, type DemoExchange, type DemoOrder } from '../context/DemoContext'
import { ProductImage } from '../components/ProductImage'
import { localDate } from '../utils/localDate'
import { ReservationNotice } from '../components/ReservationNotice'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })



function statusTone(status: string) {
  if (['ENTREGUE', 'TROCA PROCESSADA', 'PAGAMENTO REALIZADO', 'APROVADA'].includes(status)) return 'success'
  if (['CANCELADO', 'TROCA NEGADA', 'REPROVADA'].includes(status)) return 'warning'
  return 'info'
}


export function CatalogPage() {
  const { products, addToCart, productStatuses } = useDemoStore()
  const [params] = useSearchParams()
  const query = (params.get('busca') ?? '').trim().toLocaleLowerCase('pt-BR')
  const visibleProducts = products.filter((product) => `${product.name} ${product.brand} ${product.category}`.toLocaleLowerCase('pt-BR').includes(query))
  return <>
    <section className="catalog-hero"><div className="page-width catalog-hero__inner"><div><span className="hero-label">TECH STORE · HARDWARE</span><h1>Componentes para montar<br />e atualizar seu computador.</h1><p>Consulte produtos, estoque e preços do catálogo.</p><a href="#catalogo" className="button button--light">Ver produtos</a></div><div className="hero-hardware" aria-hidden="true"><span>GPU</span><span>CPU</span><span>RAM</span></div></div></section>
    <section className="benefits page-width" aria-hidden="true" />
    <section className="catalog-section" id="catalogo"><div className="page-width"><div className="section-heading"><div><span className="eyebrow">CATÁLOGO TECH STORE</span><h2>{query ? `Resultado para “${params.get('busca')}”` : 'Produtos disponíveis'}</h2></div><span>{visibleProducts.length} produtos</span></div><div className="book-grid">{visibleProducts.map((product) => { const status = productStatuses[product.id] ?? (product.stock > 0 ? 'Ativo' : 'Sem estoque'); const available = product.stock > 0 && status === 'Ativo'; const availabilityLabel = status === 'Inativo' ? 'Inativo' : product.stock === 0 ? 'Sem estoque' : status; return <article className="book-card" key={product.id}><div className={`product-card__badge ${available ? '' : 'product-card__badge--out'}`}>{available ? 'Disponível' : availabilityLabel}</div><Link className="product-card__image" to={`/produtos/${product.id}`}><ProductImage product={product} /></Link><div className="book-card__body"><span>{product.category}</span><small className="product-card__sku">Código {product.id.slice(0, 8)}</small><Link to={`/produtos/${product.id}`}><h3>{product.name}</h3></Link><p>{product.brand}</p><div className="product-card__purchase"><strong>{currency.format(product.price)}</strong><button type="button" disabled={!available} onClick={() => addToCart(product.id)} aria-label={`Adicionar ${product.name} ao carrinho`}>{available ? 'Adicionar' : 'Indisponível'}</button></div><small className={available ? 'stock-ok' : 'stock-out'}>{available ? `${product.stock} unidade${product.stock === 1 ? '' : 's'} em estoque` : 'Produto indisponível'}</small></div></article> })}</div>{visibleProducts.length === 0 && <div className="empty-state"><strong>Nenhum produto encontrado.</strong><p>Tente outro nome, marca ou categoria.</p><Link className="button" to="/">Limpar busca</Link></div>}</div></section>
  </>
}

export function ProductDetailPage() {
  const { productId } = useParams()
  const { products, addToCart, productStatuses } = useDemoStore()
  const product = products.find((item) => item.id === productId)
  const [quantity, setQuantity] = useState(1)
  if (!product) return <NotFoundPage />
  const status = productStatuses[product.id] ?? (product.stock > 0 ? 'Ativo' : 'Sem estoque')
  const available = product.stock > 0 && status === 'Ativo'
  const availabilityLabel = status === 'Inativo' ? 'Inativo' : product.stock === 0 ? 'Sem estoque' : status
  return <section className="page-width detail-page"><div className="breadcrumbs"><Link to="/">Início</Link><span>/</span>{product.category}<span>/</span>{product.name}</div><div className="detail-grid"><div className="detail-cover"><ProductImage product={product} large /></div><div className="detail-info"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p className="detail-author">Marca: <strong>{product.brand}</strong></p><p className="synopsis">{product.description}</p><dl className="book-metadata">{product.specs.map((spec, index) => <div key={spec}><dt>Especificação {index + 1}</dt><dd>{spec}</dd></div>)}</dl><div className="purchase-box"><div><small>Preço</small><strong>{currency.format(product.price)}</strong><span>{available ? `Em estoque · ${product.stock} unidades` : `Produto indisponível · ${availabilityLabel}`}</span></div><label>Quantidade<select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} disabled={!available}>{Array.from({ length: Math.min(product.stock, 5) }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select></label><button className="button" disabled={!available} onClick={() => addToCart(product.id, quantity)}>Adicionar ao carrinho</button></div><p className="rule-note">O carrinho é salvo por cliente. Disponibilidade sujeita à confirmação ao concluir a compra.</p></div></div></section>
}

export function CartPage() {
  const { products, cart, cartSummary, updateCartQuantity, removeFromCart } = useDemoStore()
  const cartItems = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId)! })).filter((item) => item.product)
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  return <section className="page-width standard-page"><div className="page-title"><span className="eyebrow">SUA COMPRA</span><h1>Carrinho</h1><p>Adicione produtos pelo catálogo e altere as quantidades em tempo real.</p></div><ReservationNotice expiresAt={cartSummary?.expiresAt} />{cartSummary?.removed.map(item => <Alert severity="warning" key={item.productId}>{item.name}: {item.reason}</Alert>)}{cartSummary?.warnings.map(message => <Alert severity="warning" key={message}>{message}</Alert>)}{cartItems.length > 0 && <div className="cart-alert"><strong>Carrinho salvo</strong><span>As quantidades e o subtotal são recalculados imediatamente.</span></div>}<div className="cart-layout"><div className="panel cart-items">{cartItems.map((item) => <div className="cart-line" key={item.product.id}><ProductImage product={item.product} /><div><span>{item.product.category}</span><h3>{item.product.name}</h3><p>{item.product.brand} · {item.product.stock} disponíveis</p><button onClick={() => removeFromCart(item.product.id)}>Remover</button></div><label>Qtd.<select value={item.quantity} onChange={(event) => updateCartQuantity(item.product.id, Number(event.target.value))}>{Array.from({ length: Math.max(item.quantity, Math.min(item.product.stock + item.quantity, 20)) }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select></label><strong>{currency.format(item.product.price * item.quantity)}</strong></div>)}{cartItems.length === 0 && <div className="empty-state"><strong>Seu carrinho está vazio.</strong><p>Escolha um produto no catálogo para começar sua compra.</p></div>}<Link to="/">← Continuar comprando</Link></div><aside className="panel order-summary"><h2>Resumo do pedido</h2><p><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></p><p><span>Frete</span><span>Calculado ao finalizar a compra</span></p><div><span>Total parcial</span><strong>{currency.format(subtotal)}</strong></div><Link className={`button${cartItems.length === 0 ? ' button--disabled' : ''}`} to={cartItems.length ? '/checkout' : '/carrinho'}>Finalizar compra</Link><small>Ao finalizar a compra, selecione endereço, cupons e divida o pagamento entre cartões.</small></aside></div></section>
}

export { CheckoutPage } from './CheckoutPage'

export function OrdersPage() {
  const { activeCustomerId, orders, customerOrderStatus } = useDemoStore()
  const [pendingAction, setPendingAction] = useState<{ action: string; order: DemoOrder } | null>(null)
  const customerOrders = orders.filter((order) => order.customerId === activeCustomerId)
  const actionsFor = (order: DemoOrder) => {
    const actions = ['Ver detalhes']
    if (order.status === 'EM ABERTO' || order.status === 'EM PROCESSAMENTO') actions.push('Cancelar pedido')
    if (['EM TRÂNSITO', 'EM TRANSPORTE'].includes(order.status)) actions.push('Confirmar recebimento')
    if (['ENTREGUE', 'EM TROCA'].includes(order.status)) actions.push('Solicitar troca')
    return actions
  }
  const confirmationFields: EditorField[] = pendingAction ? pendingAction.action === 'Cancelar pedido'
    ? [{ name: 'order', label: 'Pedido', value: `Pedido ${pendingAction.order.numero}`, readOnly: true }, { name: 'status', label: 'Status atual', value: pendingAction.order.status, readOnly: true }, { name: 'reason', label: 'Motivo do cancelamento', value: 'Desisti da compra', type: 'select', options: ['Desisti da compra', 'Pedido duplicado', 'Dados de entrega incorretos'] }]
    : [{ name: 'order', label: 'Pedido', value: `Pedido ${pendingAction.order.numero}`, readOnly: true }, { name: 'status', label: 'Status atual', value: pendingAction.order.status, readOnly: true }, { name: 'receivedAt', label: 'Data do recebimento', value: localDate(), type: 'date' }, { name: 'notes', label: 'Observação', value: 'Pedido recebido em boas condições.', type: 'textarea' }]
    : []
  return <section className="page-width standard-page"><div className="page-title"><span className="eyebrow">TRANSAÇÕES</span><h1>Meus pedidos</h1><p>Consulte pedidos, confirme o recebimento, cancele ou solicite troca.</p></div><div className="order-list">{customerOrders.map((order) => <article className="panel order-card order-card--wide" key={order.id} data-order-id={order.id}><div><small>Pedido</small><strong>{order.numero}</strong></div><div><small>Data</small><strong>{order.date}</strong></div><div><small>Produtos</small><strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)} itens</strong><small>{order.productSummary}</small></div><div><small>Total</small><strong>{currency.format(order.total)}</strong></div><span className={`status status--${statusTone(order.status)}`}>{order.status}</span><div className="order-actions">{actionsFor(order).map((action) => action === 'Ver detalhes' ? <Link key={action} to={`/pedidos/${order.id}`}>{action}</Link> : action === 'Solicitar troca' ? <Link key={action} to={`/trocas?pedido=${order.id}`}>{action}</Link> : <button key={action} onClick={() => setPendingAction({ action, order })}>{action}</button>)}</div></article>)}{customerOrders.length === 0 && <div className="panel empty-state"><strong>Este perfil ainda não possui pedidos.</strong><p>Realize uma compra para iniciar o fluxo.</p></div>}</div>{pendingAction && <MockEditor title={`${pendingAction.action}: Pedido ${pendingAction.order.numero}`} description="Confirme os dados antes de atualizar o pedido." fields={confirmationFields} submitLabel={pendingAction.action} onSave={async () => { await customerOrderStatus(pendingAction.order.id, pendingAction.action === 'Cancelar pedido' ? 'CANCELADO' : 'ENTREGUE'); setPendingAction(null) }} onClose={() => setPendingAction(null)} />}</section>
}

export function OrderDetailPage() {
  const { orderId } = useParams()
  const { products, activeCustomerId, orders, cards, processOrderPayment, notify } = useDemoStore()
  const [processing, setProcessing] = useState(false)
  const order = orders.find((item) => item.id === orderId && item.customerId === activeCustomerId)
  if (!order) return <NotFoundPage />
  const paymentSummary = order.payments?.length
    ? order.payments.map((payment) => `${payment.brand ?? cards.find((card) => card.id === payment.cardId)?.brand ?? 'Cartão'} final ${payment.lastDigits ?? cards.find((card) => card.id === payment.cardId)?.lastDigits ?? '----'}: ${currency.format(payment.amount)} (${payment.status})`).join(' · ')
    : 'Pagamento associado ao pedido'
  return <section className="page-width standard-page"><div className="breadcrumbs"><Link to="/pedidos">Meus pedidos</Link><span>/</span>Pedido {order.numero}</div><div className="page-title"><span className="eyebrow">DETALHES DO PEDIDO</span><h1>Pedido {order.numero}</h1><p>Consulta completa dos dados registrados no fluxo de compra.</p></div>{order.status === 'EM PROCESSAMENTO' && <Alert severity="info" action={<button disabled={processing} onClick={async () => { setProcessing(true); try { await processOrderPayment(order.id) } catch (cause) { notify(cause instanceof Error ? cause.message : 'Falha ao processar pagamento.', 'warning') } finally { setProcessing(false) } }}>Processar pagamento</button>}>Pedido registrado. O pagamento aguarda processamento no ambiente local.</Alert>}{order.status === 'REPROVADA' && <Alert severity="warning">Pagamento reprovado. A reserva de estoque e os cupons foram liberados para uma nova compra.</Alert>}{order.creditCouponCode && <Alert severity="success">Crédito de {currency.format(order.creditValue)} disponível no cupom {order.creditCouponCode}.</Alert>}<div className="order-list"><article className="panel profile-form"><div className="panel-heading"><div><h2>Informações gerais</h2><p>Status e valores do pedido.</p></div><span className={`status status--${statusTone(order.status)}`}>{order.status}</span></div><div className="form-grid"><label>Data<input value={order.date} readOnly /></label><label>Subtotal<input value={currency.format(order.subtotal)} readOnly /></label><label>Frete<input value={currency.format(order.frete)} readOnly /></label><label>Total da compra<input value={currency.format(order.total)} readOnly /></label><label>Cupons aplicados<input value={currency.format(order.desconto)} readOnly /></label><label>Endereço de entrega<input value={order.addressSnapshot} readOnly /></label><label>Cupons utilizados<input value={order.couponCodes?.join(', ') || 'Nenhum cupom'} readOnly /></label><label className="mock-editor__wide">Pagamento<input value={paymentSummary} readOnly /></label></div></article><article className="panel profile-form"><div className="panel-heading"><div><h2>Itens do pedido</h2><p>Produtos e quantidades compradas.</p></div></div><div className="order-list">{order.items.map((item) => { const product = products.find((candidate) => candidate.id === item.productId); return <div className="panel order-detail-panel" key={item.productId}><div><span className="eyebrow">{product?.category ?? 'Produto'}</span><h2>{item.name ?? product?.name ?? item.productId}</h2><p>{product?.brand ?? 'Tech Store'}</p></div><dl><div><dt>Quantidade</dt><dd>{item.quantity}</dd></div><div><dt>Valor unitário</dt><dd>{currency.format(item.unitPrice ?? 0)}</dd></div><div><dt>Subtotal</dt><dd>{currency.format((item.unitPrice ?? 0) * item.quantity)}</dd></div></dl></div> })}</div></article></div></section>
}

export function ExchangesPage() {
  const [params] = useSearchParams()
  const { products, activeCustomerId, orders, exchanges, createExchange, dispatchExchange, notify } = useDemoStore()
  const deliveredOrders = orders.filter((order) => order.customerId === activeCustomerId && order.status === 'ENTREGUE')
  const [orderId, setOrderId] = useState(params.get('pedido') ?? '')
  const selectedOrder = deliveredOrders.find((order) => order.id === orderId)
  const [productId, setProductId] = useState(selectedOrder?.items[0]?.productId ?? '')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('Produto com defeito')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [dispatchingExchange, setDispatchingExchange] = useState<DemoExchange | null>(null)
  const customerExchanges = exchanges.filter((exchange) => exchange.customerId === activeCustomerId)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try { await createExchange({ orderId, productId, quantity, reason: reason + (notes ? ': ' + notes : '') }); setNotes('') }
    catch (error) { notify(error instanceof Error ? error.message : 'Falha ao solicitar troca.', 'warning') }
    finally { setSaving(false) }
  }
  return <section className="page-width standard-page"><div className="page-title"><span className="eyebrow">PÓS-VENDA</span><h1>Trocas</h1><p>Solicite a troca de um item e informe o despacho quando ela for aceita.</p></div><div className="exchange-layout"><form className="panel exchange-form" onSubmit={submit}><h2>Nova solicitação</h2><p>Selecione um pedido entregue, um item e a quantidade.</p><label>Pedido<select value={orderId} onChange={(event) => { const nextOrder = deliveredOrders.find((order) => order.id === event.target.value); setOrderId(event.target.value); setProductId(nextOrder?.items[0]?.productId ?? ''); setQuantity(1) }}><option value="" disabled>Selecione um pedido entregue</option>{deliveredOrders.map((order) => <option key={order.id} value={order.id}>Pedido {order.numero}</option>)}</select></label><label>Item<select value={productId} onChange={(event) => { setProductId(event.target.value); setQuantity(1) }}><option value="" disabled>Selecione um item</option>{selectedOrder?.items.map((item) => <option value={item.productId} key={item.productId}>{products.find((product) => product.id === item.productId)?.name ?? item.productId}</option>)}</select></label><label>Quantidade<input type="number" min="1" max={selectedOrder?.items.find((item) => item.productId === productId)?.quantity ?? 1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label><label>Motivo<select value={reason} onChange={(event) => setReason(event.target.value)}><option>Produto com defeito</option><option>Produto diferente do pedido</option><option>Desistência da compra</option></select></label><label>Observações<textarea placeholder="Conte brevemente o que aconteceu" rows={4} value={notes} onChange={e => setNotes(e.target.value)} /></label><button className="button" disabled={saving || !orderId || !productId}>Solicitar troca</button><small>Uma nova solicitação será criada como TROCA SOLICITADA.</small></form><div className="panel exchange-status"><h2>Solicitações e despacho</h2>{customerExchanges.map((exchange) => <div key={exchange.id}><span className={`status status--${statusTone(exchange.status)}`}>{exchange.status}</span><strong>Solicitação {exchange.id}</strong><p>Pedido {exchange.orderNumber} · {exchange.productName} · {exchange.quantity ?? 1} unidade(s)</p>{exchange.status === 'TROCA ACEITA' ? <button className="button button--compact" onClick={() => setDispatchingExchange(exchange)}>Informar despacho do item</button> : <small>{exchange.status === 'ITEM ENVIADO' ? `Item despachado${exchange.carrier ? ` por ${exchange.carrier}` : ''}${exchange.trackingCode ? ` · rastreio ${exchange.trackingCode}` : ''}; aguardando recebimento pelo administrador.` : 'Acompanhe a próxima ação pelo status.'}</small>}</div>)}</div></div>{dispatchingExchange && <MockEditor title={`Informar despacho: ${dispatchingExchange.id}`} description="O status será alterado para ITEM ENVIADO após a confirmação." fields={[{ name: 'exchange', label: 'Solicitação', value: dispatchingExchange.id, readOnly: true }, { name: 'carrier', label: 'Transportadora', value: '', required: true }, { name: 'trackingCode', label: 'Código de rastreio', value: '', required: true }, { name: 'dispatchDate', label: 'Data do despacho', value: localDate(), type: 'date' }]} submitLabel="Confirmar despacho" onSave={async (values) => { await dispatchExchange(dispatchingExchange.id, values.carrier, values.trackingCode, values.dispatchDate); setDispatchingExchange(null) }} onClose={() => setDispatchingExchange(null)} />}</section>
}

export function CouponsPage() {
  const { coupons } = useDemoStore()
  return <section className="page-width standard-page"><div className="page-title"><span className="eyebrow">CRÉDITOS</span><h1>Meus cupons</h1><p>Consulte cupons de troca e promocionais disponíveis para futuras compras.</p></div><div className="coupon-grid">{coupons.map((coupon) => <article className={`panel coupon-card${coupon.status === 'Utilizado' ? ' coupon-card--used' : ''}`} key={coupon.code}><span>{coupon.type}</span><strong>{coupon.code}</strong><b>{currency.format(coupon.value)}</b><p>Validade: {coupon.validUntil}</p><em>{coupon.status}</em></article>)}</div></section>
}

export function NotFoundPage() {
  return <section className="not-found"><span>404</span><h1>Página não encontrada</h1><p>O endereço informado não existe.</p><Link className="button" to="/">Voltar aos produtos</Link></section>
}
