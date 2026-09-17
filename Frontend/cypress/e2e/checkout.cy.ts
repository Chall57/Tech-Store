/// <reference types="cypress" />
import { apiCustomer, apiProduct, apiCard, apiCoupon, fill, selectProfile, submit } from '../support/data'

function finish() { cy.contains('button', /^Finalizar compra$/).should('not.be.disabled').click() }
function addCard(numero: string, bandeira: string) {
  cy.contains('button', 'Adicionar cartão').click()
  cy.get('form[aria-label="Novo cartão para compra"]').within(() => {
    fill({ bandeira, titular: 'CLIENTE CYPRESS', validade: '12/39', numeroCartao: numero, codigoSeguranca: '123' })
    submit('Salvar e selecionar cartão')
  })
  cy.get('form[aria-label="Novo cartão para compra"]').should('not.exist')
}
function receipt() {
  return cy.location('pathname').should('match', /^\/pedidos\/[0-9a-f-]+$/).then(path => path.split('/').pop()!)
}

describe('Compra persistente com pagamento simulado local', () => {
  it('Notificações — fecha em 4,5s e reinicia o timer após uma nova ação', () => {
    apiCustomer().then(c => apiProduct().then(p => {
      selectProfile(c.id, '/')
      cy.contains('article', p.nome).should('be.visible')
      cy.clock(Date.now(), ['setTimeout', 'clearTimeout'])
      cy.contains('article', p.nome).find('button').click()
      cy.get('.demo-notification').should('contain', 'Produto adicionado')
      cy.tick(4000)
      cy.contains('article', p.nome).find('button').should('not.be.disabled').click()
      cy.request('/api/clientes/' + c.id + '/carrinho').its('body.0.quantity').should('eq', 2)
      cy.get('.cart-action b').should('have.text', '2')
      cy.tick(4499)
      cy.get('.demo-notification').should('be.visible')
      cy.tick(2)
      cy.get('.demo-notification').should('not.exist')
      cy.clock().invoke('restore')
    }))
  })

  it('RF0033–RF0038 RN0033/RN0034 — compra pela tela com novo endereço, dois cartões e cupom; consulta e entrega persistidas', () => {
    apiCustomer().then(c => apiProduct(100).then(p => apiCoupon(c.id, 20, 'Promocional').then(v => {
      selectProfile(c.id, '/')
      cy.contains('article', p.nome).find('button').click()
      cy.get('.cart-action b').should('have.text', '1')
      cy.visit('/carrinho')
      cy.contains('Estoque reservado por').should('be.visible')
      cy.contains('a', 'Finalizar compra').click()
      cy.get('[data-testid="checkout-item"] img').should('have.attr', 'alt', p.nome).and('be.visible')
      cy.get('[data-testid="checkout-item"] img').then(img => expect((img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0))
      cy.contains('button', 'Adicionar endereço').click()
      cy.get('form[aria-label="Novo endereço de entrega"]').within(() => {
        fill({ enderecoNome: 'Entrega Cypress', tipoResidencia: 'Casa', tipoLogradouro: 'Rua', logradouro: 'Compra Completa', numero: '42', bairro: 'Centro', cep: '07400000', cidade: 'Arujá', estado: 'SP', pais: 'Brasil' })
        submit('Salvar e selecionar endereço')
      })
      cy.get('form[aria-label="Novo endereço de entrega"]').should('not.exist')
      addCard('4111111111111111', 'Visa')
      addCard('5555555555554444', 'Mastercard')
      cy.contains('label', v.codigo).find('input').check()
      cy.contains('.order-summary p', 'Saldo nos cartões').should('contain', '94,90')
      cy.get('[aria-label="Valor no cartão final 1111"]').clear().type('31.23')
      cy.get('[aria-label="Valor no cartão final 4444"]').clear().type('63.67')
      cy.contains('.order-summary p', 'Restante a distribuir').should('contain', '0,00')
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth))
      cy.screenshot('checkout-completo', { capture: 'fullPage' })
      finish()
      receipt().then(id => {
        cy.contains('.status', 'APROVADA').should('be.visible')
        cy.contains('label', 'Endereço de entrega').find('input').should('contain.value', 'Compra Completa, 42')
        cy.reload()
        cy.contains('.status', 'APROVADA').should('be.visible')
        cy.request('/api/pedidos/' + id).then(({ body }) => {
          expect(body.total).to.eq(114.90); expect(body.desconto).to.eq(20)
          expect(body.payments).to.have.length(2)
          expect(body.payments.reduce((sum: number, pg: { amount: number }) => sum + pg.amount, 0)).to.eq(94.90)
          expect(body.couponCodes).to.include(v.codigo)
          expect(JSON.stringify(body)).not.to.include('4111111111111111').and.not.to.include('codigoSeguranca')
        })
        cy.request('/api/clientes/' + c.id + '/cartoes').its('body').should('have.length', 2)
        cy.request('/api/clientes/' + c.id + '/enderecos').its('body').should('have.length', 2)
        cy.request('/api/clientes/' + c.id + '/carrinho').its('body').should('have.length', 0)
        cy.request('/api/produtos/' + p.id).then(r => { expect(r.body.quantidade).to.eq(9); expect(r.body.reservado).to.eq(0) })
        cy.visit('/admin/pedidos')
        cy.get('tbody tr[data-record-id="' + id + '"]').within(() => cy.contains('button', 'Alterar status').click())
        cy.get('form[aria-label="Alterar status do pedido"]').within(() => { fill({ status: 'EM TRANSPORTE' }); submit() })
        cy.get('tbody tr[data-record-id="' + id + '"]').should('contain', 'EM TRANSPORTE')
        cy.visit('/pedidos')
        cy.get('article[data-order-id="' + id + '"]').within(() => cy.contains('button', 'Confirmar recebimento').click())
        cy.get('form.mock-editor').within(() => submit('Confirmar recebimento'))
        cy.get('article[data-order-id="' + id + '"]').should('contain', 'ENTREGUE')
        cy.request('/api/pedidos/' + id).its('body.status').should('eq', 'ENTREGUE')
      })
    })))
  })

  it('RN0036 — combina cupons, cobre toda compra e gera saldo de troca sem cartões', () => {
    apiCustomer().then(c => apiProduct(100).then(p => apiCoupon(c.id, 70).then(v => apiCoupon(c.id, 60).then(w => {
      cy.request('POST', '/api/clientes/' + c.id + '/carrinho/itens/' + p.id, { quantidade: 1 })
      selectProfile(c.id, '/checkout')
      cy.contains('label', v.codigo).find('input').check()
      cy.contains('label', w.codigo).find('input').check()
      cy.contains('Os cupons cobrem a compra.').should('be.visible')
      cy.contains('.order-summary p', 'Crédito em novo cupom').should('contain', '15,10')
      finish()
      receipt().then(id => {
        cy.contains('Crédito de').should('contain', '15,10')
        cy.request('/api/pedidos/' + id).then(r => {
          expect(r.body.payments).to.have.length(0)
          expect(r.body.creditCouponCode).to.match(/^SALDO-/)
          cy.visit('/cupons')
          cy.contains('article', r.body.creditCouponCode).should('contain', 'Disponível').and('contain', '15,10')
        })
      })
    }))))
  })

  it('RN0028/RN0038 — recusa simulada libera estoque e cupom, sem simular sucesso', () => {
    apiCustomer().then(c => apiProduct(100).then(p => apiCard(c.id, '4000000000000002').then(() => apiCoupon(c.id, 20).then(v => {
      cy.request('POST', '/api/clientes/' + c.id + '/carrinho/itens/' + p.id, { quantidade: 1 })
      selectProfile(c.id, '/checkout')
      cy.contains('label', v.codigo).find('input').check()
      cy.contains('.order-summary p', 'Saldo nos cartões').should('contain', '94,90')
      finish()
      receipt().then(id => {
        cy.contains('.status', 'REPROVADA').should('be.visible')
        cy.contains('Pagamento reprovado.').should('be.visible')
        cy.request('/api/produtos/' + p.id).then(r => { expect(r.body.quantidade).to.eq(10); expect(r.body.reservado).to.eq(0) })
        cy.request('/api/clientes/' + c.id + '/cupons').then(r => expect(r.body.find((cupom: { id: string }) => cupom.id === v.id).status).to.eq('Disponível'))
        cy.reload(); cy.contains('.status', 'REPROVADA').should('be.visible')
        cy.request('/api/pedidos/' + id).its('body.payments.0.status').should('eq', 'REPROVADO')
      })
    }))))
  })

  it('RN0034 — valida soma e valor mínimo; troca do promocional e recálculo em centavos', () => {
    apiCustomer().then(c => apiProduct(100).then(p => apiCard(c.id).then(() => apiCard(c.id, '5555555555554444').then(() => apiCoupon(c.id, 10, 'Promocional').then(v => apiCoupon(c.id, 20, 'Promocional').then(w => {
      cy.request('POST', '/api/clientes/' + c.id + '/carrinho/itens/' + p.id, { quantidade: 1 })
      selectProfile(c.id, '/checkout')
      cy.contains('label', v.codigo).find('input').check()
      cy.contains('.order-summary p', 'Saldo nos cartões').should('contain', '104,90')
      cy.contains('label', w.codigo).find('input').check()
      cy.contains('label', v.codigo).find('input').should('not.be.checked')
      cy.contains('.order-summary p', 'Saldo nos cartões').should('contain', '94,90')
      cy.contains('label', 'Visa final 1111').find('input').check()
      cy.get('[aria-label="Valor no cartão final 1111"]').clear().type('5')
      cy.get('[aria-label="Valor no cartão final 4444"]').clear().type('89.90')
      finish(); cy.contains('Cada cartão deve pagar pelo menos').should('be.visible')
      cy.get('[aria-label="Valor no cartão final 1111"]').clear().type('20')
      finish(); cy.contains('A soma dos cartões deve corresponder').should('be.visible')
      cy.request('/api/clientes/' + c.id + '/transacoes').its('body.pedidos').should('have.length', 0)
    }))))))
  })

  it('Pedido pendente — cliente cancela pela tela, liberando cupom e reserva', () => {
    apiCustomer().then(c => apiProduct(100).then(p => apiCard(c.id).then(card => apiCoupon(c.id, 20).then(v => {
      cy.request('POST', '/api/clientes/' + c.id + '/carrinho/itens/' + p.id, { quantidade: 1 })
      cy.request('/api/clientes/' + c.id + '/enderecos').then(addresses => {
        const enderecoId = addresses.body[0].id
        cy.request('POST', '/api/clientes/' + c.id + '/checkout/orcamento', { enderecoId, cupomIds: [v.id] }).then(q => {
          cy.request('POST', '/api/clientes/' + c.id + '/pedidos', { enderecoId, cupomIds: [v.id], pagamentos: [{ cartaoId: card.id, valor: 94.90 }],
            chaveOperacao: crypto.randomUUID(), totalEsperado: q.body.totalCompra, revisao: q.body.revisao }).then(({ body }) => {
            selectProfile(c.id, '/pedidos')
            cy.get('article[data-order-id="' + body.id + '"]').within(() => cy.contains('button', 'Cancelar pedido').click())
            cy.get('form.mock-editor').within(() => submit('Cancelar pedido'))
            cy.get('article[data-order-id="' + body.id + '"]').should('contain', 'CANCELADO')
            cy.reload(); cy.get('article[data-order-id="' + body.id + '"]').should('contain', 'CANCELADO')
            cy.request('/api/produtos/' + p.id).then(r => { expect(r.body.quantidade).to.eq(10); expect(r.body.reservado).to.eq(0) })
            cy.request('/api/clientes/' + c.id + '/cupons').then(r => expect(r.body.find((cupom: { id: string }) => cupom.id === v.id).status).to.eq('Disponível'))
          })
        })
      })
    }))))
  })
})
