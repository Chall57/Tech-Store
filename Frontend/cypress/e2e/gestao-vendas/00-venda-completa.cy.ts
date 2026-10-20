import { selectProfile } from '../../support/data'
import { abrirFinalizacao, finalizarPedido, iniciarCarrinho, novosDados, prepararPedido, usarCupons, conferirFrete, conferirPerfil } from '../../support/pedido'
import { alterarStatusAdmin, conferirAuditoriaCiclo, conferirCupomTroca, conferirEstoque, conferirNotificacao, decidirTroca, despacharTroca, encerrarTroca, processarPagamento, receberTroca, reutilizarCupomTroca, solicitarTroca } from '../../support/vendas'

describe('Gestão de vendas — caminho completo pela interface', () => {
  it('[RF0031–RF0045][RF0053][RF0054] compra, aprova, entrega, troca todos os itens e usa o cupom gerado em nova compra', () => {
    prepararPedido().then(base => {
      // A API apenas cadastra as pré-condições; as operações deste caso ocorrem nas telas.
      iniciarCarrinho(base, true)
      abrirFinalizacao()
      conferirFrete(base, 4)
      novosDados(true)
      cy.get(`input[name="cartao-${base.cartoes[0].id}"]`).check()
      cy.get('.payment-split').should('have.length', 2)
      usarCupons(base, [0])
      cy.get('.payment-split input').each(input => expect(Number(input.val()), '[RN0034] mínimo por cartão').to.be.at.least(10))
      finalizarPedido(base).then(pedido => {
        expect(pedido.payments).to.have.length(2)
        expect(pedido.couponCodes).to.include(base.cupons[0].codigo)
        processarPagamento(pedido)
        conferirEstoque(base, pedido, true)
        conferirPerfil(base, true)
        alterarStatusAdmin(pedido, 'EM TRANSPORTE')
        alterarStatusAdmin(pedido, 'ENTREGUE')
        selectProfile(base.cliente.id, '/pedidos')
        cy.get(`article[data-order-id="${pedido.id}"]`).should('contain', 'ENTREGUE')

        // Cada item gera sua própria solicitação; só o conjunto de todos altera o pedido inteiro.
        solicitarTroca(base, pedido, pedido.items[0].productId, pedido.items[0].quantity).then(primeira => {
          cy.request(`/api/pedidos/${pedido.id}`).its('body.status').should('eq', 'ENTREGUE')
          solicitarTroca(base, pedido, pedido.items[1].productId, pedido.items[1].quantity).then(segunda => {
            cy.request(`/api/pedidos/${pedido.id}`).its('body.status').should('eq', 'EM TROCA')
            decidirTroca(primeira)
            decidirTroca(segunda)
            cy.request(`/api/pedidos/${pedido.id}`).its('body.status').should('eq', 'TROCA AUTORIZADA')
            conferirNotificacao(base)
            despacharTroca(base, primeira)
            despacharTroca(base, segunda)
            receberTroca(primeira)
            receberTroca(segunda)
            cy.request(`/api/pedidos/${pedido.id}`).its('body.status').should('eq', 'TROCADO')
            const devolvidos = Object.fromEntries(pedido.items.map(i => [i.productId, i.quantity]))
            conferirEstoque(base, pedido, true, devolvidos)
            encerrarTroca(primeira)
            encerrarTroca(segunda)
            conferirCupomTroca(base, pedido, primeira)
            conferirCupomTroca(base, pedido, segunda)
            cy.reload()
            cy.contains('article', 'TROCA-' + segunda.id).should('contain', 'Disponível')
            cy.screenshot('venda-completa-cupons-de-troca', { capture: 'viewport' })
            cy.log('Concluído: EM PROCESSAMENTO → APROVADA → EM TRANSPORTE → ENTREGUE → EM TROCA → TROCA AUTORIZADA → TROCADO')
            reutilizarCupomTroca(base, segunda)
            conferirAuditoriaCiclo(base, pedido)
          })
        })
      })
    })
  })
})
