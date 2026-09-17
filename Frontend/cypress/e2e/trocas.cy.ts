/// <reference types="cypress" />
import { apiCustomer, apiProduct, apiCard, fill, selectProfile, submit } from '../support/data'

describe('Pós-venda persistente local', () => {
  it('RF0041–RF0045 RN0041/RN0042/RN0043/RN0046 RF0054 — solicita, autoriza, despacha, recebe com reentrada e crédito único', () => {
    apiCustomer().then(c => apiProduct(100).then(p => apiCard(c.id).then(() => {
      selectProfile(c.id, '/')
      cy.contains('article', p.nome).find('button').click()
      cy.get('.cart-action b').should('have.text', '1')
      cy.visit('/checkout')
      cy.contains('button', /^Finalizar compra$/).should('not.be.disabled').click()
      cy.location('pathname').should('match', /^\/pedidos\/[0-9a-f-]+$/).then(path => {
        const pedido = path.split('/').pop()!
        cy.visit('/admin/pedidos')
        const status = (value: string) => {
          cy.get('tbody tr[data-record-id="' + pedido + '"]').within(() => cy.contains('button', 'Alterar status').click())
          cy.get('form[aria-label="Alterar status do pedido"]').within(() => { fill({ status: value }); submit() })
          cy.get('form[aria-label="Alterar status do pedido"]').should('not.exist')
        }
        status('EM TRANSPORTE'); status('ENTREGUE')
        cy.visit('/trocas')
        cy.get('.exchange-form').within(() => {
          cy.contains('label', 'Pedido').find('select').select(pedido)
          cy.contains('label', 'Item').find('select').select(p.id)
          cy.get('textarea').type('Falha fictícia no hardware')
          submit('Solicitar troca')
        })
        cy.get('.exchange-status').should('contain', 'TROCA SOLICITADA')
        cy.request('/api/trocas?clienteId=' + c.id).then(r => {
          const troca = r.body[0].id
          cy.visit('/admin/trocas')
          cy.contains('tbody tr', troca).within(() => cy.contains('button', 'Aceitar ou negar').click())
          cy.get('form.mock-editor').within(() => { fill({ nextStatus: 'TROCA ACEITA', notes: 'Autorização local' }); submit('Aplicar transição') })
          cy.contains('tbody tr', troca).should('contain', 'TROCA ACEITA')
          cy.visit('/conta'); cy.contains('[role="alert"]', 'TROCA ACEITA').should('be.visible')
          cy.visit('/trocas')
          cy.contains('button', 'Informar despacho do item').click()
          cy.get('form.mock-editor').within(() => { fill({ carrier: 'Transportadora local', trackingCode: 'CY-123' }); submit('Confirmar despacho') })
          cy.get('.exchange-status').should('contain', 'ITEM ENVIADO')
          cy.visit('/admin/trocas')
          cy.contains('tbody tr', troca).within(() => cy.contains('button', 'Confirmar recebimento').click())
          cy.get('form.mock-editor').within(() => { fill({ reentrada: 'Sim' }); submit('Aplicar transição') })
          cy.contains('tbody tr', troca).should('contain', 'ITEM RECEBIDO')
          cy.request('/api/clientes/' + c.id + '/cupons').its('body.0.value').should('eq', 100)
          cy.contains('tbody tr', troca).within(() => cy.contains('button', 'Processar troca').click())
          cy.get('form.mock-editor').within(() => submit('Aplicar transição'))
          cy.reload(); cy.contains('tbody tr', troca).should('contain', 'TROCA PROCESSADA')
          cy.request('PATCH', '/api/trocas/' + troca + '/status', { status: 'TROCA PROCESSADA' })
          cy.request('/api/produtos/' + p.id).its('body.quantidade').should('eq', 10)
          cy.request('/api/clientes/' + c.id + '/cupons').its('body').should('have.length', 1)
          cy.request('/api/pedidos/' + pedido).its('body.status').should('eq', 'TROCADO')
          cy.visit('/cupons'); cy.contains('article', 'TROCA-' + troca).should('contain', 'Disponível')
        })
      })
    })))
  })
})
