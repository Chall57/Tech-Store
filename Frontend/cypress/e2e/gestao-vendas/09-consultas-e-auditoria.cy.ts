import { selectProfile } from '../../support/data'
import { alterarStatusAdmin, prepararVenda, processarPagamento } from '../../support/vendas'

type Registro = { data: string; responsavel: string; operacao: string; alteracoes: { antes: unknown; depois: unknown } }

describe('Vendas 09 — consultas e rastreabilidade de escrita', () => {
  it('[RNF0011][RNF0012] mede consultas locais e confere auditoria real da compra, aprovação e despacho', () => {
    prepararVenda().then(({ base, pedido }) => {
      selectProfile(base.cliente.id, '/pedidos/' + pedido.id)
      processarPagamento(pedido)
      alterarStatusAdmin(pedido, 'EM TRANSPORTE')
      for (const url of [`/api/pedidos/${pedido.id}`, `/api/pedidos?clienteId=${base.cliente.id}`, `/api/clientes/${base.cliente.id}/cupons`, `/api/trocas?clienteId=${base.cliente.id}`]) {
        cy.request(url).then(r => {
          expect(r.status).to.eq(200)
          expect(r.duration, '[RNF0011] amostra local em ms: ' + url).to.be.at.most(1000)
          cy.log(`${url}: ${r.duration} ms; medição local, não teste de carga`)
        })
      }
      cy.task('auditoriaPedido', { clienteId: base.cliente.id, pedidoId: pedido.id }).then(result => {
        const logs = (result as { auditorias: Registro[] }).auditorias
        expect(logs.map(l => l.operacao)).to.include.members(['FINALIZAR_COMPRA', 'APROVAR_PAGAMENTO', 'ALTERAR_STATUS'])
        expect(logs.find(l => l.operacao === 'APROVAR_PAGAMENTO')!.responsavel).to.eq(base.cliente.id)
        expect(logs.find(l => l.operacao === 'ALTERAR_STATUS')!.responsavel).to.eq('ADMIN')
        for (const log of logs) {
          expect(new Date(log.data).getTime()).to.be.greaterThan(0)
          expect(log.responsavel).to.be.a('string').and.not.eq('')
          expect(log.alteracoes).to.have.all.keys('antes', 'depois')
        }
        expect(JSON.stringify(logs)).not.to.contain('codigoSeguranca').and.not.to.contain('4111111111111111')
      })
    })
  })
})
