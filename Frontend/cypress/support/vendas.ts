/// <reference types="cypress" />
import { apiCard, fill, selectProfile, submit } from './data'
import { abrirFinalizacao, finalizarPedido, iniciarCarrinho, prepararPedido, type BasePedido } from './pedido'
import type { Cupom, OrderStatus, Pedido, Quote, Troca } from '../../src/services/vendaService'
import { localDate } from '../../src/utils/localDate'

export type VendaPreparada = { base: BasePedido; pedido: Pedido }
export const reais = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

// Somente pré-condições dos testes isolados. O fluxo 00 não usa este atalho:
// nele carrinho, compra, pagamento, entrega e troca são executados pelas telas.
export function prepararVenda(status: 'EM PROCESSAMENTO' | 'APROVADA' | 'EM TRANSPORTE' | 'ENTREGUE' = 'EM PROCESSAMENTO', recusado = false, varios = false): Cypress.Chainable<VendaPreparada> {
  return prepararPedido().then(base => {
    const cartao: Cypress.Chainable<BasePedido['cartoes'][number]> = recusado ? apiCard(base.cliente.id, '4000000000000002') : cy.wrap(base.cartoes[0])
    return cartao.then(c => {
      cy.request('POST', `/api/clientes/${base.cliente.id}/carrinho/itens/${base.produtos[0].id}`, { quantidade: varios ? 2 : 1 })
      if (varios) cy.request('POST', `/api/clientes/${base.cliente.id}/carrinho/itens/${base.produtos[1].id}`, { quantidade: 1 })
      return cy.request(`/api/clientes/${base.cliente.id}/enderecos`).then(({ body: enderecos }) => {
        const selecao = { enderecoId: enderecos[0].id, cupomIds: [] }
        return cy.request<Quote>('POST', `/api/clientes/${base.cliente.id}/checkout/orcamento`, selecao).then(({ body: quote }) => {
          return cy.request<Pedido>('POST', `/api/clientes/${base.cliente.id}/pedidos`, {
            ...selecao, pagamentos: [{ cartaoId: c.id, valor: quote.totalCartoes }],
            chaveOperacao: crypto.randomUUID(), totalEsperado: quote.totalCompra, revisao: quote.revisao,
          }).then(({ body: pedido }) => {
            expect(pedido.status, 'pré-condição persistida').to.eq('EM PROCESSAMENTO')
            if (status !== 'EM PROCESSAMENTO') {
              cy.request('POST', `/api/pedidos/${pedido.id}/pagamento`).its('body.status').should('eq', 'APROVADA')
              if (status === 'EM TRANSPORTE' || status === 'ENTREGUE') {
                cy.request('PATCH', `/api/pedidos/${pedido.id}/status`, { status: 'EM TRANSPORTE' })
              }
              if (status === 'ENTREGUE') cy.request('PATCH', `/api/pedidos/${pedido.id}/status`, { status })
            }
            return cy.request<Pedido>(`/api/pedidos/${pedido.id}`).then(r => ({ base, pedido: r.body }))
          })
        })
      })
    })
  })
}

export function processarPagamento(pedido: Pedido, esperado: 'APROVADA' | 'REPROVADA' = 'APROVADA'): Cypress.Chainable<Pedido> {
  cy.log('[RN0037][RN0038][RN0028][RF0053] Processa pagamento no simulador local')
  cy.location('pathname').should('eq', '/pedidos/' + pedido.id)
  cy.intercept('POST', `**/api/pedidos/${pedido.id}/pagamento`).as('vendaPagamento')
  cy.contains('button', 'Processar pagamento').should('not.be.disabled').click()
  return cy.wait('@vendaPagamento').then(({ response }) => {
    expect(response?.statusCode).to.eq(200)
    const atualizado = response!.body as Pedido
    expect(atualizado.status).to.eq(esperado)
    expect(atualizado.payments?.every(p => p.status === (esperado === 'APROVADA' ? 'APROVADO' : 'REPROVADO'))).to.eq(true)
    cy.contains('.status', esperado).should('be.visible')
    cy.contains('button', 'Processar pagamento').should('not.exist')
    cy.reload()
    cy.contains('.status', esperado).should('be.visible')
    return cy.then(() => atualizado)
  })
}

