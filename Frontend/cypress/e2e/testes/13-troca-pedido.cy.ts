/// <reference types="cypress" />
import { apiCard, apiCustomer, apiProduct, fill, submit, comprarPeloCatalogo } from '../../support/data'

describe('Fluxo 13 — cliente solicita troca e informa o despacho', () => {
  it('RF0041 e RF0043 — executa somente as ações disponíveis ao cliente', () => {
    apiCustomer().then(cliente => apiProduct(100).then(produto => apiCard(cliente.id).then(() => {
      comprarPeloCatalogo(cliente.id, produto)
      cy.contains('a', /^Finalizar compra$/).click()
      cy.contains('button', /^Finalizar compra$/).click()

      cy.location('pathname').should('match', /^\/pedidos\/[0-9a-f-]+$/).then(path => {
        const pedidoId = path.split('/').pop()!
        // Esta suíte de regressão posterior à compra não compõe a apresentação de criação de pedido.
        cy.request('POST', '/api/pedidos/' + pedidoId + '/pagamento')
        // Precondição externa: a transportadora iniciou e concluiu a entrega.
        // A transição respeita o fluxo persistido, mas não abre nenhuma tela administrativa.
        cy.request('PATCH', '/api/pedidos/' + pedidoId + '/status', { status: 'EM TRÂNSITO' })
        cy.request('PATCH', '/api/pedidos/' + pedidoId + '/status', { status: 'ENTREGUE' })
        cy.visit('/trocas')
        cy.reload()
        cy.location('pathname').should('not.contain', '/admin')

        cy.intercept('POST', '**/api/clientes/' + cliente.id + '/trocas').as('solicitarTroca')
        cy.get('.exchange-form').within(() => {
          cy.contains('label', 'Pedido').find('select').select(pedidoId)
          cy.contains('label', 'Item').find('select').select(produto.id)
          cy.get('textarea').type('Falha fictícia no hardware')
          submit('Solicitar troca')
        })
        cy.wait('@solicitarTroca').then(({ response }) => {
          expect(response?.statusCode).to.eq(201)
          const trocaId = response?.body.id as string
          cy.get('.exchange-status').should('contain', 'TROCA SOLICITADA')

          // Precondição externa: a loja aceitou a solicitação para liberar o despacho do cliente.
          cy.request('PATCH', '/api/trocas/' + trocaId + '/status', { status: 'TROCA ACEITA' })
          cy.reload()
          cy.intercept('POST', '**/api/clientes/' + cliente.id + '/trocas/' + trocaId + '/despacho').as('informarDespacho')
          cy.contains('button', 'Informar despacho do item').click()
          cy.get('form.mock-editor').within(() => {
            fill({ carrier: 'Transportadora local', trackingCode: 'CY-123' })
            submit('Confirmar despacho')
          })
          cy.wait('@informarDespacho').its('response.statusCode').should('eq', 200)
          cy.get('.exchange-status').should('contain', 'ITEM ENVIADO')
          cy.request('/api/trocas?clienteId=' + cliente.id).its('body.0.status').should('eq', 'ITEM ENVIADO')
        })
      })
    })))
  })
})
