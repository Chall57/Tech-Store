/// <reference types="cypress" />
import type { Produto } from '../../src/services/produtoService'

const modelosDeProduto = {
  rtx5070: {
    nome: 'GeForce RTX 5070 12GB', marca: 'NVIDIA',
    descricao: 'Placa de vídeo GeForce RTX 5070 com 12 GB de memória.',
    imagem: '/images/products/rtx-5070-12gb.png',
  },
  rx9070xt: {
    nome: 'Radeon RX 9070 XT 16GB', marca: 'AMD',
    descricao: 'Placa de vídeo Radeon RX 9070 XT com 16 GB de memória.',
    imagem: '/images/products/rx-9070-xt-16gb.png',
  },
} as const

export const digits = () => {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  for (let length = 9; length < 11; length++) {
    const value = n.reduce((sum, digit, index) => sum + digit * (length + 1 - index), 0) * 10 % 11
    n.push(value === 10 ? 0 : value)
  }
  return n.join('')
}
export function customer() {
  const stamp = Date.now() + '-' + Math.floor(Math.random() * 100000)
  return {
    nome: 'Cliente Cypress ' + stamp, genero: 'Masculino', cpf: digits(), email: 'cypress-' + stamp + '@techstore.test',
    dataNascimento: '1998-06-15', tipoTelefone: 'Celular', ddd: '11', telefone: '987654321',
    senha: 'Teste@2026', confirmacaoSenha: 'Teste@2026',
    enderecos: [{ nome: 'Residência', tipoResidencia: 'Casa', tipoLogradouro: 'Rua', logradouro: 'Dos Testes', numero: '10',
      bairro: 'Centro', cep: '07400000', cidade: 'Arujá', estado: 'SP', pais: 'Brasil', observacoes: '', residencial: true, entrega: true, cobranca: true }],
  }
}
export function fill(values: Record<string, string>) {
  Object.entries(values).forEach(([key, value]) => {
    cy.get('[name="' + key + '"]').then(elements => {
      if (elements[0].tagName === 'SELECT') cy.wrap(elements).select(value)
      else cy.wrap(elements).clear().type(value, { log: !/senha|numeroCartao|codigoSeguranca/i.test(key) })
    })
  })
}
export function registration(data = customer()) {
  cy.visit('/clientes/novo')
  cy.get('form[aria-label="Cadastrar cliente"]').within(() => {
    const { enderecos, ...fields } = data
    fill(fields)
    const { nome, observacoes, residencial, entrega, cobranca, ...address } = enderecos[0]
    void observacoes; void residencial; void entrega; void cobranca
    fill({ ...address, enderecoNome: nome })
  })
  return data
}
export function registerCustomerThroughUi(data = customer()) {
  registration(data)
  cy.intercept('POST', '**/api/clientes').as('cadastrarCliente')
  submit('Cadastrar e acessar conta')
  return cy.wait('@cadastrarCliente').then(({ response }) => {
    expect(response?.statusCode).to.eq(201)
    expect(response?.body.id).to.be.a('string')
    expect(response?.body).not.to.have.any.keys('senha', 'senhaHash', 'confirmacaoSenha')
    const cliente = { ...data, id: response?.body.id as string }
    return cy.location('pathname').should('eq', '/conta').then(() => cliente)
  })
}
export function apiCustomer(data = customer()) {
  return cy.request('POST', '/api/clientes', data).then(response => {
    expect(response.status).to.eq(201)
    return { ...data, id: response.body.id as string }
  })
}
export function selectProfile(id: string, path = '/conta') {
  cy.visit(path, { onBeforeLoad(win) { win.sessionStorage.setItem('techstore.perfil', id) } })
}
export function submit(label = 'Salvar alterações') { cy.contains('button', label).click() }

export function mostrarProdutoNoCatalogo(produto: { id: string; nome: string }) {
  cy.location('pathname').should('eq', '/')
  cy.location('search').should('eq', '')
  cy.contains('h2', 'Produtos disponíveis').should('be.visible')
  // Prioriza a primeira fileira, mas permite um produto logo abaixo quando necessário.
  cy.get('.book-grid .book-card').then(cards => {
    const todos = cards.toArray()
    const primeiraFileira = todos.filter(element => element.offsetTop === cards[0].offsetTop)
    const card = primeiraFileira.find(element => element.dataset.productId === produto.id)
      ?? todos.find(element => element.dataset.productId === produto.id)
    expect(card, 'produto preparado presente no catálogo').not.to.eq(undefined)
    const ancora = primeiraFileira.includes(card!) ? cards[0] : card!
    cy.wrap(ancora).scrollIntoView({ duration: 250, offset: { top: -130, left: 0 } })
  })
  cy.get('[data-product-id="' + produto.id + '"]').should('be.visible').and('contain', produto.nome)
  cy.demoPause()
}

export function abrirCarrinho() {
  cy.get('.header-actions a[href="/carrinho"]').click()
  cy.location('pathname').should('eq', '/carrinho')
  cy.contains('h1', 'Carrinho').should('be.visible')
  cy.demoPause()
}

export function comprarPeloCatalogo(clienteId: string, produto: { id: string; nome: string }, quantidade = 1) {
  selectProfile(clienteId, '/')
  mostrarProdutoNoCatalogo(produto)
  cy.intercept('POST', '**/carrinho/itens/' + produto.id).as('adicionarProdutoCatalogo')
  cy.get('[data-product-id="' + produto.id + '"]').within(() => {
    cy.get('select').select(String(quantidade))
    cy.contains('button', 'Adicionar').click({ scrollBehavior: 'nearest' })
  })
  cy.wait('@adicionarProdutoCatalogo').its('response.statusCode').should('eq', 200)
  cy.contains('[role="status"]', 'Produto adicionado ao carrinho.').should('be.visible')
  abrirCarrinho()
  cy.contains('.cart-line', produto.nome).find('select').should('have.value', String(quantidade))
}

export function apiProduct(preco = 150, modelo: keyof typeof modelosDeProduto = 'rtx5070') {
  // Registro próprio por cenário. O ID distingue cadastros com o mesmo nome comercial.
  return cy.request('/api/dominios/catalogo').then(r => cy.request<Produto>('POST', '/api/produtos', {
    ...modelosDeProduto[modelo], preco, custo: 50, ativo: true, quantidade: 10,
    grupoPrecificacaoId: r.body.grupos.find((g: { nome: string }) => g.nome === 'Padrão').id,
    categorias: [r.body.categorias.find((c: { nome: string }) => c.nome === 'Placas de vídeo').id],
  }).then(response => {
    expect(response.status).to.eq(201)
    return response.body
  }))
}
export function apiCard(clienteId: string, numero = '4111111111111111') {
  return cy.request({ method: 'POST', url: '/api/clientes/' + clienteId + '/cartoes', log: false, body: {
    numero, codigoSeguranca: '123', titular: 'CLIENTE TESTE', bandeira: numero.startsWith('5') ? 'Mastercard' : 'Visa', validade: '12/39', preferencial: true,
  } }).then(r => r.body)
}
export function apiCoupon(clienteId: string, valor: number, tipo = 'Troca') {
  return cy.request('POST', '/api/cupons', { clienteId, valor, tipo, codigo: 'CYPRESS-' + Date.now() + '-' + Math.floor(Math.random() * 100000), validade: '2039-12-31' }).then(r => r.body)
}
