// Metadados visuais; não há registros de negócio neste arquivo.
export type Product = { id: string; name: string; brand: string; category: string; price: number; cost: number; stock: number; color: string; description: string; imagePath: string; specs: string[] }
export const adminTables = {
  products: { eyebrow: 'Catálogo', title: 'Produtos', description: 'Cadastro básico de hardware, preço e disponibilidade.', columns: ['Código', 'Produto', 'Categoria', 'Preço', 'Estoque', 'Status'] },
  inventory: { eyebrow: 'Operação', title: 'Estoque', description: 'Quantidade persistida por produto. Movimentações completas serão implementadas na etapa de estoque.', columns: ['Código', 'Produto', 'Disponível', 'Reservado', 'Custo', 'Situação'] },
  orders: { eyebrow: 'Vendas', title: 'Pedidos', description: 'Consulta dos pedidos registrados.', columns: ['Pedido', 'Cliente', 'Data', 'Itens', 'Total', 'Status'] },
} as const