export function conferirEstoque(base: BasePedido, pedido: Pedido, aprovado: boolean, reentradas: Record<string, number> = {}) {
  for (const produto of base.produtos) {
    const vendido = pedido.items.find(i => i.productId === produto.id)?.quantity ?? 0
    cy.request(`/api/produtos/${produto.id}`).then(({ body }) => {
      expect(body.quantidade, produto.nome + ': estoque físico').to.eq(produto.quantidade - (aprovado ? vendido : 0) + (reentradas[produto.id] ?? 0))
      expect(body.reservado, produto.nome + ': reserva liberada').to.eq(0)
    })
  }
}

export function alterarStatusAdmin(pedido: Pedido, status: Extract<OrderStatus, 'EM TRANSPORTE' | 'ENTREGUE'>) {
  cy.log(status === 'EM TRANSPORTE' ? '[RF0039][RN0039] Admin despacha pedido aprovado' : '[RF0040][RN0040] Admin confirma entrega')
  selectProfile('ADMIN', '/admin/pedidos')
  cy.intercept('PATCH', `**/api/pedidos/${pedido.id}/status`).as('vendaStatus')
  cy.get(`tbody tr[data-record-id="${pedido.id}"]`).within(() => cy.contains('button', 'Alterar status').click())
  cy.get('form[aria-label="Alterar status do pedido"]').within(() => { fill({ status }); submit() })
  cy.wait('@vendaStatus').its('response.body.status').should('eq', status)
  cy.get('form[aria-label="Alterar status do pedido"]').should('not.exist')
  cy.get(`tbody tr[data-record-id="${pedido.id}"]`).should('contain', status)
  cy.reload()
  cy.get(`tbody tr[data-record-id="${pedido.id}"]`).should('contain', status)
}

export function confirmarRecebimentoCliente(base: BasePedido, pedido: Pedido) {
  selectProfile(base.cliente.id, '/pedidos')
  cy.intercept('PATCH', `**/api/clientes/${base.cliente.id}/pedidos/${pedido.id}/status`).as('vendaEntregaCliente')
  cy.get(`article[data-order-id="${pedido.id}"]`).contains('button', 'Confirmar recebimento').click()
  cy.get('form.mock-editor').within(() => submit('Confirmar recebimento'))
  cy.wait('@vendaEntregaCliente').its('response.body.status').should('eq', 'ENTREGUE')
  cy.get('form.mock-editor').should('not.exist')
  cy.get(`article[data-order-id="${pedido.id}"]`).should('contain', 'ENTREGUE')
}

export function solicitarTroca(base: BasePedido, pedido: Pedido, produtoId = pedido.items[0].productId, quantidade = 1): Cypress.Chainable<Troca> {
  cy.log('[RF0041][RN0041][RN0043] Cliente solicita troca a partir de Meus pedidos')
  selectProfile(base.cliente.id, '/pedidos')
  cy.get(`article[data-order-id="${pedido.id}"]`).contains('a', 'Solicitar troca').click()
  cy.intercept('POST', `**/api/clientes/${base.cliente.id}/trocas`).as('vendaTroca')
  cy.get('.exchange-form').within(() => {
    cy.contains('label', 'Pedido').find('select').should('have.value', pedido.id)
    cy.contains('label', 'Item').find('select').select(produtoId)
    // O campo mantém mínimo 1 durante a edição. clear()+type() concatenava o
    // valor reconstituído pelo React (1 + 1 = 11, limitado ao saldo do item).
    cy.contains('label', 'Quantidade').find('input').type('{selectall}' + quantidade).should('have.value', String(quantidade))
    cy.contains('label', 'Motivo').find('select').select('Produto com defeito')
    cy.get('textarea').type('O componente apresentou falha ao ser instalado.')
    submit('Solicitar troca')
  })
  return cy.wait('@vendaTroca').then(({ response }) => {
    expect(response?.statusCode).to.eq(201)
    const troca = response!.body as Troca
    expect(troca.status).to.eq('TROCA SOLICITADA')
    expect(troca.statusDrs, 'RN0041 estado do DRS').to.eq('EM TROCA')
    expect(troca.quantity).to.eq(quantidade)
    cy.contains('.exchange-status > div', troca.id).should('contain', 'TROCA SOLICITADA')
    return cy.then(() => troca)
  })
}

