/// <reference types="cypress" />
import { apiCustomer, apiProduct, selectProfile, mostrarProdutoNoCatalogo } from '../../support/data'
import type { Produto } from '../../../src/services/produtoService'

describe('Interface — legibilidade e carregamento', () => {
  it('RN0044/RNF0042 — desabilita finalizar compra ao expirar o relógio da reserva', () => {
    apiCustomer().then(cliente => apiProduct().then(produto => {
      selectProfile(cliente.id, '/')
      cy.get('[data-product-id="' + produto.id + '"]').find('button').click()
      cy.get('.cart-action b').should('have.text', '1')
      cy.visit('/carrinho')
      cy.contains('a', /^Finalizar compra$/).should('have.attr', 'aria-disabled', 'false')
      // Avança somente a data da interface. A expiração no servidor tem teste de integração próprio.
      cy.clock(Date.now(), ['Date'])
      cy.tick(31 * 60 * 1000)
      cy.contains('a', /^Finalizar compra$/).should('have.attr', 'aria-disabled', 'true').and('have.attr', 'href', '/carrinho')
      cy.screenshot('carrinho-reserva-expirada', { capture: 'viewport' })
    }))
  })
  it('exibe catálogo real e navegação sem sobreposição nas larguras desktop', () => {
    cy.request('/actuator/health').its('body.status').should('eq', 'UP')
    cy.visit('/')
    cy.contains('h1', /Componentes para montar/).should('be.visible')
    cy.get('body').should('have.css', 'font-size', '18px')
    cy.get('.catalog-hero h1').should('have.css', 'font-size', '45px')
    cy.get('.not-found, vite-error-overlay').should('not.exist')
    for (const width of [1680, 1280]) {
      cy.viewport(width, 1050)
      cy.get('.store-header__main').then(header => {
        const children = [...header[0].children].map(child => child.getBoundingClientRect())
        for (let i = 1; i < children.length; i++) expect(children[i].left).to.be.at.least(children[i - 1].right)
      })
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(width))
      cy.screenshot('catalogo-fontes-desktop-' + width, { capture: 'viewport' })
    }
    cy.get('nav[aria-label="Navegação principal"]').contains('a', /^Conta$/i).click()
    cy.location('pathname').should('eq', '/conta')
    cy.get('.not-found').should('not.exist')
  })
  it('mostra o spinner enquanto a API real carrega um produto, sem piscar a tela 404', () => {
    apiCustomer().then(cliente => apiProduct().then(produto => {
      // Atrasa apenas a entrega da resposta real para observar o estado de carregamento.
      cy.intercept('GET', '**/api/produtos', request => request.continue(response => { response.setDelay(3500) })).as('catalogoLento')
      selectProfile(cliente.id, '/produtos/' + produto.id)
      cy.get('[role="progressbar"][aria-label="Carregando produto..."]').should('be.visible')
      cy.get('.not-found').should('not.exist')
      cy.screenshot('produto-carregando', { capture: 'viewport' })
      cy.wait('@catalogoLento').its('response.statusCode').should('eq', 200)
      cy.contains('.detail-info h1', produto.nome).should('be.visible')
      cy.get('.not-found').should('not.exist')
      cy.screenshot('produto-carregado', { capture: 'viewport' })
    }))
  })
  it('prioriza hardware com nomes comerciais na primeira fileira do catálogo', () => {
    const produtos: Produto[] = []
    for (let indice = 0; indice < 4; indice++) {
      apiProduct(150, indice % 2 === 0 ? 'rtx5070' : 'rx9070xt').then(produto => { produtos.push(produto) })
    }
    apiCustomer().then(cliente => {
      cy.request<Produto[]>('/api/produtos').then(({ body }) => {
        expect(body.slice(0, 4).map(produto => produto.id)).to.deep.eq(produtos.map(produto => produto.id).reverse())
      })
      selectProfile(cliente.id, '/')
      mostrarProdutoNoCatalogo(produtos[0])
      mostrarProdutoNoCatalogo(produtos[1])
      cy.get('.book-grid .book-card').first().then(card => {
        const primeiraFileira = card[0].getBoundingClientRect()
        // A rolagem não passa da primeira fileira para alcançar produtos antigos.
        expect(primeiraFileira.top).to.be.at.least(0)
        expect(primeiraFileira.bottom).to.be.at.most(1050)
      })
      cy.get('.book-grid .book-card').each((card, indice) => {
        if (indice < 4) cy.wrap(card).find('h3').should('not.contain', 'Cypress')
      })
      cy.screenshot('catalogo-primeira-fileira', { capture: 'viewport' })
    })
  })
  it('permite selecionar um produto na segunda fileira sem percorrer o restante do catálogo', () => {
    apiProduct().then(produto => {
      for (let indice = 0; indice < 4; indice++) apiProduct(150, indice % 2 === 0 ? 'rtx5070' : 'rx9070xt')
      apiCustomer().then(cliente => {
        selectProfile(cliente.id, '/')
        mostrarProdutoNoCatalogo(produto)
        cy.get('[data-product-id="' + produto.id + '"]').should('be.visible')
        cy.window().then(win => {
          const primeiro = win.document.querySelector<HTMLElement>('.book-grid .book-card')!
          const selecionado = win.document.querySelector<HTMLElement>('[data-product-id="' + produto.id + '"]')!
          expect(selecionado.offsetTop).to.be.greaterThan(primeiro.offsetTop)
          expect(win.scrollY, 'rolagem limitada ao produto próximo do início').to.be.lessThan(primeiro.offsetTop + primeiro.offsetHeight * 2)
        })
        cy.screenshot('catalogo-proximo-da-primeira-fileira', { capture: 'viewport' })
      })
    })
  })
})
