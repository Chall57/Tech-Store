import { prepararPedido, iniciarCarrinho, abrirFinalizacao, novosDados, doisCartoes, usarCupons, finalizarPedido, conferirPerfil, conferirCredito, conferirFrete } from '../../support/pedido'

describe('Apresentação — caminho feliz completo de criação de pedido', () => {
  it('[RF0031][RF0032][RF0033][RF0034][RF0035][RF0036][RF0037][RF0038] caminho feliz: cinco compras com regras identificadas nas etapas', () => {
    cy.log('[RF0031][RF0032][RF0033][RF0034][RF0035][RF0036][RF0038] Passos 1 e 2: adiciona dois produtos, altera quantidade, calcula frete e compra com dados cadastrados')
    prepararPedido().then(base => {
      iniciarCarrinho(base, true); abrirFinalizacao(); conferirFrete(base, 4)
      finalizarPedido(base)
    })
    cy.log('[RF0035][RF0036][RF0038][RN0023][RN0024][RN0025] Passo 3: informa novo endereço e cartão, finaliza e consulta ambos no perfil')
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); novosDados(true)
      finalizarPedido(base); conferirPerfil(base, true)
    })
    cy.log('[RF0036][RF0038][RN0034] Passo 4: seleciona dois cartões, confere mínimo de R$ 10,00 e finaliza a compra')
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); doisCartoes(); finalizarPedido(base)
    })
    cy.log('[RF0037][RF0038][RN0035] Passo 5: combina promocional e troca, usa os cupons ao máximo e paga saldo de R$ 5,00 no cartão')
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); usarCupons(base, [0, 2])
      cy.get('.payment-split input').should('have.value', '5')
      finalizarPedido(base).then(p => { expect(p.payments?.[0].amount).to.eq(5) })
    })
    cy.log('[RF0037][RF0038][RN0036] Passos 6 e 7: usa cupons superiores ao total, consulta o cupom da diferença e confirma EM PROCESSAMENTO')
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); usarCupons(base, [3, 4])
      finalizarPedido(base).then(conferirCredito)
    })
    cy.location('pathname').should('not.contain', '/admin')
  })
})
