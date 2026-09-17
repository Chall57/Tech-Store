import { useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MockAiChat } from './MockAiChat'
import { ApiFeedback } from './ApiFeedback'
import { useDemoStore } from '../context/DemoContext'

const storeLinks = [
  { to: '/', label: 'Produtos', end: true },
  { to: '/pedidos', label: 'Meus pedidos' },
  { to: '/trocas', label: 'Trocas' },
  { to: '/cupons', label: 'Cupons' },
  { to: '/conta', label: 'Conta' },
]

const adminLinks = [
  { to: '/admin', label: 'Visão geral', icon: '▦', end: true },
  { to: '/admin/produtos', label: 'Produtos', icon: '▤' },
  { to: '/admin/clientes', label: 'Clientes', icon: '♙' },
  { to: '/admin/estoque', label: 'Estoque', icon: '▥' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: '◫' },
  { to: '/admin/trocas', label: 'Trocas', icon: '↺' },
  { to: '/admin/analises', label: 'Análise de vendas', icon: '⌁' },
]

function customerInitials(name?: string) {
  if (!name) return '—'
  const relevantNames = name.split(' ').filter((part) => !['da', 'de', 'do', 'das', 'dos'].includes(part.toLocaleLowerCase('pt-BR')))
  return relevantNames.map((part) => part[0]).slice(0, 2).join('').toLocaleUpperCase('pt-BR')
}

export function StoreLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const { activeCustomerId, customers, cart, notification, clearNotification } = useDemoStore()
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const activeCustomer = customers.find((customer) => customer.id === activeCustomerId)

  const searchProducts = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchTerm.trim()
    navigate(query ? `/?busca=${encodeURIComponent(query)}` : '/')
  }

  return (
    <div className="store-shell">
      <header className="store-header">
        <div className="store-header__main page-width">
          <NavLink className="brand" to="/" aria-label="Tech Store - início">
            <span className="brand__mark">T</span>
            <span><strong>TECH STORE</strong><small>componentes de hardware</small></span>
          </NavLink>
          <form className="search" onSubmit={searchProducts}>
            <label className="sr-only" htmlFor="store-search">Buscar produtos</label>
            <input id="store-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Busque por produto, marca ou categoria" type="search" />
            <button type="submit" aria-label="Buscar">Buscar</button>
          </form>
          <div className="header-actions">
            <NavLink to="/perfis" className="header-action">
              <span className="header-action__icon" aria-hidden="true">{customerInitials(activeCustomer?.name)}</span><span><small>Minha conta</small><strong title={activeCustomer?.name}>{activeCustomer?.name ?? 'Selecionar perfil'}</strong></span>
            </NavLink>
            <NavLink to="/carrinho" className="header-action cart-action">
              <span className="header-action__icon" aria-hidden="true">▱</span><span><small>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</small><strong>Carrinho</strong></span>{cartCount > 0 && <b>{cartCount}</b>}
            </NavLink>
          </div>
        </div>
        <nav className="store-nav" aria-label="Navegação principal">
          <div className="page-width store-nav__inner">
            <div className="store-nav__links">
              {storeLinks.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? 'active' : undefined}>{link.label}</NavLink>)}
            </div>
            <NavLink to="/perfis" className="admin-shortcut">Trocar perfil →</NavLink>
          </div>
        </nav>
      </header>
      <main className="store-content"><ApiFeedback /><Outlet /></main>
      {location.pathname === '/' && <MockAiChat />}
      {notification && <div className={`demo-notification demo-notification--${notification.tone}`} role="status"><span>{notification.message}</span><button type="button" onClick={clearNotification} aria-label="Fechar notificação">×</button></div>}
      <footer className="store-footer">
        <div className="page-width store-footer__grid">
          <div><div className="brand brand--footer"><span className="brand__mark">T</span><strong>TECH STORE</strong></div><p>Componentes de hardware para o seu computador.</p></div>
          <div><strong>Compras</strong><NavLink to="/carrinho">Carrinho</NavLink><NavLink to="/pedidos">Pedidos</NavLink></div>
          <div><strong>Minha conta</strong><NavLink to="/conta/cartoes">Cartões</NavLink><NavLink to="/conta/enderecos">Endereços</NavLink></div>
          <div><strong>Trocas e cupons</strong><NavLink to="/trocas">Solicitar troca</NavLink><NavLink to="/cupons">Consultar cupons</NavLink></div>
          <div><strong>Atendimento</strong><p>Acompanhe seus pedidos, pagamentos e solicitações de troca.</p></div>
        </div>
      </footer>
    </div>
  )
}

export function AdminLayout() {
  const { notification, clearNotification } = useDemoStore()
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="brand brand--admin" to="/" aria-label="Tech Store — início"><span className="brand__mark">T</span><span><strong>Tech Store</strong><small>Administração</small></span></NavLink>
        <nav aria-label="Navegação administrativa">
          <span className="sidebar-label">GESTÃO</span>
          {adminLinks.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? 'active' : undefined}><span aria-hidden="true">{link.icon}</span>{link.label}</NavLink>)}
        </nav>
        <div className="sidebar-footer"><NavLink to="/perfis">← Trocar perfil</NavLink></div>
      </aside>
      <section className="admin-workspace">
        <header className="admin-topbar"><div className="admin-user"><span className="avatar">AD</span><span><strong>Administrador</strong><small>Gestão da loja</small></span></div></header>
        <main className="admin-content"><ApiFeedback /><Outlet /></main>
      </section>
      {notification && <div className={`demo-notification demo-notification--${notification.tone}`} role="status"><span>{notification.message}</span><button type="button" onClick={clearNotification} aria-label="Fechar notificação">×</button></div>}
    </div>
  )
}
