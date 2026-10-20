import { prepararPedido, iniciarCarrinho, abrirFinalizacao, usarCupons, finalizarPedido } from '../../support/pedido'

describe('Pedido — cartão, troca e promocional RF0037/RN0033/RN0035', () => {
  it('[RF0037][RF0038][RN0035] combina promocional e troca, usa os cupons ao máximo e paga R$ 5,00 no cartão', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); usarCupons(base, [0, 2])
      cy.contains('.order-summary p', 'Saldo nos cartões').should('contain', '5,00')
      cy.get('.payment-split input').should('have.value', '5')
      finalizarPedido(base).then(p => {
        expect(p.desconto).to.eq(base.cupons[0].valor + base.cupons[2].valor)
        expect(p.payments).to.have.length(1)
        expect(p.payments?.[0].amount).to.eq(5)
        expect(p.couponCodes).to.include.members([base.cupons[0].codigo, base.cupons[2].codigo])
      })
    })
  })
})
