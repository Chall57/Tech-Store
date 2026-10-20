import { selectProfile } from '../../support/data'
import { alterarStatusAdmin, conferirEstoque, prepararVenda } from '../../support/vendas'

describe('Vendas 05 — despacho, entrega e consulta', () => {
  it('[RF0039][RF0040][RN0039][RN0040] admin despacha pedido aprovado e confirma entrega; cliente consulta o resultado', () => {
    prepararVenda('APROVADA').then(({ base, pedido }) => {
      alterarStatusAdmin(pedido, 'EM TRANSPORTE')
      alterarStatusAdmin(pedido, 'ENTREGUE')
      selectProfile(base.cliente.id, '/pedidos')
      cy.get(`article[data-order-id="${pedido.id}"]`).should('contain', 'ENTREGUE').contains('a', 'Ver detalhes').click()
      cy.contains('.status', 'ENTREGUE').should('be.visible')
      conferirEstoque(base, pedido, true)
    })
  })
})
