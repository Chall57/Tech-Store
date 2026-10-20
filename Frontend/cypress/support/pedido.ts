/// <reference types="cypress" />
import { apiCard, apiCoupon, apiCustomer, apiProduct, fill, selectProfile, submit, mostrarProdutoNoCatalogo, abrirCarrinho } from './data'
import type { Pedido, Quote } from '../../src/services/vendaService'
import { localDate } from '../../src/utils/localDate'

export type BasePedido = {
  cliente: { id: string; nome: string }
  produtos: { id: string; nome: string; preco: number; quantidade: number }[]
  cartoes: { id: string; ultimosDigitos: string }[]
  cupons: { id: string; codigo: string; valor: number }[]
}
const reais = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

// Preparação pela API real, antes de navegar: não faz parte da demonstração do cliente.
// Cada cenário tem cliente, produtos, entradas e cupons próprios no schema techstore_e2e.
export function prepararPedido(): Cypress.Chainable<BasePedido> {
  const base: BasePedido = { cliente: { id: '', nome: '' }, produtos: [], cartoes: [], cupons: [] }
  cy.request('/actuator/health').its('body.status').should('eq', 'UP')
  apiCustomer().then(c => { base.cliente = c })
  cy.then(() => apiCard(base.cliente.id)).then(c => { base.cartoes.push(c) })
  cy.then(() => apiCard(base.cliente.id, '5555555555554444')).then(c => { base.cartoes.push(c) })
  for (let i = 0; i < 2; i++) {
    apiProduct(100, i === 0 ? 'rtx5070' : 'rx9070xt').then(p => {
      cy.request('/api/fornecedores').then(({ body }) => {
        const fornecedor = body.length ? cy.wrap(body[0]) : cy.request('POST', '/api/fornecedores', { nome: 'Fornecedor de testes de pedido' }).its('body')
        fornecedor.then(f => cy.request('POST', '/api/estoque/entradas', { produtoId: p.id, fornecedorId: f.id, quantidade: 20, custoUnitario: 50, dataEntrada: localDate() }))
      })
      cy.request('/api/produtos/' + p.id).then(({ body }) => { base.produtos.push(body) })
    })
  }
  // Entrada recalcula os preços por custo + margem. Para uma unidade: preço + frete SP.
  cy.then(() => apiCoupon(base.cliente.id, 20, 'Promocional')).then(c => { base.cupons.push(c) })
  cy.then(() => apiCoupon(base.cliente.id, 10, 'Promocional')).then(c => { base.cupons.push(c) })
  cy.then(() => apiCoupon(base.cliente.id, Number((base.produtos[0].preco + 14.90 - 5 - 20).toFixed(2))))
    .then(c => { base.cupons.push(c) })
  cy.then(() => apiCoupon(base.cliente.id, 50)).then(c => { base.cupons.push(c) })
  cy.then(() => apiCoupon(base.cliente.id, 60)).then(c => { base.cupons.push(c) })
  return cy.then(() => base)
}

export function iniciarCarrinho(base: BasePedido, varios = false) {
  cy.log('[RF0031][RF0032] Catálogo: escolhe o produto e a quantidade para adicionar ao carrinho')
  selectProfile(base.cliente.id, '/')
  cy.contains('h1', /Componentes para montar/).should('be.visible')
  mostrarProdutoNoCatalogo(base.produtos[0])
  cy.intercept('POST', '**/carrinho/itens/*').as('adicionarItem')
  cy.get('[data-product-id="' + base.produtos[0].id + '"]').within(() => {
    cy.get('select').select(varios ? '2' : '1')
    cy.contains('button', 'Adicionar').click({ scrollBehavior: 'nearest' })
  })
  cy.wait('@adicionarItem').its('response.statusCode').should('eq', 200)
  cy.contains('[role="status"]', 'Produto adicionado ao carrinho.').should('be.visible')
  abrirCarrinho()
  cy.contains('.cart-line', base.produtos[0].nome).should('be.visible')
  cy.log('[RF0031][RF0032] Catálogo: volta à listagem e abre os detalhes do produto')
  cy.contains('a', 'Continuar comprando').click()
  mostrarProdutoNoCatalogo(base.produtos[varios ? 1 : 0])
  cy.get('[data-product-id="' + base.produtos[varios ? 1 : 0].id + '"]').find('h3').click({ scrollBehavior: 'nearest' })
  cy.contains('.detail-info h1', base.produtos[varios ? 1 : 0].nome).should('be.visible')
  cy.contains('label', 'Quantidade').find('select').should('have.value', '1')
  cy.demoPause()
  if (varios) {
    cy.contains('button', 'Adicionar ao carrinho').click()
    cy.wait('@adicionarItem').its('response.statusCode').should('eq', 200)
  }
  abrirCarrinho()
  cy.contains('.cart-line', base.produtos[0].nome).should('be.visible')
  if (varios) {
    cy.get('.cart-line').should('have.length', 2)
    cy.intercept('PUT', '**/carrinho/itens/*').as('alterarQuantidade')
    cy.contains('.cart-line', base.produtos[0].nome).find('select').select('3')
    cy.wait('@alterarQuantidade').its('response.statusCode').should('eq', 200)
    cy.contains('.cart-line', base.produtos[0].nome).find('select').should('have.value', '3')
  }
  cy.demoPause()
}

