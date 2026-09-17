/// <reference types="cypress" />
import { digits, customer, fill, registration, apiCustomer, selectProfile, submit } from '../support/data'

describe('Cliente real — DRS LES 2 2026', () => {
  it('RF0021 RF0022 RF0023 RF0024 RN0026 RNF0035 — cadastra, consulta, altera, inativa e reativa pela interface', () => {
    const data = registration()
    cy.scrollTo('top')
    cy.screenshot('cadastro-preenchido', { capture: 'viewport' })
    cy.intercept('POST', '**/api/clientes').as('cadastro')
    submit('Cadastrar e consultar')
    cy.wait('@cadastro').then(({ response }) => {
      expect(response?.statusCode).to.eq(201)
      expect(response?.body).not.to.have.any.keys('senha', 'senhaHash', 'confirmacaoSenha')
      const id = response?.body.id
      cy.url().should('include', '/admin/clientes?cliente=')
      cy.contains('h2', 'Cliente: ' + data.nome).should('be.visible')
      cy.reload()
      cy.contains('h2', 'Cliente: ' + data.nome).should('be.visible')
      cy.contains('button', 'Editar dados').click()
      cy.get('form[aria-label="Alterar dados pessoais"]').within(() => { fill({ nome: data.nome + ' Alterado', telefone: '988887777' }); submit() })
      cy.contains('h2', 'Cliente: ' + data.nome + ' Alterado').should('be.visible')
      cy.reload()
      cy.get('input[value="988887777"]').should('exist')
      cy.contains('button', 'Inativar cliente').click()
      submit('Confirmar inativação')
      cy.contains('button', 'Reativar cliente').should('be.visible')
      cy.reload()
      cy.request('/api/clientes/' + id).its('body.ativo').should('eq', false)
      cy.contains('button', 'Reativar cliente').click()
      submit('Confirmar reativação')
      cy.contains('button', 'Inativar cliente').should('be.visible')
      cy.request('/api/clientes/' + id).its('body.ativo').should('eq', true)
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth))
      cy.scrollTo('top')
      cy.screenshot('cliente-crud-concluido', { capture: 'viewport' })
    })
  })

  it('RF0024 RF0025 — filtros isolados e combinados e ficha com transações reais', () => {
    apiCustomer().then(c => {
      cy.visit('/admin/clientes')
      cy.get('form[aria-label="Filtros de clientes"]').within(() => { fill({ nome: c.nome, email: c.email }); submit('Consultar clientes') })
      cy.get('tbody tr').should('have.length', 1).and('contain', c.nome)
      cy.contains('button', 'Consultar / alterar').click()
      cy.contains('h2', 'Cliente: ' + c.nome).should('be.visible')
      cy.contains('Nenhuma transação registrada para este cliente.').should('be.visible')
      cy.get('form[aria-label="Filtros de clientes"]').within(() => {
        cy.get('[name="email"]').clear().type('nao-existe@techstore.test')
        submit('Consultar clientes')
      })
      cy.contains('Nenhum cliente encontrado.').should('be.visible')
      cy.get('form[aria-label="Filtros de clientes"]').within(() => {
        cy.get('[name="nome"]').clear(); cy.get('[name="email"]').clear()
        fill({ cpf: c.cpf }); submit('Consultar clientes')
      })
      cy.get('tbody tr').should('have.length', 1).and('contain', c.nome)
    })
  })

  it('RN0026 — impede campos obrigatórios vazios e CPF inválido', () => {
    cy.visit('/clientes/novo')
    submit('Cadastrar e consultar')
    cy.get('#editor-nome').then($input => expect(($input[0] as HTMLInputElement).validity.valueMissing).to.eq(true))
    registration({ ...customer(), cpf: '11111111111' })
    submit('Cadastrar e consultar')
    cy.contains('[role="alert"]', 'CPF inválido.').should('be.visible')
    cy.url().should('include', '/clientes/novo')
  })

  it('RNF0031 RNF0032 — exige senha forte e confirmação coincidente', () => {
    registration({ ...customer(), senha: 'fraca', confirmacaoSenha: 'fraca' })
    submit('Cadastrar e consultar')
    cy.contains('[role="alert"]', 'Senha deve ter pelo menos 8 caracteres').should('be.visible')
    fill({ senha: 'Forte@2026', confirmacaoSenha: 'Diferente@2026' })
    submit('Cadastrar e consultar')
    cy.contains('[role="alert"]', 'A confirmação de senha não confere.').should('be.visible')
  })

  it('Unicidade — mensagens de CPF e e-mail duplicados no cadastro', () => {
    apiCustomer().then(c => {
      registration({ ...customer(), cpf: c.cpf })
      submit('Cadastrar e consultar')
      cy.contains('[role="alert"]', 'CPF já cadastrado.').should('be.visible')
      fill({ cpf: digits(), email: c.email })
      submit('Cadastrar e consultar')
      cy.contains('[role="alert"]', 'E-mail já cadastrado.').should('be.visible')
    })
  })

  it('RF0026 RN0021 RN0022 RN0023 RNF0034 — mantém endereços obrigatórios e permite edição independente', () => {
    apiCustomer().then(c => {
      selectProfile(c.id, '/conta/enderecos')
      cy.contains('article', 'Residência').within(() => cy.contains('button', 'Excluir').click())
      cy.contains('Mantenha pelo menos um endereço residencial.').should('be.visible')
      cy.contains('button', 'Novo endereço').click()
      cy.get('form[aria-label="Adicionar endereço"]').within(() => {
        fill({ enderecoNome: 'Trabalho', tipoResidencia: 'Outro', tipoLogradouro: 'Avenida', logradouro: 'Dos Testes', numero: '200', bairro: 'Centro', cep: '08710200', cidade: 'Mogi das Cruzes', estado: 'SP', pais: 'Brasil' })
        cy.get('[name="entrega"]').check()
        submit()
      })
      cy.contains('article', 'Trabalho').should('be.visible')
      cy.reload()
      cy.contains('article', 'Trabalho').within(() => cy.contains('button', 'Editar').click())
      cy.get('form[aria-label="Editar endereço"]').within(() => { fill({ numero: '201' }); submit() })
      cy.contains('article', 'Trabalho').should('contain', '201')
      cy.reload()
      cy.contains('article', 'Trabalho').should('contain', '201').within(() => cy.contains('button', 'Excluir').click())
      cy.contains('article', 'Trabalho').should('not.exist')
      cy.request('/api/clientes/' + c.id + '/enderecos').its('body').should('have.length', 1)
      cy.request('/api/clientes/' + c.id).its('body.nome').should('eq', c.nome)
    })
  })

  it('RN0021 RN0022 RN0026 — cadastro atômico rejeita falta de endereço obrigatório', () => {
    const data = registration()
    cy.get('[name="cobranca"]').uncheck()
    submit('Cadastrar e consultar')
    cy.contains('[role="alert"]', 'Mantenha pelo menos um endereço de cobrança.').should('be.visible')
    cy.request('/api/clientes?cpf=' + data.cpf).its('body').should('have.length', 0)
  })

  it('RF0027 RN0024 RN0025 — cartões reais, preferência única, duplicidade e nenhuma exposição de PAN/CVV', () => {
    apiCustomer().then(c => {
      selectProfile(c.id, '/conta/cartoes')
      function addCard(numero: string, bandeira: string) {
        cy.contains('button', 'Novo cartão').click()
        cy.get('form[aria-label="Adicionar cartão"]').within(() => { fill({ bandeira, titular: 'CLIENTE TESTE', validade: '12/39', numeroCartao: numero, codigoSeguranca: '123' }); submit() })
      }
      addCard('4111111111111111', 'Visa')
      cy.contains('article', '1111').should('contain', 'Cartão preferencial')
      addCard('5555555555554444', 'Mastercard')
      cy.contains('article', '4444').within(() => cy.contains('button', 'Tornar preferencial').click())
      cy.reload()
      cy.contains('article', '4444').should('contain', 'Cartão preferencial')
      cy.contains('article', '1111').should('not.contain', 'Cartão preferencial')
      addCard('4111111111111111', 'Visa')
      cy.contains('[role="alert"]', 'Este cartão já está cadastrado').should('be.visible')
      cy.get('form[aria-label="Adicionar cartão"]').within(() => cy.contains('button', 'Cancelar').click())
      cy.contains('article', '4444').within(() => cy.contains('button', 'Excluir').click())
      cy.contains('article', '1111').should('contain', 'Cartão preferencial')
      cy.request('/api/clientes/' + c.id + '/cartoes').then(response => {
        expect(response.body).to.have.length(1)
        expect(response.body[0]).not.to.have.any.keys('numero', 'codigoSeguranca', 'impressaoDigital')
        expect(JSON.stringify(response.body)).not.to.include('4111111111111111')
      })
    })
  })

  it('RN0024 — rejeita número de cartão inválido e CVV incompleto', () => {
    apiCustomer().then(c => {
      selectProfile(c.id, '/conta/cartoes')
      cy.contains('button', 'Novo cartão').click()
      fill({ bandeira: 'Visa', titular: 'CLIENTE TESTE', validade: '12/39', numeroCartao: '4111111111111112', codigoSeguranca: '123' })
      submit()
      cy.contains('[role="alert"]', 'Número de cartão inválido.').should('be.visible')
      fill({ numeroCartao: '4111111111111111', codigoSeguranca: '1' })
      submit()
      cy.contains('[role="alert"]', 'Código de segurança deve conter 3 ou 4 dígitos.').should('be.visible')
    })
  })

  it('RF0028 RNF0031 RNF0032 RNF0033 — altera somente a senha sem alterar dados pessoais', () => {
    apiCustomer().then(c => {
      selectProfile(c.id)
      cy.contains('button', 'Alterar senha').click()
      cy.get('form[aria-label="Alterar senha"]').within(() => { fill({ senha: 'Nova@Senha2026', confirmacaoSenha: 'Outra@Senha2026' }); submit() })
      cy.contains('[role="alert"]', 'A confirmação de senha não confere.').should('be.visible')
      cy.get('form[aria-label="Alterar senha"]').within(() => { fill({ confirmacaoSenha: 'Nova@Senha2026' }); submit() })
      cy.contains('Senha alterada com sucesso.').should('be.visible')
      cy.reload()
      cy.contains('h2', c.nome).should('be.visible')
      cy.request('/api/clientes/' + c.id).then(response => {
        expect(response.body.nome).to.eq(c.nome)
        expect(response.body).not.to.have.any.keys('senha', 'senhaHash')
      })
    })
  })

  it('Tratamento de erro — não troca uma falha da API por clientes fictícios', () => {
    cy.intercept('GET', '**/api/clientes/perfis', { statusCode: 500, body: { message: 'Falha controlada de teste.' } }).as('falhaPerfis')
    cy.visit('/perfis')
    cy.wait('@falhaPerfis')
    cy.contains('[role="alert"]', 'Falha controlada de teste.').should('be.visible')
    cy.get('.profile-card').should('have.length', 2)
  })
})
