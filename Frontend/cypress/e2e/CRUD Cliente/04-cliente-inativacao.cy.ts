/// <reference types="cypress" />
import { apiCustomer, selectProfile, submit } from '../../support/data'

describe('Fluxo 04 — cliente inativa a própria conta sem exclusão física', () => {
  it('RF0023 — inativa, mantém os dados consultáveis e permite reativação', () => {
    apiCustomer().then(cliente => {
      selectProfile(cliente.id)
      cy.location('pathname').should('eq', '/conta')
      cy.contains('button', 'Excluir cliente').should('not.exist')
      cy.intercept('PATCH', '**/api/clientes/' + cliente.id + '/inativar').as('inativarCliente')
      cy.contains('button', 'Inativar cliente').click()
      submit('Confirmar inativação')
      cy.wait('@inativarCliente').its('response.statusCode').should('eq', 200)
      cy.contains('button', 'Reativar cliente').should('be.visible')
      cy.reload()
      cy.get('input[value="Inativo"]').should('exist')
      cy.request('/api/clientes/' + cliente.id).then(({ body }) => {
        expect(body.id).to.eq(cliente.id)
        expect(body.ativo).to.eq(false)
        expect(body.nome).to.eq(cliente.nome)
      })
      cy.location('pathname').should('eq', '/conta')
      cy.location('pathname').should('not.contain', '/admin')

      cy.intercept('PATCH', '**/api/clientes/' + cliente.id + '/ativar').as('reativarCliente')
      cy.contains('button', 'Reativar cliente').click()
      submit('Confirmar reativação')
      cy.wait('@reativarCliente').its('response.statusCode').should('eq', 200)
      cy.request('/api/clientes/' + cliente.id).its('body.ativo').should('eq', true)
    })
  })
})