export function abrirFinalizacao() {
  cy.intercept('POST', '**/checkout/orcamento').as('orcamento')
  cy.contains('a', /^Finalizar compra$/).click()
  cy.wait('@orcamento').its('response.statusCode').should('eq', 200)
  cy.contains('h1', 'Finalizar compra').should('be.visible')
  cy.get('[data-testid="checkout-item"]').should('have.length.at.least', 1)
  cy.demoPause()
}

export function novosDados(incorporar = true) {
  cy.contains('button', 'Adicionar endereço').click()
  cy.get('form[aria-label="Novo endereço de entrega"]').within(() => {
    fill({ enderecoNome: 'Entrega da compra', tipoResidencia: 'Apartamento', tipoLogradouro: 'Avenida', logradouro: 'Francisco Rodrigues', numero: '42', bairro: 'Centro', cep: '07400000', cidade: 'Arujá', estado: 'SP', pais: 'Brasil' })
    if (!incorporar) cy.get('[name="incorporarEndereco"]').uncheck()
    submit('Salvar e selecionar endereço')
  })
  cy.get('form[aria-label="Novo endereço de entrega"]').should('not.exist')
  cy.wait('@orcamento').its('response.statusCode').should('eq', 200)
  cy.contains('button', 'Adicionar cartão').should('not.be.disabled').click()
  cy.get('form[aria-label="Novo cartão para compra"]').within(() => {
    fill({ bandeira: 'Visa', titular: 'CLIENTE DA COMPRA', validade: '12/39', numeroCartao: '4012888888881881', codigoSeguranca: '123' })
    if (!incorporar) cy.get('[name="incorporarCartao"]').uncheck()
    submit('Salvar e selecionar cartão')
  })
  cy.get('form[aria-label="Novo cartão para compra"]').should('not.exist')
  // O cartão recém-informado substitui o selecionado anteriormente neste cenário.
  cy.get('input[name^="cartao-"]').then(inputs => {
    const selected = [...inputs].filter(i => (i as HTMLInputElement).checked)
    selected.slice(0, -1).forEach(i => { cy.wrap(i).uncheck() })
  })
  cy.get('[aria-label="Valor no cartão final 1881"]').should('be.visible')
}

export function doisCartoes() {
  cy.get('input[name^="cartao-"]').check()
  cy.get('.payment-split').should('have.length', 2)
  cy.get('.payment-split input').each(input => {
    expect(Number(input.val()), 'RN0034 mínimo de R$ 10,00').to.be.at.least(10)
  })
  cy.contains('.order-summary p', 'Restante a distribuir').should('contain', '0,00')
}

export function usarCupons(base: BasePedido, indices: number[]) {
  for (const indice of indices) {
    cy.contains('label.option-card', base.cupons[indice].codigo).find('input').check()
    cy.wait('@orcamento').its('response.statusCode').should('eq', 200)
  }
}

