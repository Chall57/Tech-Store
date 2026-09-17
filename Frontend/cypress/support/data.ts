/// <reference types="cypress" />

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
      else cy.wrap(elements).clear().type(value, { delay: 0, log: !/senha|numeroCartao|codigoSeguranca/i.test(key) })
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

export function apiProduct(preco = 150) {
  return cy.request('/api/dominios/catalogo').then(r => cy.request('POST', '/api/produtos', {
    nome: 'Hardware Cypress ' + Date.now() + '-' + Math.floor(Math.random() * 100000), marca: 'Teste', descricao: 'Produto de teste persistido',
    imagem: '/images/products/rtx-5070-12gb.png', preco, custo: 50, ativo: true, quantidade: 10,
    grupoPrecificacaoId: r.body.grupos.find((g: { nome: string }) => g.nome === 'Padrão').id,
    categorias: [r.body.categorias.find((c: { nome: string }) => c.nome === 'Placas de vídeo').id],
  }).then(response => response.body))
}
export function apiCard(clienteId: string, numero = '4111111111111111') {
  return cy.request({ method: 'POST', url: '/api/clientes/' + clienteId + '/cartoes', log: false, body: {
    numero, codigoSeguranca: '123', titular: 'CLIENTE TESTE', bandeira: numero.startsWith('5') ? 'Mastercard' : 'Visa', validade: '12/39', preferencial: true,
  } }).then(r => r.body)
}
export function apiCoupon(clienteId: string, valor: number, tipo = 'Troca') {
  return cy.request('POST', '/api/cupons', { clienteId, valor, tipo, codigo: 'CYPRESS-' + Date.now() + '-' + Math.floor(Math.random() * 100000), validade: '2039-12-31' }).then(r => r.body)
}
