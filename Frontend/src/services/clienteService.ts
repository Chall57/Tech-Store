import { api, body } from './api'
export type EnderecoInput = {
  nome: string; tipoResidencia: string; tipoLogradouro: string; logradouro: string; numero: string
  bairro: string; cep: string; cidade: string; estado: string; pais: string; observacoes?: string
  residencial: boolean; entrega: boolean; cobranca: boolean
}
export type ClienteInput = {
  nome: string; genero: string; dataNascimento: string; cpf: string; email: string
  tipoTelefone: string; ddd: string; telefone: string; senha?: string; confirmacaoSenha?: string; enderecos?: EnderecoInput[]
}
export type Cliente = Omit<ClienteInput, 'senha' | 'confirmacaoSenha' | 'enderecos'> & {
  id: string; ativo: boolean; ranking: number; criadoEm: string; atualizadoEm: string; versao: number
}
export type Endereco = EnderecoInput & { id: string; clienteId: string }
export type PerfilCliente = Pick<Cliente, 'id' | 'nome' | 'ativo'> & { selecionavel: boolean }
export type CartaoInput = { numero?: string; codigoSeguranca?: string; bandeira: string; titular: string; validade: string; preferencial: boolean }
export type Cartao = Omit<CartaoInput, 'numero' | 'codigoSeguranca'> & { id: string; clienteId: string; ultimosDigitos: string }
const root = '/clientes'
export const clienteService = {
  perfis: () => api<PerfilCliente[]>('/clientes/perfis'),
  listar: (filtros: Record<string, string> = {}) => api<Cliente[]>(root + '?' + new URLSearchParams(Object.entries(filtros).filter(([, v]) => v))),
  consultar: (id: string) => api<Cliente>(`${root}/${id}`),
  cadastrar: (data: ClienteInput) => api<Cliente>(root, { method: 'POST', body: body(data) }),
  alterar: (id: string, data: ClienteInput) => api<Cliente>(`${root}/${id}`, { method: 'PUT', body: body(data) }),
  status: (id: string, ativo: boolean) => api<Cliente>(`${root}/${id}/${ativo ? 'ativar' : 'inativar'}`, { method: 'PATCH' }),
  senha: (id: string, senha: string, confirmacaoSenha: string) => api<void>(`${root}/${id}/senha`, { method: 'PATCH', body: body({ senha, confirmacaoSenha }) }),
}
export const enderecoService = {
  listar: (cliente: string) => api<Endereco[]>(`${root}/${cliente}/enderecos`),
  salvar: (cliente: string, data: EnderecoInput, id?: string) => api<Endereco>(`${root}/${cliente}/enderecos${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: body(data) }),
  excluir: (cliente: string, id: string) => api<void>(`${root}/${cliente}/enderecos/${id}`, { method: 'DELETE' }),
}
export const cartaoService = {
  listar: (cliente: string) => api<Cartao[]>(`${root}/${cliente}/cartoes`),
  bandeiras: () => api<string[]>('/dominios/bandeiras'),
  salvar: (cliente: string, data: CartaoInput, id?: string) => api<Cartao>(`${root}/${cliente}/cartoes${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: body(data) }),
  excluir: (cliente: string, id: string) => api<void>(`${root}/${cliente}/cartoes/${id}`, { method: 'DELETE' }),
  preferencial: (cliente: string, id: string) => api<Cartao>(`${root}/${cliente}/cartoes/${id}/preferencial`, { method: 'PATCH' }),
}
