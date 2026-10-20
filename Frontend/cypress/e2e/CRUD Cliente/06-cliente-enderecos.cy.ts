/// <reference types="cypress" />
import { apiCustomer, fill, selectProfile, submit } from '../../support/data'

describe('Fluxo 06 — endereços do cliente', () => {
  it('RF0026, RN0021–RN0023 e RNF0034 — cadastra e altera endereço independentemente', () => {
    apiCustomer().then(cliente => {
      selectProfile(cliente.id, '/conta/enderecos')
      cy.location('pathname').should('eq', '/conta/enderecos')
      cy.contains('article', 'Residência').within(() => cy.contains('button', 'Excluir').click())
      cy.contains('Mantenha pelo menos um endereço residencial.').should('be.visible')
      cy.contains('button', 'Novo endereço').click()
      cy.get('form[aria-label="Adicionar endereço"]').within(() => {
        fill({
          enderecoNome: 'Trabalho', tipoResidencia: 'Outro', tipoLogradouro: 'Avenida',
          logradouro: 'Dos Testes', numero: '200', bairro: 'Centro', cep: '08710200',
          cidade: 'Mogi das Cruzes', estado: 'SP', pais: 'Brasil',
        })
        cy.get('[name="entrega"]').check()
        submit()
      })
      cy.contains('article', 'Trabalho').should('be.visible')
      cy.reload()
      cy.contains('article', 'Trabalho').within(() => cy.contains('button', 'Editar').click())
      cy.get('form[aria-label="Editar endereço"]').within(() => {
        fill({ numero: '201' })
        submit()
      })
      cy.contains('article', 'Trabalho').should('contain', '201')
      cy.request('/api/clientes/' + cliente.id).its('body.nome').should('eq', cliente.nome)
    })
  })
})
