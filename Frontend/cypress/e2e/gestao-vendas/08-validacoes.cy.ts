import { apiCoupon, apiCustomer, selectProfile, submit } from '../../support/data'
import { abrirFinalizacao, iniciarCarrinho, prepararPedido, usarCupons } from '../../support/pedido'
import { prepararVenda } from '../../support/vendas'

describe('Vendas 08 — limites e operações indevidas', () => {
  it('[RN0034][RF0038] não registra compra com cartão abaixo do mínimo sem cupons ou com soma divergente', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao()
      cy.get('input[name^="cartao-"]').check()
      cy.get('[aria-label="Valor no cartão final 1111"]').clear().type('5')
      cy.get('[aria-label="Valor no cartão final 4444"]').clear().type(String(base.produtos[0].preco + 14.90 - 5))
      submit('Finalizar compra')
      cy.contains('[role="alert"]', 'Cada cartão deve pagar pelo menos').should('be.visible')
      cy.get('[aria-label="Valor no cartão final 1111"]').clear().type('20')
      submit('Finalizar compra')
      cy.contains('[role="alert"]', 'A soma dos cartões').should('be.visible')
      cy.request('/api/pedidos?clienteId=' + base.cliente.id).its('body').should('have.length', 0)
    })
  })
  it('[RN0039][RN0043] não oferece despacho antes da aprovação nem troca antes da entrega; API também rejeita', () => {
    prepararVenda().then(({ base, pedido }) => {
      selectProfile(base.cliente.id, '/pedidos')
      cy.get(`article[data-order-id="${pedido.id}"]`).within(() => {
        cy.contains('a', 'Solicitar troca').should('not.exist')
        cy.contains('button', 'Confirmar recebimento').should('not.exist')
      })
      cy.visit('/trocas?pedido=' + pedido.id)
      cy.get('.exchange-form').within(() => {
        cy.contains('label', 'Pedido').find(`option[value="${pedido.id}"]`).should('not.exist')
        cy.contains('button', 'Solicitar troca').should('be.disabled')
      })
      selectProfile('ADMIN', '/admin/pedidos')
      cy.get(`tbody tr[data-record-id="${pedido.id}"]`).contains('button', 'Alterar status').click()
      cy.get('form[aria-label="Alterar status do pedido"] [name="status"] option').should('not.contain.text', 'EM TRANSPORTE')
      cy.request({ method: 'PATCH', url: `/api/pedidos/${pedido.id}/status`, body: { status: 'EM TRANSPORTE' }, failOnStatusCode: false }).its('status').should('eq', 409)
      cy.request({ method: 'POST', url: `/api/clientes/${base.cliente.id}/trocas`, body: { orderId: pedido.id, productId: pedido.items[0].productId, quantity: 1, reason: 'Solicitação antes da entrega' }, failOnStatusCode: false }).its('status').should('eq', 409)
      cy.request('/api/trocas?clienteId=' + base.cliente.id).its('body').should('have.length', 0)
    })
  })
  it('[RN0033][RN0036] não aceita dois promocionais nem cupons excedentes desnecessários', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); usarCupons(base, [0, 1])
      cy.contains('label.option-card', base.cupons[0].codigo).find('input').should('not.be.checked')
      cy.request(`/api/clientes/${base.cliente.id}/enderecos`).then(({ body }) => {
        // Prova adicional do servidor, independente das proteções da tela.
        for (const cupomIds of [[base.cupons[0].id, base.cupons[1].id], [base.cupons[3].id, base.cupons[4].id, base.cupons[2].id]]) {
          cy.request({ method: 'POST', url: `/api/clientes/${base.cliente.id}/checkout/orcamento`, body: { enderecoId: body[0].id, cupomIds }, failOnStatusCode: false }).its('status').should('eq', 400)
        }
      })
      cy.request('/api/pedidos?clienteId=' + base.cliente.id).its('body').should('have.length', 0)
    })
  })
  it('[RN0037] não oferece cupom de outro cliente e rejeita cupom alheio ou inexistente na API', () => {
    prepararPedido().then(base => {
      apiCustomer().then(outro => apiCoupon(outro.id, 20).then(cupom => {
        iniciarCarrinho(base); abrirFinalizacao()
        cy.contains('label.option-card', cupom.codigo).should('not.exist')
        cy.request(`/api/clientes/${base.cliente.id}/enderecos`).then(({ body }) => {
          for (const id of [cupom.id, crypto.randomUUID()]) {
            cy.request({ method: 'POST', url: `/api/clientes/${base.cliente.id}/checkout/orcamento`, body: { enderecoId: body[0].id, cupomIds: [id] }, failOnStatusCode: false }).its('status').should('eq', 404)
          }
        })
        cy.request('/api/pedidos?clienteId=' + base.cliente.id).its('body').should('have.length', 0)
      }))
    })
  })
})
