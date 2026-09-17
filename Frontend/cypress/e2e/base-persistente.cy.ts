/// <reference types="cypress" />
import { apiCustomer, fill, selectProfile, submit } from '../support/data'

function product() {
  return cy.request('/api/dominios/catalogo').then(r => {
    const data = { nome: 'GPU Cypress ' + Date.now(), marca: 'Teste', descricao: 'Produto de teste persistido',
      imagem: '/images/products/rtx-5070-12gb.png', preco: 150, custo: 100, ativo: true, quantidade: 10,
      grupoPrecificacaoId: r.body.grupos.find((g: { nome: string }) => g.nome === 'Padrão').id,
      categorias: [r.body.categorias.find((c: { nome: string }) => c.nome === 'Placas de vídeo').id] }
    return cy.request('POST', '/api/produtos', data).then(response => response.body)
  })
}
describe('Base persistente dos módulos auxiliares', () => {
  it('Produto — cadastra pela tela, consulta, altera e deriva disponibilidade do estoque', () => {
    const name = 'Hardware interface ' + Date.now()
    cy.visit('/admin/produtos')
    cy.contains('button', 'Cadastrar produto').click()
    cy.get('form[aria-label="Cadastrar produto"]').within(() => {
      fill({ nome: name, marca: 'Teste', descricao: 'Hardware de teste', imagem: '/images/products/rtx-5070-12gb.png', preco: '150.50', custo: '100', quantidade: '10', grupo: 'Padrão' })
      cy.contains('label', 'Placas de vídeo').find('input[type="checkbox"]').check()
      submit()
    })
    cy.contains('tbody tr', name).should('contain', 'Ativo').within(() => cy.contains('button', 'Editar').click())
    cy.get('form[aria-label="Editar produto"]').within(() => {
      cy.get('[name="ativo"]').uncheck(); fill({ justificativa: 'Descontinuação fictícia', categoriaStatus: 'Descontinuação' }); submit()
    })
    cy.reload()
    cy.contains('tbody tr', name).should('contain', 'Inativo').within(() => cy.contains('button', 'Editar').click())
    cy.get('form[aria-label="Editar produto"]').within(() => {
      cy.get('[name="ativo"]').check(); fill({ quantidade: '0', justificativa: 'Retorno ao catálogo', categoriaStatus: 'Retorno ao catálogo' }); submit()
    })
    cy.contains('tbody tr', name).should('contain', 'Sem estoque')
    cy.visit('/')
    cy.contains('article', name).find('button').should('be.disabled')
    cy.request('/api/produtos').then(r => {
      const p = r.body.find((item: { nome: string }) => item.nome === name)
      expect(p.quantidade).to.eq(0); expect(p.ativo).to.eq(true); expect(p.preco).to.eq(150.50)
    })
  })
  it('Carrinho — persiste por cliente e soma cliques consecutivos sem perder quantidade', () => {
    apiCustomer().then(a => apiCustomer().then(b => product().then(p => {
      selectProfile(a.id, '/')
      cy.contains('article', p.nome).find('button').dblclick()
      cy.contains('Produto adicionado ao carrinho.').should('be.visible')
      cy.visit('/carrinho')
      cy.get('.cart-line select').should('have.value', '2').select('3')
      cy.contains('Carrinho atualizado.').should('be.visible')
      cy.reload()
      cy.get('.cart-line select').should('have.value', '3')
      selectProfile(b.id, '/carrinho')
      cy.contains('Seu carrinho está vazio.').should('be.visible')
      cy.request('/api/clientes/' + a.id + '/carrinho').its('body.0.quantity').should('eq', 3)
      cy.request('/api/clientes/' + b.id + '/carrinho').its('body').should('have.length', 0)
    })))
  })
  it('RF0025 — cupom de troca só aparece no cliente vinculado e na sua ficha', () => {
    apiCustomer().then(a => apiCustomer().then(b => {
      const code = 'TROCA-TESTE-' + Date.now()
      cy.request('POST', '/api/cupons', { codigo: code, tipo: 'Troca', valor: 50, validade: '2039-12-31', clienteId: a.id }).its('status').should('eq', 201)
      selectProfile(a.id, '/cupons')
      cy.contains('article', code).should('be.visible')
      cy.visit('/conta')
      cy.contains('Cupom ' + code).should('be.visible')
      selectProfile(b.id, '/cupons')
      cy.contains(code).should('not.exist')
      cy.request('/api/clientes/' + b.id + '/cupons').then(r => expect(r.body.map((c: { code: string }) => c.code)).not.to.include(code))
    }))
  })
})