function transicaoTrocaAdmin(troca: Troca, acao: string, values: Record<string, string>, esperado: Troca['status']): Cypress.Chainable<Troca> {
  selectProfile('ADMIN', '/admin/trocas')
  cy.intercept('PATCH', `**/api/trocas/${troca.id}/status`).as('vendaTransicaoTroca')
  cy.contains('tbody tr', troca.id).contains('button', acao).click()
  cy.get('form.mock-editor').within(() => { fill(values); submit('Aplicar transição') })
  return cy.wait('@vendaTransicaoTroca').then(({ response }) => {
    expect(response?.statusCode).to.eq(200)
    const atualizado = response!.body as Troca
    expect(atualizado.status).to.eq(esperado)
    cy.get('form.mock-editor').should('not.exist')
    cy.contains('tbody tr', troca.id).should('contain', esperado)
    return cy.then(() => atualizado)
  })
}

export function decidirTroca(troca: Troca, aceitar = true) {
  cy.log('[RF0042][RF0043][RN0046] Admin consulta e decide a solicitação')
  const status = aceitar ? 'TROCA ACEITA' : 'TROCA NEGADA'
  return transicaoTrocaAdmin(troca, 'Aceitar ou negar', { nextStatus: status, notes: aceitar ? 'Troca autorizada após análise.' : 'Solicitação não autorizada após análise.' }, status)
    .then(atualizado => {
      expect(atualizado.statusDrs).to.eq(aceitar ? 'TROCA AUTORIZADA' : 'TROCA NEGADA')
      return atualizado
    })
}

export function conferirNotificacao(base: BasePedido, status = 'TROCA ACEITA') {
  selectProfile(base.cliente.id, '/conta')
  cy.contains('[role="alert"]', status).should('be.visible')
  cy.reload()
  cy.contains('[role="alert"]', status).should('be.visible')
}

export function despacharTroca(base: BasePedido, troca: Troca): Cypress.Chainable<Troca> {
  cy.log('Cliente informa o despacho do item autorizado')
  selectProfile(base.cliente.id, '/trocas')
  cy.intercept('POST', `**/api/clientes/${base.cliente.id}/trocas/${troca.id}/despacho`).as('vendaDespachoTroca')
  cy.contains('.exchange-status > div', troca.id).contains('button', 'Informar despacho do item').click()
  const trackingCode = 'TS-' + troca.id.slice(0, 8)
  cy.get('form.mock-editor').within(() => {
    fill({ carrier: 'Transportadora Tech Store', trackingCode, dispatchDate: localDate() })
    submit('Confirmar despacho')
  })
  return cy.wait('@vendaDespachoTroca').then(({ response }) => {
    expect(response?.statusCode).to.eq(200)
    const atualizado = response!.body as Troca
    expect(atualizado.status).to.eq('ITEM ENVIADO')
    expect(atualizado.trackingCode).to.eq(trackingCode)
    cy.get('form.mock-editor').should('not.exist')
    cy.contains('.exchange-status > div', troca.id).should('contain', 'ITEM ENVIADO').and('contain', trackingCode)
    return cy.then(() => atualizado)
  })
}

export function receberTroca(troca: Troca, reentrada = true) {
  cy.log('[RF0044][RF0045][RF0054][RN0042] Admin recebe item, decide estoque e gera crédito')
  return transicaoTrocaAdmin(troca, 'Confirmar recebimento', { reentrada: reentrada ? 'Sim' : 'Não', notes: reentrada ? 'Item conferido e reintegrado ao estoque.' : 'Item sem condições de revenda; não retornar ao estoque.' }, 'ITEM RECEBIDO')
    .then(atualizado => {
      expect(atualizado.statusDrs).to.eq('TROCADO')
      expect(atualizado.reentradaEstoque).to.eq(reentrada)
      expect(atualizado.couponCode).to.eq('TROCA-' + troca.id)
      return atualizado
    })
}

