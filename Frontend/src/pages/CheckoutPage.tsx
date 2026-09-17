import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, LinearProgress } from '@mui/material'
import { useDemoStore } from '../context/DemoContext'
import { vendaService } from '../services/vendaService'
import { cartaoService } from '../services/clienteService'
import { errorMessage } from '../services/api'
import { MockEditor } from '../components/MockEditor'
import { addressFields, addressInput, cardFields } from '../components/CustomerFormFields'
import { ReservationNotice } from '../components/ReservationNotice'
import { useReservationClock } from '../hooks/useReservationClock'
import { ChooseProfile } from './CustomerPages'
import { ProductImage } from '../components/ProductImage'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const cents = (value: number) => Math.round(value * 100)

export function CheckoutPage() {
  const store = useDemoStore()
  const { activeCustomerId, addresses, cards, coupons, createOrder, saveAddress, saveCard } = store
  const navigate = useNavigate()
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedCards, setSelectedCards] = useState<string[] | null>(null)
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([])
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [editor, setEditor] = useState<'address' | 'card' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [operationKey] = useState(() => crypto.randomUUID())
  const addressId = selectedAddress || addresses.find(a => a.entrega)?.id || ''
  const brands = useQuery({ queryKey: ['bandeiras'], queryFn: cartaoService.bandeiras, enabled: !!activeCustomerId })
  const quote = useQuery({ queryKey: ['checkout', activeCustomerId, addressId, selectedCoupons],
    queryFn: () => vendaService.orcamento(activeCustomerId, { enderecoId: addressId || undefined, cupomIds: selectedCoupons }),
    enabled: !!activeCustomerId, retry: false, refetchInterval: busy ? false : 15000 })
  const seconds = useReservationClock(quote.data?.expiresAt)
  const q = quote.data
  const cardIds = (selectedCards ?? cards.filter(c => c.preferencial).map(c => c.id)).filter(id => cards.some(c => c.id === id))
  const total = cents(q?.totalCartoes ?? 0)
  const usedCards = total > 0 ? cardIds : []
  const split = usedCards.length ? Math.floor(total / usedCards.length) : 0
  const amount = (id: string, index: number) => amounts[id] ?? String((index === usedCards.length - 1 ? total - split * index : split) / 100)
  const allocated = usedCards.reduce((sum, id, index) => sum + cents(Number(amount(id, index))), 0)
  const availableCoupons = coupons.filter(c => c.status === 'Disponível')
  const selectedCouponValue = selectedCoupons.reduce((sum, id) => sum + (coupons.find(c => c.id === id)?.value ?? 0), 0)
  const changeCoupon = (id: string, checked: boolean) => {
    const promotional = coupons.find(c => c.id === id)?.type === 'Cupom promocional'
    setSelectedCoupons(current => checked
      ? [...current.filter(previous => !promotional || coupons.find(c => c.id === previous)?.type !== 'Cupom promocional'), id]
      : current.filter(previous => previous !== id))
    setAmounts({}); setError('')
  }
  const finish = async () => {
    if (busy || !q || quote.isFetching || quote.isError) return
    setError('')
    if (!addressId) { setError('Selecione um endereço de entrega.'); return }
    if (!q.items.length || seconds === 0) { setError('Carrinho vazio ou reserva expirada. Adicione os produtos novamente.'); return }
    if (total > 0 && !usedCards.length) { setError('Selecione pelo menos um cartão para pagar o saldo.'); return }
    if (!Number.isFinite(allocated) || allocated !== total) { setError('A soma dos cartões deve corresponder ao saldo após os cupons.'); return }
    const payments = usedCards.map((id, index) => ({ cartaoId: id, valor: cents(Number(amount(id, index))) / 100 }))
    const exception = selectedCoupons.length > 0 && total < 1000 && payments.length === 1
    if (payments.some(p => !Number.isFinite(p.valor) || p.valor <= 0 || (p.valor < 10 && !exception))) {
      setError('Cada cartão deve pagar pelo menos R$ 10,00. Para saldo inferior após cupons, utilize um único cartão.'); return
    }
    setBusy(true)
    try {
      const order = await createOrder({ enderecoId: addressId, cupomIds: selectedCoupons, pagamentos: payments,
        chaveOperacao: operationKey, totalEsperado: q.totalCompra, revisao: q.revisao })
      navigate(`/pedidos/${order.id}`)
    } catch (cause) { setError(errorMessage(cause)); await quote.refetch() }
    finally { setBusy(false) }
  }
  if (!activeCustomerId) return <ChooseProfile />
  return <section className="page-width standard-page">
    <div className="page-title"><span className="eyebrow">SUA COMPRA</span><h1>Finalizar compra</h1></div>
    {(quote.isFetching || busy) && <LinearProgress aria-label="Atualizando compra" />}
    {quote.error && <Alert severity="error" action={<button onClick={() => void quote.refetch()}>Tentar novamente</button>}>{errorMessage(quote.error)}</Alert>}
    {error && <Alert severity="error">{error}</Alert>}
    <ReservationNotice expiresAt={q?.expiresAt} />
    {q?.warnings.map(w => <Alert severity="warning" key={w}>{w}</Alert>)}
    {q?.removed.map(r => <Alert severity="warning" key={r.productId}>{r.name}: {r.reason}</Alert>)}
    <div className="cart-layout"><div className="checkout-steps">
      <article className="panel form-section"><h2>Itens da compra</h2>
        {q?.items.map(item => <div className="cart-line" key={item.productId} data-testid="checkout-item"><ProductImage product={{ name: item.name, imagePath: store.products.find(p => p.id === item.productId)?.imagePath ?? '' }} /><div><h3>{item.name}</h3><p>{item.quantity} × {money.format(item.unitPrice)}</p></div><strong>{money.format(item.unitPrice * item.quantity)}</strong></div>)}
        {q && !q.items.length && <p>Seu carrinho está vazio. <Link to="/">Escolher produtos</Link></p>}
        <Link to="/carrinho">Alterar itens do carrinho</Link>
      </article>
      <article className="panel form-section"><h2>Endereço de entrega</h2>
        {addresses.filter(a => a.entrega).map(a => <label className={`option-card${addressId === a.id ? ' selected' : ''}`} key={a.id}><input type="radio" name="endereco" disabled={busy} checked={addressId === a.id} onChange={() => { setSelectedAddress(a.id); setAmounts({}) }} /><span><strong>{a.label}</strong><small>{a.line}</small></span></label>)}
        {!addresses.some(a => a.entrega) && <p>Nenhum endereço de entrega disponível.</p>}
        <button type="button" className="button button--outline" disabled={busy || editor !== null} onClick={() => setEditor('address')}>Adicionar endereço</button>
        {editor === 'address' && <MockEditor title="Novo endereço de entrega" description="O endereço será salvo na sua conta e selecionado para esta compra."
          fields={addressFields().map(f => f.name === 'entrega' ? { ...f, value: 'true', readOnly: true } : f)} submitLabel="Salvar e selecionar endereço"
          onClose={() => setEditor(null)} onSave={async v => { const address = await saveAddress(addressInput(v)); setSelectedAddress(address.id); setAmounts({}); setEditor(null) }} />}
      </article>
      <article className="panel form-section"><h2>Cupons</h2><p>Até um promocional e um ou mais cupons de troca.</p>
        {availableCoupons.map(c => <label className={`option-card${selectedCoupons.includes(c.id) ? ' selected' : ''}`} key={c.id}><input type="checkbox" name={'cupom-' + c.id} disabled={busy || (!selectedCoupons.includes(c.id) && !!q && q.totalCompra > 0 && selectedCouponValue >= q.totalCompra)}
          checked={selectedCoupons.includes(c.id)} onChange={e => changeCoupon(c.id, e.target.checked)} /><span><strong>{c.code}</strong><small>{c.type} · {money.format(c.value)}</small></span></label>)}
        {!availableCoupons.length && <p>Nenhum cupom disponível.</p>}
      </article>
      <article className="panel form-section"><h2>Cartões</h2>
        {cards.map(c => <label className={`option-card${usedCards.includes(c.id) ? ' selected' : ''}`} key={c.id}><input type="checkbox" name={'cartao-' + c.id} disabled={busy || (!!q && total === 0)} checked={usedCards.includes(c.id)}
          onChange={e => { setSelectedCards(e.target.checked ? [...cardIds, c.id] : cardIds.filter(id => id !== c.id)); setAmounts({}); setError('') }} /><span><strong>{c.brand} final {c.lastDigits}</strong><small>{c.preferencial ? 'Preferencial' : 'Cartão da conta'}</small></span></label>)}
        {usedCards.map((id, index) => <div className="payment-split" key={id}><span>Cartão final {cards.find(c => c.id === id)?.lastDigits}</span><label>Valor
          <input aria-label={'Valor no cartão final ' + cards.find(c => c.id === id)?.lastDigits} name={'valor-' + id} type="number" min="0.01" step="0.01" disabled={busy} value={amount(id, index)} onChange={e => setAmounts(current => ({ ...current, [id]: e.target.value }))} />
        </label></div>)}
        {!!q?.items.length && total === 0 && <p>Os cupons cobrem a compra. Nenhum cartão será cobrado.</p>}
        {!cards.length && <p>Nenhum cartão cadastrado.</p>}
        <button type="button" className="button button--outline" disabled={busy || !brands.data || editor !== null} onClick={() => setEditor('card')}>Adicionar cartão</button>
        {brands.error && <Alert severity="error">{errorMessage(brands.error)}</Alert>}
        {editor === 'card' && <MockEditor title="Novo cartão para compra" description="O cartão será associado à sua conta. Use dados fictícios de teste. Número completo e CVV não são armazenados."
          fields={cardFields(brands.data ?? [])} submitLabel="Salvar e selecionar cartão" onClose={() => setEditor(null)} onSave={async v => {
            const card = await saveCard({ bandeira: v.bandeira, titular: v.titular, validade: v.validade, preferencial: v.preferencial === 'true', numero: v.numeroCartao, codigoSeguranca: v.codigoSeguranca })
            setSelectedCards([...cardIds, card.id]); setAmounts({}); setEditor(null)
          }} />}
      </article>
    </div><aside className="panel order-summary"><h2>Resumo do pedido</h2>
      <p>Subtotal <strong>{money.format(q?.subtotal ?? 0)}</strong></p>
      <p>Frete <strong>{addressId ? money.format(q?.frete ?? 0) : 'Selecione o endereço'}</strong></p>
      <p>Total da compra <strong>{money.format(q?.totalCompra ?? 0)}</strong></p>
      <p>Cupons <strong>{money.format(q?.desconto ?? 0)}</strong></p>
      <p>Saldo nos cartões <strong>{money.format(q?.totalCartoes ?? 0)}</strong></p>
      <p>Distribuído <strong>{money.format(allocated / 100)}</strong></p>
      <p>Restante a distribuir <strong>{money.format((total - allocated) / 100)}</strong></p>
      {!!q?.creditoTroca && <p>Crédito em novo cupom de troca <strong>{money.format(q.creditoTroca)}</strong></p>}
      <p>Pagamento em ambiente local de testes. Nenhuma cobrança real será realizada.</p>
      <button type="button" className="button" disabled={busy || quote.isFetching || quote.isError || !q?.items.length || seconds === 0} onClick={() => void finish()}>{busy ? 'Finalizando compra…' : 'Finalizar compra'}</button>
    </aside></div>
  </section>
}
