import { prepararPedido, iniciarCarrinho } from '../../support/pedido'
import { apiCustomer, mostrarProdutoNoCatalogo, selectProfile } from '../../support/data'

describe('Vendas 01 — carrinho e disponibilidade', () => {
  it('[RF0031][RF0032][RN0031][RN0044][RN0045] inclui vários itens, altera, remove e libera a reserva sem baixar estoque físico', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base, true)
      cy.request('/api/produtos/' + base.produtos[0].id).then(({ body }) => {
        expect(body.quantidade).to.eq(base.produtos[0].quantidade)
        expect(body.reservado).to.eq(3)
      })
      cy.intercept('PUT', '**/carrinho/itens/*').as('vendaRemover')
      cy.contains('.cart-line', base.produtos[1].nome).contains('button', 'Remover').click()
      cy.wait('@vendaRemover').its('response.statusCode').should('eq', 200)
      cy.get('.cart-line').should('have.length', 1)
      cy.request('/api/produtos/' + base.produtos[1].id).its('body.reservado').should('eq', 0)
      cy.reload()
      cy.contains('.cart-line', base.produtos[0].nome).find('select').should('have.value', '3')
      cy.contains('.cart-line', base.produtos[0].nome).find('option').last().should('have.value', String(base.produtos[0].quantidade))
      cy.request({ method: 'PUT', url: `/api/clientes/${base.cliente.id}/carrinho/itens/${base.produtos[0].id}`, body: { quantidade: 999 }, failOnStatusCode: false }).its('status').should('eq', 409)
    })
  })

  it('[RN0031] exibe produto sem estoque como indisponível e rejeita sua inclusão no servidor', () => {
    prepararPedido().then(base => {
      const produto = base.produtos[0]
      cy.request('/api/produtos/' + produto.id).then(({ body }) => {
        cy.request('PUT', '/api/produtos/' + produto.id, { ...body, quantidade: 0, categorias: body.categorias.map((c: { id: string }) => c.id) })
      })
      selectProfile(base.cliente.id, '/produtos/' + produto.id)
      cy.contains('button', 'Adicionar ao carrinho').should('be.disabled')
      cy.contains('Produto indisponível').should('be.visible')
      cy.request({ method: 'POST', url: `/api/clientes/${base.cliente.id}/carrinho/itens/${produto.id}`, body: { quantidade: 1 }, failOnStatusCode: false }).its('status').should('eq', 409)
      cy.visit('/carrinho')
      cy.contains('Seu carrinho está vazio.').should('be.visible')
      cy.contains('a', /^Finalizar compra$/).should('have.attr', 'aria-disabled', 'true')
    })
  })

  it('[RN0044][RN0045][RN0031] outro cliente não consome unidades reservadas e pode comprá-las após a remoção', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base)
      apiCustomer().then(outro => {
        const produto = base.produtos[0]
        selectProfile(outro.id, '/')
        mostrarProdutoNoCatalogo(produto)
        cy.get(`[data-product-id="${produto.id}"] select option`).last().should('have.value', String(produto.quantidade - 1))
        cy.request({ method: 'POST', url: `/api/clientes/${outro.id}/carrinho/itens/${produto.id}`, body: { quantidade: produto.quantidade }, failOnStatusCode: false }).its('status').should('eq', 409)
        selectProfile(base.cliente.id, '/carrinho')
        cy.intercept('PUT', `**/carrinho/itens/${produto.id}`).as('liberarParaOutro')
        cy.contains('.cart-line', produto.nome).contains('button', 'Remover').click()
        cy.wait('@liberarParaOutro').its('response.statusCode').should('eq', 200)
        selectProfile(outro.id, '/')
        mostrarProdutoNoCatalogo(produto)
        cy.intercept('POST', `**/carrinho/itens/${produto.id}`).as('outroReserva')
        cy.get(`[data-product-id="${produto.id}"]`).within(() => {
          cy.get('select').select(String(produto.quantidade))
          cy.contains('button', 'Adicionar').click({ scrollBehavior: 'nearest' })
        })
        cy.wait('@outroReserva').its('response.statusCode').should('eq', 200)
        cy.request('/api/produtos/' + produto.id).its('body.reservado').should('eq', produto.quantidade)
      })
    })
  })
})
