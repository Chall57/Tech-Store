import { api, body } from './api'
export type Dominio = { id: string; nome: string }
export type Produto = {
  id: string; nome: string; marca: string; descricao: string; imagem: string
  preco: number; custo: number; ativo: boolean; grupoPrecificacaoId: string
  categorias: Dominio[]; quantidade: number; reservado: number
  justificativaStatus?: string; categoriaStatus?: string
}
export type ProdutoInput = Omit<Produto, 'id' | 'categorias' | 'reservado'> & { categorias: string[] }
export const produtoService = {
  listar: () => api<Produto[]>('/produtos'),
  consultar: (id: string) => api<Produto>('/produtos/' + id),
  salvar: (data: ProdutoInput, id?: string) => api<Produto>('/produtos' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: body(data) }),
  dominios: () => api<{ categorias: Dominio[]; grupos: Dominio[] }>('/dominios/catalogo'),
}
