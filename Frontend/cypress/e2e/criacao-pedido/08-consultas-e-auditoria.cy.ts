import { prepararPedido, iniciarCarrinho, abrirFinalizacao, finalizarPedido } from '../../support/pedido'

type Auditoria = { data: string; responsavel: string; operacao: string; entidade: string; alteracoes: { antes: unknown; depois: unknown } }
describe('Pedido — consultas e log RNF0011/RNF0012', () => {
  it('[RNF0011][RNF0012] confere consultas em até 1 segundo e logs de carrinho e pedido com data, responsável e dados alterados', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base, true); abrirFinalizacao()
      finalizarPedido(base).then(pedido => {
        for (const url of ['/api/produtos', '/api/clientes/' + base.cliente.id + '/enderecos', '/api/clientes/' + base.cliente.id + '/cartoes', '/api/clientes/' + base.cliente.id + '/cupons', '/api/clientes/' + base.cliente.id + '/carrinho', '/api/pedidos/' + pedido.id]) {
          cy.request(url).then(r => {
            expect(r.status).to.eq(200)
            expect(r.duration, 'RNF0011 ' + url + ' ≤ 1000 ms').to.be.at.most(1000)
            cy.log('[RNF0011] ' + url + ': ' + r.duration + ' ms (limite: 1000 ms)')
          })
        }
        cy.task('auditoriaPedido', { clienteId: base.cliente.id, pedidoId: pedido.id }).then(result => {
          const logs = (result as { auditorias: Auditoria[] }).auditorias
          expect(logs.filter(l => l.operacao === 'ALTERAR')).to.have.length.at.least(3)
          const finalizar = logs.find(l => l.operacao === 'FINALIZAR_COMPRA')!
          expect(finalizar.entidade).to.eq('Pedido:' + pedido.id)
          expect(finalizar.responsavel).to.eq(base.cliente.id)
          expect(new Date(finalizar.data).getTime()).to.be.greaterThan(0)
          expect(finalizar.alteracoes.depois).to.have.property('status', 'EM PROCESSAMENTO')
          for (const log of logs) {
            expect(log.data).to.be.a('string').and.not.eq('')
            expect(log.responsavel).to.be.a('string').and.not.eq('')
            expect(log.alteracoes).to.have.all.keys('antes', 'depois')
          }
          expect(JSON.stringify(logs)).not.to.contain('codigoSeguranca').and.not.to.contain('4111111111111111')
          cy.log('[RNF0012] ' + logs.length + ' registros reais de auditoria conferidos no PostgreSQL')
        })
      })
    })
  })
})
