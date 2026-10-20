import { prepararPedido, iniciarCarrinho, abrirFinalizacao, usarCupons, finalizarPedido, conferirCredito } from '../../support/pedido'

describe('Pedido — excedente de cupons RN0036', () => {
  it('[RF0037][RF0038][RN0036] usa dois cupons necessários, bloqueia cupom extra e emite cupom da diferença sem cartão', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); usarCupons(base, [3, 4])
      cy.contains('Os cupons cobrem a compra.').should('be.visible')
      cy.contains('label.option-card', base.cupons[2].codigo).find('input').should('be.disabled')
      finalizarPedido(base).then(p => {
        expect(p.payments).to.have.length(0)
        expect(p.creditValue).to.eq(Number((110 - p.total).toFixed(2)))
        conferirCredito(p)
      })
    })
  })
})
