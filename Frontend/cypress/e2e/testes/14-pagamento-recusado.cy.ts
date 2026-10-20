/// <reference types="cypress" />
import { apiCard, apiCoupon, apiCustomer, apiProduct, comprarPeloCatalogo } from '../../support/data'

describe('Fluxo 14 — pagamento simulado recusado', () => {
  it('RN0028 e RN0038 — não baixa estoque e libera reserva e cupom', () => {
    apiCustomer().then(cliente => apiProduct(100).then(produto =>
      apiCard(cliente.id, '4000000000000002').then(() => apiCoupon(cliente.id, 20).then(cupom => {
        comprarPeloCatalogo(cliente.id, produto)
        cy.contains('a', /^Finalizar compra$/).click()
        cy.contains('label', cupom.codigo).find('input').check()
        cy.contains('button', /^Finalizar compra$/).click()

        cy.location('pathname').should('match', /^\/pedidos\/[0-9a-f-]+$/).then(path => {
          const pedidoId = path.split('/').pop()!
          cy.contains('.status', 'EM PROCESSAMENTO').should('be.visible')
          cy.contains('button', 'Processar pagamento').click()
          cy.contains('.status', 'REPROVADA').should('be.visible')
          cy.contains('Pagamento reprovado.').should('be.visible')
          cy.request('/api/produtos/' + produto.id).then(({ body }) => {
            expect(body.quantidade).to.eq(10)
            expect(body.reservado).to.eq(0)
          })
          cy.request('/api/clientes/' + cliente.id + '/cupons').then(({ body }) => {
            expect(body.find((item: { id: string }) => item.id === cupom.id).status).to.eq('Disponível')
          })
          cy.request('/api/pedidos/' + pedidoId).its('body.payments.0.status').should('eq', 'REPROVADO')
        })
      }))
    ))
  })
})
