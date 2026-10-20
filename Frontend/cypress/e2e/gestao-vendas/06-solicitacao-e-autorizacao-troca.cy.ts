import { conferirEstoque, conferirNotificacao, decidirTroca, prepararVenda, solicitarTroca, despacharTroca, receberTroca, conferirCupomTroca } from '../../support/vendas'

describe('Vendas 06 — solicitação e decisão de troca', () => {
  it('[RF0041][RF0042][RF0043][RN0041][RN0043][RN0046] solicita todos os itens, autoriza e notifica o cliente', () => {
    prepararVenda('ENTREGUE').then(({ base, pedido }) => {
      solicitarTroca(base, pedido).then(troca => {
        cy.request('/api/pedidos/' + pedido.id).its('body.status').should('eq', 'EM TROCA')
        decidirTroca(troca)
        cy.request('/api/pedidos/' + pedido.id).its('body.status').should('eq', 'TROCA AUTORIZADA')
        conferirNotificacao(base)
        conferirEstoque(base, pedido, true)
      })
    })
  })
  it('[RF0041][RF0042][RF0044][RF0045][RN0041][RN0042] troca só uma unidade de um pedido com vários itens e preserva os demais', () => {
    prepararVenda('ENTREGUE', false, true).then(({ base, pedido }) => {
      solicitarTroca(base, pedido, base.produtos[0].id, 1).then(troca => {
        cy.request('/api/pedidos/' + pedido.id).its('body.status').should('eq', 'ENTREGUE')
        decidirTroca(troca)
        conferirNotificacao(base)
        despacharTroca(base, troca)
        receberTroca(troca)
        conferirEstoque(base, pedido, true, { [base.produtos[0].id]: 1 })
        conferirCupomTroca(base, pedido, troca)
        cy.request('/api/pedidos/' + pedido.id).then(({ body }) => {
          expect(body.status, 'as outras unidades não foram trocadas').to.eq('ENTREGUE')
          expect(body.items).to.have.length(2)
        })
      })
    })
  })
})
