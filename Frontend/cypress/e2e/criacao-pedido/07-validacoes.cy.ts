import { prepararPedido, iniciarCarrinho, abrirFinalizacao, usarCupons } from '../../support/pedido'
import { fill, submit } from '../../support/data'

describe('Pedido — validações RF0035/RF0036/RN0023–RN0025/RN0033–RN0036', () => {
  it('[RF0035][RF0036][RN0023][RN0024][RN0025] bloqueia campos obrigatórios vazios de endereço e cartão e oferece bandeiras cadastradas', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao()
      cy.contains('button', 'Adicionar endereço').click()
      cy.get('form[aria-label="Novo endereço de entrega"]').within(() => {
        submit('Salvar e selecionar endereço')
        cy.get('[name="logradouro"]').then(input => expect((input[0] as HTMLInputElement).validity.valueMissing).to.eq(true))
        cy.contains('button', 'Cancelar').click()
      })
      cy.contains('button', 'Adicionar cartão').click()
      cy.get('form[aria-label="Novo cartão para compra"]').within(() => {
        cy.get('[name="bandeira"] option').then(options => expect([...options].map(o => (o as HTMLOptionElement).value)).to.include.members(['Visa', 'Mastercard', 'Elo', 'American Express']).and.not.to.include('Bandeira inventada'))
        submit('Salvar e selecionar cartão')
        cy.get('[name="numeroCartao"]').then(input => expect((input[0] as HTMLInputElement).validity.valueMissing).to.eq(true))
      })
    })
  })
  it('[RN0033][RN0036] substitui o promocional anterior e rejeita dois promocionais ou cupom desnecessário', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao(); usarCupons(base, [0, 1])
      cy.contains('label.option-card', base.cupons[0].codigo).find('input').should('not.be.checked')
      cy.request('/api/clientes/' + base.cliente.id + '/enderecos').then(({ body }) => {
          for (const cupomIds of [[base.cupons[0].id, base.cupons[1].id], [base.cupons[3].id, base.cupons[4].id, base.cupons[2].id]]) {
            cy.request({ method: 'POST', url: '/api/clientes/' + base.cliente.id + '/checkout/orcamento', body: { enderecoId: body[0].id, cupomIds }, failOnStatusCode: false })
              .its('status').should('eq', 400)
          }
      })
    })
  })
  it('[RF0038][RN0034] impede finalizar com cartão abaixo de R$ 10,00 sem cupons ou soma incorreta dos cartões', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao()
      cy.get('input[name^="cartao-"]').check()
      const total = Number((base.produtos[0].preco + 14.90).toFixed(2))
      cy.get('[aria-label="Valor no cartão final 1111"]').clear().type('5')
      cy.get('[aria-label="Valor no cartão final 4444"]').clear().type(String(total - 5))
      cy.contains('button', /^Finalizar compra$/).click()
      cy.contains('[role="alert"]', 'Cada cartão deve pagar pelo menos').should('be.visible')
      cy.get('[aria-label="Valor no cartão final 1111"]').clear().type('20')
      cy.contains('button', /^Finalizar compra$/).click()
      cy.contains('[role="alert"]', 'A soma dos cartões').should('be.visible')
      cy.request('/api/pedidos?clienteId=' + base.cliente.id).its('body').should('have.length', 0)
    })
  })
  it('[RF0035][RF0036][RF0038][RN0023] rejeita endereço incompleto e cartão inválido (validação adicional), sem criar pedido', () => {
    prepararPedido().then(base => {
      iniciarCarrinho(base); abrirFinalizacao()
      // Provas adicionais de fonte final da regra; os caminhos felizes são sempre pela interface.
      cy.request({ method: 'POST', url: '/api/clientes/' + base.cliente.id + '/checkout/orcamento', body: { novoEndereco: { entrega: true }, cupomIds: [] }, failOnStatusCode: false }).its('status').should('eq', 400)
      cy.contains('button', 'Adicionar cartão').click()
      cy.get('form[aria-label="Novo cartão para compra"]').within(() => {
        fill({ bandeira: 'Visa', titular: 'CARTAO INVALIDO', validade: '12/39', numeroCartao: '1111111111111111', codigoSeguranca: '123' })
        submit('Salvar e selecionar cartão')
      })
      cy.get('input[name="cartao-' + base.cartoes[1].id + '"]').uncheck()
      cy.contains('button', /^Finalizar compra$/).click()
      cy.contains('[role="alert"]', 'Número de cartão inválido').should('be.visible')
      cy.request('/api/pedidos?clienteId=' + base.cliente.id).its('body').should('have.length', 0)
    })
  })
})
