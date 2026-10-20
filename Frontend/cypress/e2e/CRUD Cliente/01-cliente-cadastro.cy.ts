/// <reference types="cypress" />
import { registerCustomerThroughUi } from '../../support/data'

describe('Fluxo 01 — cliente realiza o próprio cadastro', () => {
  it('RF0021 | RN0021–RN0023, RN0026 | RNF0031–RNF0033, RNF0035', () => {
    registerCustomerThroughUi().then(cliente => {
      cy.location('pathname').should('eq', '/conta')
      cy.location('pathname').should('not.contain', '/admin')
      cy.contains('h1', 'Dados pessoais').should('be.visible')
      cy.contains('h2', cliente.nome).should('be.visible')
      cy.get('input[value="' + cliente.id + '"]').should('exist')
      cy.get('input[value="Ativo"]').should('exist')
      cy.reload()
      cy.contains('h2', cliente.nome).should('be.visible')
      cy.request('/api/clientes/' + cliente.id).then(({ body }) => {
        expect(body.cpf).to.eq(cliente.cpf)
        expect(body).not.to.have.any.keys('senha', 'senhaHash', 'confirmacaoSenha')
      })
    })
  })
})