export function finalizarPedido(base: BasePedido): Cypress.Chainable<Pedido> {
  // Intercepta para observar: nenhuma resposta é mockada e nenhum POST substitui o clique.
  // Um cliente pode fazer outra compra no mesmo teste depois de processar a primeira.
  // Cada observação deve pertencer somente à finalização atual.
  const aliasPedido = 'pedidoCriado' + Cypress._.uniqueId()
  const aliasPagamento = 'pagamentoPosterior' + Cypress._.uniqueId()
  cy.intercept('POST', '**/api/clientes/*/pedidos').as(aliasPedido)
  cy.intercept('POST', '**/api/pedidos/*/pagamento').as(aliasPagamento)
  cy.screenshot('finalizar-compra-' + base.cliente.id, { capture: 'fullPage' })
  cy.contains('button', /^Finalizar compra$/).should('not.be.disabled').click()
  return cy.wait(`@${aliasPedido}`).then(({ response }) => {
    expect(response?.statusCode).to.eq(201)
    const pedido = response!.body as Pedido
    expect(pedido.status, 'RF0038 status ao finalizar').to.eq('EM PROCESSAMENTO')
    expect(pedido.payments?.every(p => p.status === 'PENDENTE')).to.eq(true)
    expect(JSON.stringify(pedido)).not.to.contain('codigoSeguranca').and.not.to.contain('4012888888881881')
    cy.location('pathname').should('eq', '/pedidos/' + pedido.id)
    cy.contains('.status', 'EM PROCESSAMENTO').should('be.visible')
    cy.get('@' + aliasPagamento + '.all').should('have.length', 0)
    cy.reload()
    cy.contains('.status', 'EM PROCESSAMENTO').should('be.visible')
    cy.request('/api/pedidos/' + pedido.id).its('body.status').should('eq', 'EM PROCESSAMENTO')
    cy.request('/api/clientes/' + base.cliente.id + '/carrinho').its('body').should('have.length', 0)
    for (const produto of base.produtos) {
      cy.request('/api/produtos/' + produto.id).its('body.quantidade').should('eq', produto.quantidade)
    }
    cy.screenshot('pedido-' + pedido.numero + '-em-processamento', { capture: 'fullPage' })
    return cy.then(() => pedido)
  })
}

export function conferirPerfil(base: BasePedido, incorporado: boolean) {
  cy.request('/api/clientes/' + base.cliente.id + '/enderecos').then(({ body }) => {
    expect(body.length).to.eq(incorporado ? 2 : 1)
    expect(body.some((e: { nome: string }) => e.nome === 'Entrega da compra')).to.eq(incorporado)
  })
  cy.request('/api/clientes/' + base.cliente.id + '/cartoes').then(({ body }) => {
    expect(body.length).to.eq(incorporado ? 3 : 2)
    expect(body.some((c: { ultimosDigitos: string }) => c.ultimosDigitos === '1881')).to.eq(incorporado)
  })
  if (incorporado) {
    cy.get('nav[aria-label="Navegação principal"]').contains('a', /^Conta$/i).click()
    cy.get('.account-menu').contains('a', 'Endereços').click()
    cy.contains('Entrega da compra').should('be.visible')
    cy.demoPause()
    cy.get('.account-menu').contains('a', 'Cartões').click()
    cy.contains('1881').should('be.visible')
    cy.demoPause()
  }
}

export function conferirCredito(pedido: Pedido) {
  expect(pedido.status).to.eq('EM PROCESSAMENTO')
  expect(pedido.creditValue).to.be.greaterThan(0)
  expect(pedido.creditCouponCode).to.match(/^SALDO-/)
  cy.contains('[role="alert"]', 'Crédito de').should('contain', reais(pedido.creditValue))
  cy.get('nav[aria-label="Navegação principal"]').contains('a', /^Cupons$/i).click()
  cy.contains('article', pedido.creditCouponCode!).should('contain', reais(pedido.creditValue)).and('contain', 'Disponível')
}

export function conferirFrete(base: BasePedido, quantidade: number) {
  const esperado = 14.90 + 2 * (quantidade - 1)
  cy.contains('.order-summary p', 'Frete').should('contain', reais(esperado))
  cy.get('@orcamento').then(intercept => {
    const q = (intercept as unknown as { response: { body: Quote } }).response.body
    expect(q.frete, 'RF0034 SP + R$ 2 por unidade adicional').to.eq(esperado)
    expect(q.subtotal).to.eq(base.produtos[0].preco * (quantidade === 1 ? 1 : 3) + (quantidade === 1 ? 0 : base.produtos[1].preco))
  })
}
