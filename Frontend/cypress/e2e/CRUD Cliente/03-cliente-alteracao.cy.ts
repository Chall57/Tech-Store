/// <reference types="cypress" />
import { apiCustomer, fill, selectProfile, submit } from '../../support/data'

describe('Fluxo 03 — cliente altera os próprios dados', () => {
  it('RF0022 — altera dados pela própria conta e comprova a persistência', () => {
    apiCustomer().then(cliente => {
      const novoNome = cliente.nome + ' Alterado'
      selectProfile(cliente.id)
      cy.location('pathname').should('eq', '/conta')
      cy.intercept('PUT', '**/api/clientes/' + cliente.id).as('alterarCliente')
      cy.contains('button', 'Editar dados').click()
      cy.get('form[aria-label="Alterar dados pessoais"]').within(() => {
        fill({ nome: novoNome, telefone: '988887777' })
        submit()
      })
      cy.wait('@alterarCliente').its('response.statusCode').should('eq', 200)
      cy.location('pathname').should('eq', '/conta')
      cy.location('pathname').should('not.contain', '/admin')
      cy.contains('h2', novoNome).should('be.visible')
      cy.reload()
      cy.get('input[value="988887777"]').should('exist')
      cy.request('/api/clientes/' + cliente.id).then(({ body }) => {
        expect(body.nome).to.eq(novoNome)
        expect(body.telefone).to.eq('988887777')
        expect(body.id).to.eq(cliente.id)
      })
    })
  })
})
