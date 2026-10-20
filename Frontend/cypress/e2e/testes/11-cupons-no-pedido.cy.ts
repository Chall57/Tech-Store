/// <reference types="cypress" />
import { apiCoupon, apiCustomer, apiProduct, comprarPeloCatalogo } from '../../support/data'

describe('Fluxo 11 — aplicação de cupons no pedido', () => {
  it('RN0036 — combina cupons, cobre a compra e devolve o excedente em novo cupom', () => {
    apiCustomer().then(cliente => apiProduct(100).then(produto =>
      apiCoupon(cliente.id, 70).then(cupomA => apiCoupon(cliente.id, 60).then(cupomB => {
        comprarPeloCatalogo(cliente.id, produto)
        cy.contains('a', /^Finalizar compra$/).click()
        cy.contains('label', cupomA.codigo).find('input').check()
        cy.contains('label', cupomB.codigo).find('input').check()
        cy.contains('Os cupons cobrem a compra.').should('be.visible')
        cy.contains('.order-summary p', 'Crédito em novo cupom').should('contain', '15,10')
        cy.contains('button', /^Finalizar compra$/).click()

        cy.location('pathname').should('match', /^\/pedidos\/[0-9a-f-]+$/).then(path => {
          const pedidoId = path.split('/').pop()!
          cy.request('/api/pedidos/' + pedidoId).then(({ body }) => {
            expect(body.payments).to.have.length(0)
            expect(body.couponCodes).to.include.members([cupomA.codigo, cupomB.codigo])
            expect(body.creditCouponCode).to.match(/^SALDO-/)
            cy.visit('/cupons')
            cy.contains('article', body.creditCouponCode).should('contain', 'Disponível').and('contain', '15,10')
          })
        })
      }))
    ))
  })
})
