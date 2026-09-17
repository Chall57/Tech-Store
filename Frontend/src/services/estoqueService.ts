import { api, body } from './api'
export type EntradaEstoque = { id: string; produtoId: string; produto: string; fornecedorId: string; fornecedor: string; quantidade: number; custoUnitario: number; dataEntrada: string }
export const estoqueService = {
  fornecedores: () => api<{ id: string; nome: string }[]>('/fornecedores'),
  cadastrarFornecedor: (nome: string) => api<{ id: string; nome: string }>('/fornecedores', { method: 'POST', body: body({ nome }) }),
  entradas: () => api<EntradaEstoque[]>('/estoque/entradas'),
  entrar: (data: Omit<EntradaEstoque, 'id' | 'produto' | 'fornecedor'>) => api<EntradaEstoque>('/estoque/entradas', { method: 'POST', body: body(data) }),
}
