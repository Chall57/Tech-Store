import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, LinearProgress } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { MockEditor } from '../components/MockEditor'
import { ApiFeedback } from '../components/ApiFeedback'
import { CustomerTransactions } from '../components/CustomerTransactions'
import { addressFields, addressInput, cardFields, customerInput, personalFields, passwordFields, validatePassword } from '../components/CustomerFormFields'
import { useDemoStore } from '../context/DemoContext'
import { clienteService, cartaoService, type Cliente, type Endereco, type Cartao } from '../services/clienteService'
import { vendaService } from '../services/vendaService'
import { errorMessage } from '../services/api'

export function AccountMenu() {
  return <aside className="panel account-menu"><Link to="/conta">Dados pessoais</Link><Link to="/conta/enderecos">Endereços</Link><Link to="/conta/cartoes">Cartões</Link><Link to="/pedidos">Pedidos e transações</Link><Link to="/trocas">Trocas</Link><Link to="/cupons">Cupons</Link></aside>
}
export function ChooseProfile() { return <div className="panel empty-state"><p>Selecione um perfil de cliente para continuar.</p><Link className="button" to="/perfis">Escolher perfil</Link></div> }
export function ProfileSelectionPage() {
  const { customers: allCustomers, selectCustomer } = useDemoStore()
  const customers = allCustomers.filter(c => c.selecionavel)
  return <main className="profile-selection"><section><div className="brand profile-brand"><span className="brand__mark">T</span><span><strong>Tech Store</strong><small>minha conta</small></span></div><span className="eyebrow">CONTAS</span><h1>Escolha um perfil</h1><p>Selecione uma conta para continuar.</p><ApiFeedback /><div className="profile-grid">
    <Link to="/admin" className="profile-card" onClick={() => selectCustomer('ADMIN')}><span>AD</span><div><strong>Administrador</strong><small>Gestão da loja</small></div><b>→</b></Link>
    {customers.map(c => <Link to="/conta" className="profile-card" key={c.id} onClick={() => selectCustomer(c.id)}><span>{c.nome.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('')}</span><div><strong>{c.nome}</strong><small>{c.ativo ? 'Minha conta' : 'Cadastro inativo'}</small></div><b>→</b></Link>)}
    <Link to="/clientes/novo" className="profile-card"><span>＋</span><div><strong>Cadastrar cliente</strong><small>Criar uma nova conta</small></div><b>→</b></Link>
    </div><Link className="back-store" to="/" onClick={() => selectCustomer('')}>Continuar como visitante</Link></section></main>
}
export function CustomerRegistrationPage() {
  const navigate = useNavigate()
  const { addCustomer } = useDemoStore()
  return <section className="page-width standard-page"><div className="page-title"><span className="eyebrow">CADASTRO DE CLIENTE</span><h1>Novo cliente</h1><p>Preencha os dados pessoais e o endereço inicial. O mesmo endereço pode ser residencial, de entrega e de cobrança.</p></div>
    <MockEditor title="Cadastrar cliente" description="Senha: pelo menos 8 caracteres, maiúscula, minúscula e caractere especial." fields={[...personalFields(), ...passwordFields, ...addressFields(undefined, true)]} submitLabel="Cadastrar e consultar"
      onSave={async values => { const c = await addCustomer(customerInput(values, true)); navigate('/admin/clientes?cliente=' + c.id) }} onClose={() => navigate('/perfis')} />
  </section>
}
export function CustomerDetails({ customer }: { customer: Cliente }) {
  const query = useQuery({ queryKey: ['transacoes', customer.id], queryFn: () => vendaService.transacoes(customer.id) })
  return <div className="customer-details"><section className="panel profile-form">
    <div className="form-grid">{personalFields(customer).map(f => <label key={f.name}>{f.label}<input value={f.value} readOnly /></label>)}
      <label>Código do cliente<input value={customer.id} readOnly /></label><label>Status<input value={customer.ativo ? 'Ativo' : 'Inativo'} readOnly /></label>
      <label>Ranking de compras<input value={customer.ranking} readOnly /></label>
    </div>
    </section>
    {query.isLoading && <LinearProgress />}
    {query.error && <Alert severity="error">{errorMessage(query.error)}</Alert>}
    {query.data && <CustomerTransactions data={query.data} />}
  </div>
}
export function CustomerActions({ customer }: { customer: Cliente }) {
  const { updateCustomer, setCustomerStatus, mutate } = useDemoStore()
  const [editor, setEditor] = useState<'dados' | 'status' | 'senha' | null>(null)
  return <><div className="heading-actions">
    <button className="text-button" disabled={editor !== null} onClick={() => setEditor('dados')}>Editar dados</button>
    <button className="text-button" disabled={editor !== null} onClick={() => setEditor('senha')}>Alterar senha</button>
    <button className="text-button" disabled={editor !== null} onClick={() => setEditor('status')}>{customer.ativo ? 'Inativar cliente' : 'Reativar cliente'}</button>
  </div>
  {editor === 'dados' && <MockEditor key={'dados-' + customer.id} title="Alterar dados pessoais" description="A alteração preserva endereços, cartões e histórico." fields={personalFields(customer)} onSave={async v => { await updateCustomer(customer.id, customerInput(v)); setEditor(null) }} onClose={() => setEditor(null)} />}
  {editor === 'senha' && <MockEditor title="Alterar senha" description="A senha não é exibida nem utilizada para restringir a seleção local de perfis." fields={passwordFields} onSave={async v => {
    validatePassword(v); await mutate(() => clienteService.senha(customer.id, v.senha, v.confirmacaoSenha), 'Senha alterada com sucesso.'); setEditor(null)
  }} onClose={() => setEditor(null)} />}
  {editor === 'status' && <MockEditor title={customer.ativo ? 'Inativar cliente' : 'Reativar cliente'} description="O cadastro e seu histórico serão preservados. Inativar não exclui o cliente." fields={[{ name: 'cliente', label: 'Cliente', value: customer.nome, readOnly: true }]}
    submitLabel={customer.ativo ? 'Confirmar inativação' : 'Confirmar reativação'} onSave={async () => { await setCustomerStatus(customer.id, !customer.ativo); setEditor(null) }} onClose={() => setEditor(null)} />}
  </>
}
export function AccountPage() {
  const { activeCustomerId } = useDemoStore()
  const query = useQuery({ queryKey: ['cliente', activeCustomerId], queryFn: () => clienteService.consultar(activeCustomerId), enabled: !!activeCustomerId })
  if (!activeCustomerId) return <ChooseProfile />
  return <section className="page-width standard-page"><div className="page-title"><span className="eyebrow">MINHA CONTA</span><h1>Dados pessoais</h1></div><div className="account-grid"><AccountMenu /><div>
    {query.isLoading && <LinearProgress />}{query.error && <Alert severity="error">{errorMessage(query.error)}</Alert>}
    {query.data && <><h2>{query.data.nome}</h2><CustomerActions customer={query.data} /><CustomerDetails customer={query.data} /></>}
  </div></div></section>
}
export function AddressesPage() {
  const { activeCustomerId, addresses, saveAddress, removeAddress } = useDemoStore()
  const [editing, setEditing] = useState<Endereco | 'new' | null>(null)
  if (!activeCustomerId) return <ChooseProfile />
  return <section className="page-width standard-page"><div className="page-title"><span className="eyebrow">MINHA CONTA</span><h1>Endereços</h1><p>Mantenha ao menos um endereço residencial, um de entrega e um de cobrança.</p></div><div className="account-grid"><AccountMenu /><div>
    <div className="manage-heading"><h2>Endereços cadastrados</h2><button className="button" disabled={editing !== null} onClick={() => setEditing('new')}>＋ Novo endereço</button></div>
    <div className="manage-grid">{addresses.map(a => <article className="panel manage-card" key={a.id}><div><span className="manage-icon">⌖</span><strong>{a.nome}</strong></div><p>{a.line}</p><small>{a.type}</small><footer><button onClick={() => setEditing(a)}>Editar</button><button onClick={() => void removeAddress(a.id).catch(() => undefined)}>Excluir</button></footer></article>)}</div>
    {editing && <MockEditor key={editing === 'new' ? 'new' : editing.id} title={editing === 'new' ? 'Adicionar endereço' : 'Editar endereço'} description="A atualização deste endereço não altera os outros dados cadastrais." fields={addressFields(editing === 'new' ? undefined : editing)} onSave={async v => {
      await saveAddress(addressInput(v), editing === 'new' ? undefined : editing.id); setEditing(current => current === editing ? null : current)
    }} onClose={() => setEditing(current => current === editing ? null : current)} />}
  </div></div></section>
}
export function CardsPage() {
  const { activeCustomerId, cards, saveCard, removeCard, setPreferredCard } = useDemoStore()
  const [editing, setEditing] = useState<Cartao | 'new' | null>(null)
  const brands = useQuery({ queryKey: ['bandeiras'], queryFn: cartaoService.bandeiras })
  if (!activeCustomerId) return <ChooseProfile />
  return <section className="page-width standard-page"><div className="page-title"><span className="eyebrow">MINHA CONTA</span><h1>Cartões</h1><p>Cadastre cartões e escolha um como preferencial.</p></div><div className="account-grid"><AccountMenu /><div>
    {brands.error && <Alert severity="error">{errorMessage(brands.error)}</Alert>}
    <div className="manage-heading"><h2>Cartões cadastrados</h2><button className="button" disabled={!brands.data || editing !== null} onClick={() => setEditing('new')}>＋ Novo cartão</button></div>
    {cards.length === 0 && <p>Nenhum cartão cadastrado.</p>}
    <div className="manage-grid">{cards.map(c => <article className="panel credit-card" key={c.id}><span>{c.bandeira}</span><strong>•••• •••• •••• {c.ultimosDigitos}</strong><p>{c.titular}<small>Validade {c.validade}</small></p>{c.preferencial && <em>★ Cartão preferencial</em>}<footer><button onClick={() => setEditing(c)}>Editar</button>{!c.preferencial && <button onClick={() => void setPreferredCard(c.id).catch(() => undefined)}>Tornar preferencial</button>}<button onClick={() => void removeCard(c.id).catch(() => undefined)}>Excluir</button></footer></article>)}</div>
    {editing && <MockEditor key={editing === 'new' ? 'new' : editing.id} title={editing === 'new' ? 'Adicionar cartão' : 'Editar cartão'} description="Use somente cartões fictícios de teste. Número completo e código de segurança não serão armazenados." fields={cardFields(brands.data ?? [], editing === 'new' ? undefined : editing)} onSave={async v => {
      await saveCard({ bandeira: v.bandeira, titular: v.titular, validade: v.validade, preferencial: v.preferencial === 'true', ...(editing === 'new' ? { numero: v.numeroCartao, codigoSeguranca: v.codigoSeguranca } : {}) }, editing === 'new' ? undefined : editing.id); setEditing(current => current === editing ? null : current)
    }} onClose={() => setEditing(current => current === editing ? null : current)} />}
  </div></div></section>
}
export function AdminCustomersPage() {
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState(params.get('cliente') ?? '')
  const list = useQuery({ queryKey: ['clientes', filters], queryFn: () => clienteService.listar(filters) })
  const selected = useQuery({ queryKey: ['cliente', selectedId], queryFn: () => clienteService.consultar(selectedId), enabled: !!selectedId })
  return <><div className="admin-page-heading"><div><span className="eyebrow">RELACIONAMENTO</span><h1>Clientes</h1><p>Consulte cadastros e o histórico de transações.</p></div><Link className="button" to="/clientes/novo">Cadastrar cliente</Link></div>
    <MockEditor title="Filtros de clientes" description="Combine os campos ou consulte por qualquer campo isoladamente." successMessage={null} fields={[
      { name: 'id', label: 'Código do cliente' }, ...personalFields().map(f => ({ ...f, required: false })),
      { name: 'ativo', label: 'Ativo', type: 'select', options: ['', 'true', 'false'] },
    ]} submitLabel="Consultar clientes" onSave={v => { setFilters(v); setSelectedId('') }} onClose={() => { setFilters({}); setSelectedId('') }} />
    {list.isLoading && <LinearProgress />}{list.error && <Alert severity="error">{errorMessage(list.error)}</Alert>}
    <section className="admin-panel quick-table"><table><thead><tr>{['Código', 'Cliente', 'E-mail', 'Cadastro', 'Status', 'Ações'].map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {(list.data ?? []).map(c => <tr key={c.id}><td>{c.id}</td><td>{c.nome}</td><td>{c.email}</td><td>{new Date(c.criadoEm).toLocaleDateString('pt-BR')}</td><td>{c.ativo ? 'Ativo' : 'Inativo'}</td><td><button className="table-action" onClick={() => setSelectedId(c.id)}>Consultar / alterar</button></td></tr>)}
    </tbody></table>{list.data?.length === 0 && <p>Nenhum cliente encontrado.</p>}</section>
    {selected.isLoading && selectedId && <LinearProgress />}{selected.error && <Alert severity="error">{errorMessage(selected.error)}</Alert>}
    {selected.data && <section className="admin-panel"><h2>Cliente: {selected.data.nome}</h2><CustomerActions key={selected.data.id} customer={selected.data} /><CustomerDetails customer={selected.data} /></section>}
  </>
}
