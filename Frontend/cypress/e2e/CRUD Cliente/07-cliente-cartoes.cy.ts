/// <reference types="cypress" />
import { apiCustomer, fill, selectProfile, submit } from '../../support/data'

describe('Fluxo 07 — cartões do cliente', () => {
  it('RF0027, RN0024 e RN0025 — mantém múltiplos cartões e um único preferencial', () => {
    apiCustomer().then(cliente => {
      selectProfile(cliente.id, '/conta/cartoes')
      cy.location('pathname').should('eq', '/conta/cartoes')

      const adicionarCartao = (numero: string, bandeira: string) => {
        cy.contains('button', 'Novo cartão').click()
        cy.get('form[aria-label="Adicionar cartão"]').within(() => {
          fill({ bandeira, titular: 'CLIENTE TESTE', validade: '12/39', numeroCartao: numero, codigoSeguranca: '123' })
          submit()
        })
      }

      adicionarCartao('4111111111111111', 'Visa')
      cy.contains('article', '1111').should('contain', 'Cartão preferencial')
      adicionarCartao('5555555555554444', 'Mastercard')
      cy.contains('article', '4444').within(() => cy.contains('button', 'Tornar preferencial').click())
      cy.reload()
      cy.contains('article', '4444').should('contain', 'Cartão preferencial')
      cy.contains('article', '1111').should('not.contain', 'Cartão preferencial')
      cy.request('/api/clientes/' + cliente.id + '/cartoes').then(({ body }) => {
        expect(body).to.have.length(2)
        expect(body.filter((cartao: { preferencial: boolean }) => cartao.preferencial)).to.have.length(1)
        expect(body[0]).not.to.have.any.keys('numero', 'codigoSeguranca', 'impressaoDigital')
        expect(JSON.stringify(body)).not.to.include('4111111111111111')
      })
    })
  })
})