export function encerrarTroca(troca: Troca) {
  return transicaoTrocaAdmin(troca, 'Processar troca', {}, 'TROCA PROCESSADA')
}

export function conferirCupomTroca(base: BasePedido, pedido: Pedido, troca: Troca) {
  const item = pedido.items.find(i => i.productId === troca.productId)!
  const esperado = Number(((item.unitPrice ?? 0) * (troca.quantity ?? 1)).toFixed(2))
  cy.request<Cupom[]>(`/api/clientes/${base.cliente.id}/cupons`).then(({ body }) => {
    const cupons = body.filter(c => c.code === 'TROCA-' + troca.id)
    expect(cupons, 'um único cupom por recebimento').to.have.length(1)
    expect(cupons[0].value).to.eq(esperado)
    expect(cupons[0].status).to.eq('Disponível')
  })
  selectProfile(base.cliente.id, '/cupons')
  cy.contains('article', 'TROCA-' + troca.id).should('contain', reais(esperado)).and('contain', 'Disponível')
}

export function reutilizarCupomTroca(base: BasePedido, troca: Troca) {
  cy.log('[RF0036][RF0037][RF0045] Usa o cupom gerado no recebimento em uma nova compra')
  const novaBase: BasePedido = { ...base, produtos: [] }
  // Saldo atual: pode ter ocorrido uma troca parcial. Não reutiliza a expectativa antiga.
  for (const produto of base.produtos) {
    cy.request('/api/produtos/' + produto.id).then(({ body }) => { novaBase.produtos.push(body) })
  }
  cy.then(() => {
    iniciarCarrinho(novaBase)
    abrirFinalizacao()
    cy.contains('label.option-card', 'TROCA-' + troca.id).find('input').check()
    cy.wait('@orcamento').its('response.statusCode').should('eq', 200)
    finalizarPedido(novaBase).then(novoPedido => {
      expect(novoPedido.id).not.to.eq(troca.orderId)
      expect(novoPedido.couponCodes).to.include('TROCA-' + troca.id)
      processarPagamento(novoPedido)
      conferirEstoque(novaBase, novoPedido, true)
      selectProfile(base.cliente.id, '/cupons')
      cy.contains('article', 'TROCA-' + troca.id).should('contain', 'Utilizado')
      cy.request<Cupom[]>(`/api/clientes/${base.cliente.id}/cupons`).then(({ body }) => {
        const cupom = body.find(c => c.code === 'TROCA-' + troca.id)!
        expect(cupom.status).to.eq('Utilizado')
        cy.request(`/api/clientes/${base.cliente.id}/enderecos`).then(({ body: enderecos }) => {
          cy.request({ method: 'POST', url: `/api/clientes/${base.cliente.id}/checkout/orcamento`, body: { enderecoId: enderecos[0].id, cupomIds: [cupom.id] }, failOnStatusCode: false }).its('status').should('eq', 409)
        })
      })
    })
  })
}

export function conferirAuditoriaCiclo(base: BasePedido, pedido: Pedido) {
  cy.log('[RNF0012] Confere operações de escrita do ciclo no PostgreSQL')
  cy.task('auditoriaPedido', { clienteId: base.cliente.id, pedidoId: pedido.id }).then(result => {
    type Registro = { data: string; responsavel: string; operacao: string; alteracoes: { antes: unknown; depois: unknown } }
    const registros = (result as { auditorias: Registro[] }).auditorias
    expect(registros.map(r => r.operacao)).to.include.members([
      'FINALIZAR_COMPRA', 'APROVAR_PAGAMENTO', 'ALTERAR_STATUS', 'SOLICITAR_TROCA',
      'ALTERAR_TROCA', 'DESPACHAR_TROCA', 'NOTIFICAR_CLIENTE', 'REENTRADA_TROCA', 'GERAR_CUPOM_TROCA',
    ])
    for (const registro of registros) {
      expect(new Date(registro.data).getTime()).to.be.greaterThan(0)
      expect(registro.responsavel).to.be.a('string').and.not.eq('')
      expect(registro.alteracoes).to.have.all.keys('antes', 'depois')
    }
    expect(JSON.stringify(registros)).not.to.contain('codigoSeguranca').and.not.to.contain('4012888888881881')
  })
}
