import { prepararPedido, iniciarCarrinho, abrirFinalizacao, conferirFrete, finalizarPedido } from '../../support/pedido'

describe('Pedido — endereço e cartão da conta RF0033–RF0038', () => {
  it('[RF0033][RF0034][RF0035][RF0036][RF0038] compra com endereço e cartão cadastrados, confere frete e persiste EM PROCESSAMENTO', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base, true); abrirFinalizacao(); conferirFrete(base, 4)
      cy.get('input[name="endereco"]:checked').should('have.length', 1)
      cy.get('input[name^="cartao-"]:checked').should('have.length', 1)
      finalizarPedido(base).then(p => {
        expect(p.items).to.have.length(2)
        expect(p.items.reduce((sum, i) => sum + i.quantity, 0)).to.eq(4)
        expect(p.addressSnapshot).to.contain('Arujá')
        expect(p.payments).to.have.length(1)
        expect(p.frete).to.eq(20.90)
      })
    })
  })
})
