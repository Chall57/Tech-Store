/// <reference types="cypress" />
import { fill, registerCustomerThroughUi, submit } from '../../support/data'

describe('Cliente — fluxo completo do CRUD pela própria conta', () => {
  it('RF0021/RF0024/RF0022/RF0023 — cadastra, consulta, altera, inativa e reativa o mesmo cliente', () => {
    cy.log('RF0021 — cadastro pela interface, com dados e endereço obrigatórios')
    cy.intercept('GET', /\/api\/clientes\/[0-9a-f-]+$/).as('consultarCliente')
    // Um único cenário mantém o mesmo cliente durante todo o CRUD, sem depender de outro arquivo.
    registerCustomerThroughUi().then(cliente => {
      const novoNome = cliente.nome + ' Alterado'
      const novoEmail = 'crud-' + cliente.cpf + '@techstore.test'
      const consultarCadastro = (ativo: boolean, nome: string, email: string, telefone: string) => {
        cy.location('pathname').should('eq', '/conta')
        cy.contains('h1', 'Dados pessoais').should('be.visible')
        cy.contains('h2', nome).should('be.visible')
        for (const value of [cliente.id, cliente.cpf, email, telefone, ativo ? 'Ativo' : 'Inativo']) {
          cy.get('input').filter((_, input) => (input as HTMLInputElement).value === value).should('have.length.at.least', 1)
        }
        // Consulta complementar: a ação avaliada é sempre executada pelos botões da interface.
        cy.request('/api/clientes/' + cliente.id).then(({ body }) => {
          expect(body.id).to.eq(cliente.id)
          expect(body.cpf).to.eq(cliente.cpf)
          expect(body.nome).to.eq(nome)
          expect(body.email).to.eq(email)
          expect(body.telefone).to.eq(telefone)
          expect(body.ativo).to.eq(ativo)
          expect(body).not.to.have.any.keys('senha', 'senhaHash', 'confirmacaoSenha')
        })
      }

      cy.wait('@consultarCliente').its('response.statusCode').should('eq', 200)
      consultarCadastro(true, cliente.nome, cliente.email, cliente.telefone)

      cy.log('RF0024 — consulta do cadastro persistido após recarregar a própria conta')
      cy.reload()
      cy.wait('@consultarCliente').its('response.statusCode').should('eq', 200)
      consultarCadastro(true, cliente.nome, cliente.email, cliente.telefone)

      cy.log('RF0022 — alteração de nome, e-mail e telefone, preservando CPF e código')
      cy.intercept('PUT', '**/api/clientes/' + cliente.id).as('alterarCliente')
      cy.contains('button', 'Editar dados').click()
      cy.get('form[aria-label="Alterar dados pessoais"]').within(() => {
        fill({ nome: novoNome, email: novoEmail, telefone: '988887777' })
        submit()
      })
      cy.wait('@alterarCliente').its('response.statusCode').should('eq', 200)
      cy.get('form[aria-label="Alterar dados pessoais"]').should('not.exist')
      cy.reload()
      consultarCadastro(true, novoNome, novoEmail, '988887777')

      cy.log('RF0023 — inativação lógica: o mesmo cadastro continua consultável')
      cy.contains('button', 'Excluir cliente').should('not.exist')
      cy.intercept('PATCH', '**/api/clientes/' + cliente.id + '/inativar').as('inativarCliente')
      cy.contains('button', 'Inativar cliente').click()
      cy.get('form[aria-label="Inativar cliente"]').within(() => submit('Confirmar inativação'))
      cy.wait('@inativarCliente').its('response.statusCode').should('eq', 200)
      cy.contains('button', 'Reativar cliente').should('be.visible')
      cy.reload()
      consultarCadastro(false, novoNome, novoEmail, '988887777')
      cy.request('/api/clientes/' + cliente.id + '/enderecos').then(({ body }) => {
        expect(body).to.have.length(1)
        expect(body[0].logradouro).to.eq(cliente.enderecos[0].logradouro)
      })

      cy.log('Reativação — demonstra a reversibilidade sem criar outro registro')
      cy.intercept('PATCH', '**/api/clientes/' + cliente.id + '/ativar').as('reativarCliente')
      cy.contains('button', 'Reativar cliente').click()
      cy.get('form[aria-label="Reativar cliente"]').within(() => submit('Confirmar reativação'))
      cy.wait('@reativarCliente').its('response.statusCode').should('eq', 200)
      cy.contains('button', 'Inativar cliente').should('be.visible')
      cy.reload()
      consultarCadastro(true, novoNome, novoEmail, '988887777')
      cy.location('pathname').should('not.contain', '/admin')
    })
  })
})
