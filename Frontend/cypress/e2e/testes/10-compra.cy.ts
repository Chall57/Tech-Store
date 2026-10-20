/// <reference types="cypress" />
import { apiCoupon, apiCustomer, apiProduct, fill, comprarPeloCatalogo, submit } from '../../support/data'

function adicionarCartao(numero: string, bandeira: string) {
  cy.contains('button', 'Adicionar cartão').click()
  cy.get('form[aria-label="Novo cartão para compra"]').within(() => {
    fill({ bandeira, titular: 'CLIENTE CYPRESS', validade: '12/39', numeroCartao: numero, codigoSeguranca: '123' })
    submit('Salvar e selecionar cartão')
  })
}

describe('Fluxo 10 — realização da compra', () => {
  it('RF0033–RF0038, RN0033 e RN0034 — finaliza com endereço, cupom e dois cartões', () => {
    apiCustomer().then(cliente => apiProduct(100).then(produto => apiCoupon(cliente.id, 20, 'Promocional').then(cupom => {
      comprarPeloCatalogo(cliente.id, produto)
      cy.contains('a', 'Finalizar compra').click()
      cy.get('[data-testid="checkout-item"] img').should('have.attr', 'alt', produto.nome).and('be.visible')

      cy.contains('button', 'Adicionar endereço').click()
      cy.get('form[aria-label="Novo endereço de entrega"]').within(() => {
        fill({
          enderecoNome: 'Entrega Cypress', tipoResidencia: 'Casa', tipoLogradouro: 'Rua',
          logradouro: 'Compra Completa', numero: '42', bairro: 'Centro', cep: '07400000',
          cidade: 'Arujá', estado: 'SP', pais: 'Brasil',
        })
        submit('Salvar e selecionar endereço')
      })
      adicionarCartao('4111111111111111', 'Visa')
      adicionarCartao('5555555555554444', 'Mastercard')
      cy.contains('label', cupom.codigo).find('input').check()
      cy.get('[aria-label="Valor no cartão final 1111"]').clear().type('31.23')
      cy.get('[aria-label="Valor no cartão final 4444"]').clear().type('63.67')
      cy.contains('.order-summary p', 'Restante a distribuir').should('contain', '0,00')
      cy.contains('button', /^Finalizar compra$/).click()

      cy.location('pathname').should('match', /^\/pedidos\/[0-9a-f-]+$/).then(path => {
        const pedidoId = path.split('/').pop()!
        cy.contains('.status', 'EM PROCESSAMENTO').should('be.visible')
        cy.reload()
        cy.request('/api/pedidos/' + pedidoId).then(({ body }) => {
          expect(body.total).to.eq(114.90)
          expect(body.desconto).to.eq(20)
          expect(body.payments).to.have.length(2)
          expect(body.payments.reduce((soma: number, pagamento: { amount: number }) => soma + pagamento.amount, 0)).to.eq(94.90)
          expect(body.couponCodes).to.include(cupom.codigo)
        })
        cy.request('/api/clientes/' + cliente.id + '/carrinho').its('body').should('have.length', 0)
        cy.request('/api/produtos/' + produto.id).its('body.quantidade').should('eq', 10)
      })
    })))
  })
})
