/// <reference types="cypress" />
import { apiCustomer, customer, fill, registration, submit } from '../../support/data'

describe('Fluxo 05 — validações do cadastro de cliente', () => {
  it('RN0026 — rejeita campos obrigatórios vazios e CPF inválido', () => {
    cy.visit('/clientes/novo')
    submit('Cadastrar e acessar conta')
    cy.get('#editor-nome').then($input => {
      expect(($input[0] as HTMLInputElement).validity.valueMissing).to.eq(true)
    })
    registration({ ...customer(), cpf: '11111111111' })
    submit('Cadastrar e acessar conta')
    cy.contains('[role="alert"]', 'CPF inválido.').should('be.visible')
  })

  it('RNF0031 e RNF0032 — rejeita senha fraca e confirmação divergente', () => {
    registration({ ...customer(), senha: 'fraca', confirmacaoSenha: 'fraca' })
    submit('Cadastrar e acessar conta')
    cy.contains('[role="alert"]', 'Senha deve ter pelo menos 8 caracteres').should('be.visible')
    fill({ senha: 'Forte@2026', confirmacaoSenha: 'Diferente@2026' })
    submit('Cadastrar e acessar conta')
    cy.contains('[role="alert"]', 'A confirmação de senha não confere.').should('be.visible')
  })

  it('Unicidade — rejeita CPF e e-mail já cadastrados', () => {
    apiCustomer().then(cliente => {
      registration({ ...customer(), cpf: cliente.cpf })
      submit('Cadastrar e acessar conta')
      cy.contains('[role="alert"]', 'CPF já cadastrado.').should('be.visible')
      registration({ ...customer(), email: cliente.email })
      submit('Cadastrar e acessar conta')
      cy.contains('[role="alert"]', 'E-mail já cadastrado.').should('be.visible')
    })
  })
})
