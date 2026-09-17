import { Link } from 'react-router-dom'
import { Alert } from '@mui/material'
import type { ReactNode } from 'react'
import type { Transacoes } from '../services/vendaService'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const activityLabels: Record<string, string> = {
  CADASTRAR: 'Cadastro realizado', ALTERAR: 'Dados atualizados', INATIVAR: 'Cadastro inativado',
  REATIVAR: 'Cadastro reativado', EXCLUIR: 'Registro removido', ALTERAR_SENHA: 'Senha alterada',
  ALTERAR_PREFERENCIA: 'Preferência atualizada', FINALIZAR_COMPRA: 'Compra finalizada',
  APROVAR_PAGAMENTO: 'Pagamento aprovado', ALTERAR_STATUS: 'Status atualizado',
  UTILIZAR_CUPOM: 'Cupom utilizado', DEVOLVER_CUPOM: 'Cupom liberado', GERAR_CREDITO: 'Crédito gerado',
  SOLICITAR_TROCA: 'Troca solicitada', DESPACHAR_TROCA: 'Item despachado', GERAR_CUPOM_TROCA: 'Cupom de troca gerado',
  CANCELADO: 'Pedido cancelado', REPROVADA: 'Pagamento reprovado', REMOVER_ITEM: 'Item removido', AJUSTAR_QUANTIDADE: 'Quantidade ajustada',
}
const entityLabels: Record<string, string> = { Cliente: 'Cliente', Endereco: 'Endereço', Cartao: 'Cartão', Carrinho: 'Carrinho', Pedido: 'Pedido', Troca: 'Troca', Cupom: 'Cupom', Estoque: 'Estoque' }

function TransactionStatus({ status }: { status: string }) {
  const tone = ['ENTREGUE', 'PAGAMENTO REALIZADO', 'APROVADA', 'APROVADO', 'TROCA PROCESSADA', 'Disponível'].includes(status)
    ? 'success' : ['CANCELADO', 'REPROVADA', 'REPROVADO', 'TROCA NEGADA', 'Expirado'].includes(status) ? 'warning' : 'info'
  return <span className={`status status--${tone}`}>{status}</span>
}

function TransactionGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="transaction-group" aria-label={title}>
    <header><h4>{title}</h4><span className="transaction-count">{count}</span></header>
    {count === 0 ? <p className="account-empty">Nenhum registro encontrado.</p> : <ul className="transaction-list">{children}</ul>}
  </section>
}

export function CustomerTransactions({ data }: { data: Transacoes }) {
  return <>
    <section className="panel account-section" aria-labelledby="customer-transactions-heading">
      <header className="account-section__heading"><div><span className="eyebrow">MINHA CONTA</span><h3 id="customer-transactions-heading">Transações do cliente</h3><p>Compras, pagamentos, trocas e cupons em um só lugar.</p></div></header>
      <div className="account-summary">{[
        ['Pedidos', data.pedidos.length], ['Trocas', data.trocas.length], ['Pagamentos', data.pagamentos.length], ['Cupons', data.cupons.length],
      ].map(([label, total]) => <div key={label}><small>{label}</small><strong>{total}</strong></div>)}</div>
      {data.pedidos.length + data.trocas.length + data.pagamentos.length + data.cupons.length === 0 && <p className="account-empty">Nenhuma transação registrada para este cliente.</p>}
      <div className="transaction-grid">
        <TransactionGroup title="Pedidos" count={data.pedidos.length}>
          {data.pedidos.map(p => <li key={p.id} data-order-id={p.id}>
            <div className="transaction-list__heading"><Link to={`/pedidos/${p.id}`}>Pedido {p.numero}</Link><TransactionStatus status={p.status} /></div>
            <p>{p.productSummary || `${p.items.length} item(ns)`}</p>
            <div className="transaction-list__footer"><time dateTime={p.date}>{dateTime.format(new Date(p.date))}</time><strong>{currency.format(p.total)}</strong></div>
          </li>)}
        </TransactionGroup>
        <TransactionGroup title="Pagamentos" count={data.pagamentos.length}>
          {data.pagamentos.map(p => <li key={p.id}>
            <div className="transaction-list__heading"><Link to={`/pedidos/${p.pedidoId}`}>Pedido {p.pedidoNumero}</Link><TransactionStatus status={p.status} /></div>
            <div className="transaction-list__footer"><span>{p.cartaoFinal ? `Cartão final ${p.cartaoFinal}` : 'Pagamento registrado'}</span><strong>{currency.format(p.valor)}</strong></div>
          </li>)}
        </TransactionGroup>
        <TransactionGroup title="Trocas" count={data.trocas.length}>
          {data.trocas.map(t => <li key={t.id}>
            <div className="transaction-list__heading"><Link to={`/pedidos/${t.orderId}`}>Pedido {t.orderNumber}</Link><TransactionStatus status={t.status} /></div>
            <p>{t.productName}</p><div className="transaction-list__footer"><span>{t.quantity ?? 1} unidade(s)</span><Link to="/trocas">Acompanhar troca →</Link></div>
          </li>)}
        </TransactionGroup>
        <TransactionGroup title="Cupons" count={data.cupons.length}>
          {data.cupons.map(c => <li key={c.id}>
            <div className="transaction-list__heading"><Link to="/cupons">Cupom {c.code}</Link><TransactionStatus status={c.status} /></div>
            <p>{c.type}</p><div className="transaction-list__footer"><span>Validade: {c.validUntil.split('-').reverse().join('/')}</span><strong>{currency.format(c.value)}</strong></div>
          </li>)}
        </TransactionGroup>
      </div>
    </section>
    <section className="panel account-section" aria-labelledby="customer-activity-heading">
      <header className="account-section__heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h3 id="customer-activity-heading">Histórico de atividades</h3><p>Últimas movimentações registradas na conta.</p></div><span className="transaction-count">{data.atividades.length}</span></header>
      {data.notificacoes?.length > 0 && <div className="account-notifications">{data.notificacoes.map(n => <Alert severity="info" key={n.id}><time dateTime={n.data}>{dateTime.format(new Date(n.data))}</time> · {n.mensagem}</Alert>)}</div>}
      {data.atividades.length === 0 && <p className="account-empty">Nenhuma atividade registrada.</p>}
      <ul className="account-timeline" aria-label="Histórico de atividades">{data.atividades.map(a => {
        const [entity, id] = a.entidade.split(':')
        const order = entity === 'Pedido' ? data.pedidos.find(p => p.id === id) : undefined
        return <li key={a.id}>
          <span className="account-timeline__marker" aria-hidden="true" />
          <div><strong>{activityLabels[a.acao] ?? a.acao.replaceAll('_', ' ').toLocaleLowerCase('pt-BR')}</strong>
            {order ? <Link to={`/pedidos/${order.id}`}>Pedido {order.numero}</Link> : <span>{entityLabels[entity] ?? entity}</span>}
          </div><time dateTime={a.data}>{dateTime.format(new Date(a.data))}</time>
        </li>
      })}</ul>
    </section>
  </>
}
