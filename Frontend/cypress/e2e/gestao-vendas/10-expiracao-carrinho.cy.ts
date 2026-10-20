import { abrirCarrinho, mostrarProdutoNoCatalogo } from '../../support/data'
import { iniciarCarrinho, prepararPedido } from '../../support/pedido'
import type { CartSummary } from '../../../src/services/vendaService'

describe('Vendas 10 — prazo do bloqueio e expiração real', () => {
  it('[RN0044][RN0045][RNF0042] backend remove todas as unidades ao expirar, libera estoque e bloqueia compra até nova inclusão', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base, true)
      cy.contains('a', /^Finalizar compra$/).should('have.attr', 'aria-disabled', 'false')
      // Só muda o relógio da fixture. Remoção, liberação e motivo vêm do serviço real.
      cy.task('condicionarVenda', { clienteId: base.cliente.id, operacao: 'prazo', valor: -1 }).its('aplicado').should('eq', true)
      cy.reload()
      cy.get('.cart-line').should('not.exist')
      cy.contains('Seu carrinho está vazio.').should('be.visible')
      for (const produto of base.produtos) {
        cy.contains('[role="alert"]', produto.nome).should('contain', 'Prazo de reserva de 30 minutos expirado')
        cy.request('/api/produtos/' + produto.id).then(({ body }) => {
          expect(body.quantidade).to.eq(produto.quantidade)
          expect(body.reservado).to.eq(0)
        })
      }
      cy.contains('a', /^Finalizar compra$/).should('have.attr', 'aria-disabled', 'true').and('have.attr', 'href', '/carrinho')
      cy.request<CartSummary>(`/api/clientes/${base.cliente.id}/carrinho/resumo`).then(({ body }) => {
        expect(body.items).to.have.length(0)
        expect(body.removed).to.have.length(2)
        expect(body.removed.find(i => i.productId === base.produtos[0].id)?.quantity).to.eq(3)
        expect(body.removed.find(i => i.productId === base.produtos[1].id)?.quantity).to.eq(1)
      })
      cy.screenshot('vendas-carrinho-expirado', { capture: 'viewport' })
      iniciarCarrinho(base)
      cy.get('.cart-line').should('have.length', 1)
      cy.contains('a', /^Finalizar compra$/).should('have.attr', 'aria-disabled', 'false')
      cy.request<CartSummary>(`/api/clientes/${base.cliente.id}/carrinho/resumo`).then(({ body }) => {
        expect(body.items).to.deep.eq([{ productId: base.produtos[0].id, quantity: 1 }])
        expect(body.removed.some(i => i.productId === base.produtos[0].id)).to.eq(false)
      })
    })
  })

  it('[RN0044] avisa nos últimos cinco minutos e renova o prazo a partir da última inclusão de produto', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base)
      cy.task('condicionarVenda', { clienteId: base.cliente.id, operacao: 'prazo', valor: 120 })
      cy.reload()
      cy.contains('.demo-notification', 'Sua reserva de estoque expira em menos de 5 minutos').should('be.visible')
      cy.contains('a', /^Finalizar compra$/).should('have.attr', 'aria-disabled', 'false')
      cy.request<CartSummary>(`/api/clientes/${base.cliente.id}/carrinho/resumo`).then(({ body }) => {
        const limiteAnterior = new Date(body.expiresAt!).getTime()
        cy.contains('a', 'Continuar comprando').click()
        mostrarProdutoNoCatalogo(base.produtos[1])
        cy.intercept('POST', `**/carrinho/itens/${base.produtos[1].id}`).as('ultimaInclusao')
        cy.get(`[data-product-id="${base.produtos[1].id}"]`).contains('button', 'Adicionar').click({ scrollBehavior: 'nearest' })
        cy.wait('@ultimaInclusao').its('response.statusCode').should('eq', 200)
        abrirCarrinho()
        cy.get('.cart-line').should('have.length', 2)
        cy.request<CartSummary>(`/api/clientes/${base.cliente.id}/carrinho/resumo`).then(({ body: atual }) => {
          const novoLimite = new Date(atual.expiresAt!).getTime()
          expect(novoLimite).to.be.greaterThan(limiteAnterior)
          expect(novoLimite - Date.now(), 'prazo parametrizado de 30 minutos desde a última inclusão').to.be.within(29 * 60000, 30 * 60000)
        })
      })
    })
  })
})
