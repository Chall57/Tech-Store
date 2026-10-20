import { prepararPedido, iniciarCarrinho } from '../../support/pedido'

describe('Pedido — carrinho RF0031/RF0032/RN0031', () => {
  it('[RF0031][RF0032][RN0031] inclui dois produtos, altera quantidades, consulta, remove um item e rejeita excesso de estoque', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base, true)
      cy.intercept('PUT', '**/carrinho/itens/*').as('remover')
      cy.contains('.cart-line', base.produtos[1].nome).contains('button', 'Remover').click()
      cy.wait('@remover').its('response.statusCode').should('eq', 200)
      cy.get('.cart-line').should('have.length', 1)
      cy.reload()
      cy.contains('.cart-line', base.produtos[0].nome).find('select').should('have.value', '3')
      // A lista da UI só oferece quantidades disponíveis; o servidor também rejeita excedentes.
      cy.contains('.cart-line', base.produtos[0].nome).find('option').last().should('have.value', String(base.produtos[0].quantidade))
      cy.request({ method: 'POST', url: `/api/clientes/${base.cliente.id}/carrinho/itens/${base.produtos[0].id}`, body: { quantidade: 1000 }, failOnStatusCode: false }).its('status').should('eq', 409)
      cy.contains('.cart-line', base.produtos[0].nome).find('select').should('have.value', '3')
    })
  })
  it('[RN0031] impede adicionar produto sem estoque pela interface e pela API', () => {
    prepararPedido().then(base => {
      const produto = base.produtos[0]
      cy.request('/api/produtos/' + produto.id).then(({ body }) => {
        cy.request('PUT', '/api/produtos/' + produto.id, { ...body, quantidade: 0, categorias: body.categorias.map((c: { id: string }) => c.id) })
      })
      iniciarCarrinhoVazio(base.cliente.id, produto.id)
      cy.contains('button', 'Adicionar ao carrinho').should('be.disabled')
      cy.contains('Produto indisponível').should('be.visible')
      cy.request({ method: 'POST', url: `/api/clientes/${base.cliente.id}/carrinho/itens/${produto.id}`, body: { quantidade: 1 }, failOnStatusCode: false }).its('status').should('eq', 409)
      cy.visit('/carrinho')
      cy.contains('Seu carrinho está vazio.').should('be.visible')
    })
  })
})

function iniciarCarrinhoVazio(clienteId: string, produtoId: string) {
  cy.visit('/produtos/' + produtoId, { onBeforeLoad(win) { win.sessionStorage.setItem('techstore.perfil', clienteId) } })
}
