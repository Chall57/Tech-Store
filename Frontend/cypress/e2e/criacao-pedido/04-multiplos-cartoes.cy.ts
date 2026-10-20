import { prepararPedido, iniciarCarrinho, abrirFinalizacao, doisCartoes, finalizarPedido } from '../../support/pedido'

describe('Pedido — múltiplos cartões RN0034', () => {
  it('[RF0036][RF0038][RN0034] finaliza com dois cartões, mínimo de R$ 10,00 por cartão e soma exata', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); doisCartoes()
      finalizarPedido(base).then(p => {
        expect(p.payments).to.have.length(2)
        expect(p.payments?.every(pg => pg.amount >= 10)).to.eq(true)
        expect(Math.round(p.payments!.reduce((s, pg) => s + pg.amount, 0) * 100)).to.eq(Math.round(p.total * 100))
      })
    })
  })
})
