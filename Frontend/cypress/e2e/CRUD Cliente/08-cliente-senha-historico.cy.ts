/// <reference types="cypress" />
import { apiCustomer, fill, selectProfile, submit } from '../../support/data'

describe('Fluxo 08 — senha, transações e ranking do cliente', () => {
  it('RF0028 e RNF0031–RNF0033 — altera somente a senha', () => {
    apiCustomer().then(cliente => {
      selectProfile(cliente.id)
      cy.contains('button', 'Alterar senha').click()
      cy.get('form[aria-label="Alterar senha"]').within(() => {
        fill({ senha: 'Nova@Senha2026', confirmacaoSenha: 'Nova@Senha2026' })
        submit()
      })
      cy.contains('Senha alterada com sucesso.').should('be.visible')
      cy.request('/api/clientes/' + cliente.id).then(({ body }) => {
        expect(body.nome).to.eq(cliente.nome)
        expect(body).not.to.have.any.keys('senha', 'senhaHash', 'confirmacaoSenha')
      })
    })
  })

  it('RF0025 e RN0027 — consulta transações e ranking persistidos de Lucas', () => {
    cy.task('prepararPerfilLucas', null, { timeout: 65000 })
    cy.request('/api/clientes?email=lucas.paulino%40techstore.test').then(({ body }) => {
      expect(body).to.have.length(1)
      expect(body[0].ranking).to.eq(3)
      selectProfile(body[0].id)
      cy.contains('h2', 'Lucas Paulino').should('be.visible')
      cy.get('[aria-label="Histórico de atividades"] li').should('have.length.greaterThan', 10)
      cy.get('[aria-labelledby="customer-transactions-heading"]').within(() => {
        cy.contains(/Pedido \d+/).should('be.visible')
        cy.contains(/Pagamento/).should('be.visible')
        cy.contains(/Cupom/).should('be.visible')
      })
    })
  })
})
