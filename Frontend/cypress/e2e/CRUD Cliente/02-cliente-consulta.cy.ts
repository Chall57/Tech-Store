/// <reference types="cypress" />
import { apiCustomer, selectProfile } from '../../support/data'

describe('Fluxo 02 — cliente consulta a própria conta', () => {
  it('RF0024 — consulta os próprios dados persistidos sem acessar o administrador', () => {
    cy.intercept('GET', /\/api\/clientes\/[0-9a-f-]+$/).as('consultarCliente')
    apiCustomer().then(cliente => {
      selectProfile(cliente.id)
      cy.wait('@consultarCliente').its('response.statusCode').should('eq', 200)
      cy.location('pathname').should('eq', '/conta')
      cy.location('pathname').should('not.contain', '/admin')
      cy.contains('h1', 'Dados pessoais').should('be.visible')
      cy.contains('h2', cliente.nome).should('be.visible')
      cy.get('input[value="' + cliente.email + '"]').should('exist')
      cy.get('input[value="' + cliente.cpf + '"]').should('exist')
      cy.get('input[value="' + cliente.id + '"]').should('exist')
      cy.reload()
      cy.contains('h2', cliente.nome).should('be.visible')
    })
  })
})
