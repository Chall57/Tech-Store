import { conferirCupomTroca, decidirTroca, despacharTroca, prepararVenda, receberTroca, reutilizarCupomTroca, solicitarTroca } from '../../support/vendas'

describe('Vendas 12 — uso do crédito efetivamente gerado pela troca', () => {
  it('[RF0045][RF0036][RF0037] recebe item, consulta o cupom e o utiliza em uma segunda compra aprovada', () => {
    prepararVenda('ENTREGUE').then(({ base, pedido }) => {
      solicitarTroca(base, pedido).then(troca => {
        decidirTroca(troca)
        despacharTroca(base, troca)
        receberTroca(troca)
        conferirCupomTroca(base, pedido, troca)
        reutilizarCupomTroca(base, troca)
      })
    })
  })
})
