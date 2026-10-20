/// <reference types="cypress" />
import { apiCustomer, apiProduct, comprarPeloCatalogo } from '../../support/data'

describe('Fluxo 09 — carrinho persistente', () => {
  it('RF0031, RF0032, RN0031 e RN0032 — adiciona e altera a quantidade do item', () => {
    apiCustomer().then(cliente => apiProduct().then(produto => {
      comprarPeloCatalogo(cliente.id, produto, 2)
      cy.get('.cart-line select').should('have.value', '2').select('3')
      cy.contains('Carrinho atualizado.').should('be.visible')
      cy.reload()
      cy.get('.cart-line select').should('have.value', '3')
      cy.request('/api/clientes/' + cliente.id + '/carrinho').then(({ body }) => {
        expect(body).to.have.length(1)
        expect(body[0].quantity).to.eq(3)
      })
    }))
  })
})
