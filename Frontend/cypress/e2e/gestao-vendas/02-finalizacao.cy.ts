import { prepararPedido, iniciarCarrinho, abrirFinalizacao, finalizarPedido, novosDados, conferirPerfil, conferirFrete } from '../../support/pedido'

describe('Vendas 02 — endereço, cartão, frete e finalização', () => {
  it('[RF0033][RF0034][RF0035][RF0036][RF0038] finaliza com endereço e cartão cadastrados, sem aprovar pagamento antecipadamente', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base)
      abrirFinalizacao()
      conferirFrete(base, 1)
      cy.get('input[name="endereco"]:checked').should('have.length', 1)
      finalizarPedido(base).then(pedido => {
        expect(pedido.addressId).to.be.a('string')
        expect(pedido.payments).to.have.length(1)
        expect(pedido.payments![0].cardId).to.be.oneOf(base.cartoes.map(c => c.id))
      })
    })
  })

  for (const incorporar of [true, false]) {
    it(`[RF0035][RF0036][RF0038][RN0023][RN0024][RN0025] usa novo endereço e cartão ${incorporar ? 'incorporados ao perfil' : 'somente nesta compra'}`, () => {
      prepararPedido().then(base => {
        iniciarCarrinho(base)
        abrirFinalizacao()
        novosDados(incorporar)
        finalizarPedido(base).then(pedido => {
          expect(pedido.addressSnapshot).to.contain('Francisco Rodrigues')
          expect(pedido.payments![0].lastDigits).to.eq('1881')
        })
        conferirPerfil(base, incorporar)
      })
    })
  }
})
