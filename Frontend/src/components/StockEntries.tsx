import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert } from '@mui/material'
import { estoqueService } from '../services/estoqueService'
import { useDemoStore } from '../context/DemoContext'
import { MockEditor } from './MockEditor'
import { errorMessage } from '../services/api'
import { localDate } from '../utils/localDate'

export function StockEntries() {
  const { products, mutate } = useDemoStore()
  const entries = useQuery({ queryKey: ['entradas-estoque'], queryFn: estoqueService.entradas })
  const suppliers = useQuery({ queryKey: ['fornecedores'], queryFn: estoqueService.fornecedores })
  const [editor, setEditor] = useState<'entrada' | 'fornecedor' | null>(null)
  return <section className="admin-panel"><div className="panel-heading"><h2>Entradas de estoque</h2><div className="heading-actions"><button className="button" disabled={!suppliers.data || editor !== null} onClick={() => setEditor('entrada')}>Registrar entrada</button><button className="button button--outline" disabled={editor !== null} onClick={() => setEditor('fornecedor')}>Cadastrar fornecedor</button></div></div>
    {(entries.error || suppliers.error) && <Alert severity="error">{errorMessage(entries.error ?? suppliers.error)}</Alert>}
    {entries.isLoading && <p>Carregando entradas…</p>}
    <table aria-label="Entradas de estoque"><thead><tr><th>Data</th><th>Produto</th><th>Fornecedor</th><th>Quantidade</th><th>Custo unitário</th></tr></thead><tbody>{entries.data?.map(e => <tr key={e.id}><td>{e.dataEntrada.split('-').reverse().join('/')}</td><td>{e.produto}</td><td>{e.fornecedor}</td><td>{e.quantidade}</td><td>{e.custoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>)}</tbody></table>
    {editor === 'fornecedor' && <MockEditor title="Cadastrar fornecedor" description="Fornecedor utilizado no registro das entradas." fields={[{ name: 'nome', label: 'Nome do fornecedor', required: true }]} onClose={() => setEditor(null)} onSave={async v => { await mutate(() => estoqueService.cadastrarFornecedor(v.nome), 'Fornecedor cadastrado.'); setEditor(null) }} />}
    {editor === 'entrada' && <MockEditor title="Registrar entrada de estoque" description="O maior custo registrado, acrescido da margem do grupo, será aplicado ao preço de todas as unidades." fields={[
      { name: 'produto', label: 'Produto', type: 'select', options: ['', ...products.map(p => p.id + ' — ' + p.name)], required: true },
      { name: 'fornecedor', label: 'Fornecedor', type: 'select', options: ['', ...(suppliers.data ?? []).map(f => f.id + ' — ' + f.nome)], required: true },
      { name: 'quantidade', label: 'Quantidade', type: 'number', required: true }, { name: 'custo', label: 'Custo unitário', type: 'number', required: true },
      { name: 'data', label: 'Data de entrada', type: 'date', value: localDate(), required: true },
    ]} onClose={() => setEditor(null)} onSave={async v => { await mutate(() => estoqueService.entrar({ produtoId: v.produto.split(' — ')[0], fornecedorId: v.fornecedor.split(' — ')[0], quantidade: Number(v.quantidade), custoUnitario: Number(v.custo), dataEntrada: v.data }), 'Entrada registrada e preço recalculado.'); setEditor(null) }} />}
  </section>
}
