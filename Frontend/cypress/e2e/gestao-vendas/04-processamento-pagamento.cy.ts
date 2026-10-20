import { selectProfile } from '../../support/data'
import { abrirFinalizacao, finalizarPedido, iniciarCarrinho, prepararPedido, usarCupons } from '../../support/pedido'
import { conferirEstoque, prepararVenda, processarPagamento } from '../../support/vendas'

describe('Vendas 04 — aprovação e reprovação simuladas', () => {
  it('[RN0037][RN0038][RN0028][RF0053] aprova e baixa estoque uma única vez, mesmo repetindo a solicitação', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao()
      finalizarPedido(base).then(pedido => {
        expect(pedido.payments).to.have.length(1)
        processarPagamento(pedido)
        conferirEstoque(base, pedido, true)
        // Prova complementar de idempotência do backend; o botão desaparece após aprovar.
        cy.request('POST', `/api/pedidos/${pedido.id}/pagamento`).its('body.status').should('eq', 'APROVADA')
        conferirEstoque(base, pedido, true)
      })
    })
  })
  it('[RN0037][RN0038][RN0028] reprova cartão de teste, mantém estoque e libera a reserva', () => {
    prepararVenda('EM PROCESSAMENTO', true).then(({ base, pedido }) => {
      selectProfile(base.cliente.id, '/pedidos/' + pedido.id)
      processarPagamento(pedido, 'REPROVADA')
      cy.contains('[role="alert"]', 'Pagamento reprovado.').should('be.visible')
      conferirEstoque(base, pedido, false)
    })
  })
  it('[RN0037][RN0038][RN0028] revalida cupom vencido entre a finalização e o processamento, reprovando sem baixa', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); usarCupons(base, [0])
      finalizarPedido(base).then(pedido => {
        cy.task('condicionarVenda', { clienteId: base.cliente.id, operacao: 'cupom', valor: 0, referenciaId: base.cupons[0].id })
          .its('aplicado').should('eq', true)
        processarPagamento(pedido, 'REPROVADA')
        conferirEstoque(base, pedido, false)
        cy.request('/api/clientes/' + base.cliente.id + '/cupons').then(({ body }) => {
          expect(body.find((c: { id: string; status: string }) => c.id === base.cupons[0].id).status).to.eq('Expirado')
        })
      })
    })
  })
})
