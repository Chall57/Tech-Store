/// <reference types="cypress" />
import { apiCard, apiCoupon, apiCustomer, apiProduct, selectProfile, submit, comprarPeloCatalogo } from '../../support/data'

describe('Fluxo 12 — cliente consulta e cancela os próprios pedidos', () => {
  it('RF0033 e RF0038 — realiza a compra e consulta o pedido pela própria conta', () => {
    apiCustomer().then(cliente => apiProduct(100).then(produto => apiCard(cliente.id).then(() => {
      comprarPeloCatalogo(cliente.id, produto)
      cy.contains('a', /^Finalizar compra$/).click()
      cy.contains('button', /^Finalizar compra$/).click()

      cy.location('pathname').should('match', /^\/pedidos\/[0-9a-f-]+$/).then(path => {
        const pedidoId = path.split('/').pop()!
        cy.contains('.status', 'EM PROCESSAMENTO').should('be.visible')
        cy.get('nav[aria-label="Navegação principal"]').contains('a', /Meus pedidos/i).click()
        cy.location('pathname').should('eq', '/pedidos')
        cy.location('pathname').should('not.contain', '/admin')
        cy.get('article[data-order-id="' + pedidoId + '"]').within(() => {
          cy.contains(produto.nome).should('be.visible')
          cy.contains('a', 'Ver detalhes').click()
        })
        cy.location('pathname').should('eq', '/pedidos/' + pedidoId)
        cy.contains('h1', /Pedido \d+/).should('be.visible')
        cy.request('/api/pedidos/' + pedidoId).its('body.customerId').should('eq', cliente.id)
      })
    })))
  })

  it('Cancelamento — cliente cancela o próprio pedido pendente e preserva a rastreabilidade', () => {
    apiCustomer().then(cliente => apiProduct(100).then(produto => apiCard(cliente.id).then(cartao =>
      apiCoupon(cliente.id, 20).then(cupom => {
        cy.request('POST', '/api/clientes/' + cliente.id + '/carrinho/itens/' + produto.id, { quantidade: 1 })
        cy.request('/api/clientes/' + cliente.id + '/enderecos').then(({ body: enderecos }) => {
          const enderecoId = enderecos[0].id
          cy.request('POST', '/api/clientes/' + cliente.id + '/checkout/orcamento', { enderecoId, cupomIds: [cupom.id] }).then(({ body: orcamento }) => {
            cy.request('POST', '/api/clientes/' + cliente.id + '/pedidos', {
              enderecoId, cupomIds: [cupom.id], pagamentos: [{ cartaoId: cartao.id, valor: 94.90 }],
              chaveOperacao: crypto.randomUUID(), totalEsperado: orcamento.totalCompra, revisao: orcamento.revisao,
            }).then(({ body: pedido }) => {
              selectProfile(cliente.id, '/pedidos')
              cy.location('pathname').should('not.contain', '/admin')
              cy.get('article[data-order-id="' + pedido.id + '"]').within(() => cy.contains('button', 'Cancelar pedido').click())
              cy.get('form.mock-editor').within(() => submit('Cancelar pedido'))
              cy.get('article[data-order-id="' + pedido.id + '"]').should('contain', 'CANCELADO')
              cy.request('/api/pedidos/' + pedido.id).its('body.status').should('eq', 'CANCELADO')
              cy.request('/api/produtos/' + produto.id).its('body.quantidade').should('eq', 10)
            })
          })
        })
      })
    )))
  })
})
