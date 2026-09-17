import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout, StoreLayout } from './components/Layouts'
import {
  CartPage,
  CatalogPage,
  CheckoutPage,
  CouponsPage,
  ExchangesPage,
  NotFoundPage,
  OrderDetailPage,
  OrdersPage,
  ProductDetailPage,
} from './pages/StorePages'
import { AddressesPage, AccountPage, CardsPage, CustomerRegistrationPage, ProfileSelectionPage, AdminCustomersPage } from './pages/CustomerPages'
import { ThemeProvider, createTheme } from '@mui/material'
import {
  AdminAnalyticsPage,
  AdminDashboardPage,
  AdminExchangesPage,
  AdminModulePage,
} from './pages/AdminPages'
import './App.css'
import { DemoProvider } from './context/DemoContext'

const theme = createTheme({ palette: { mode: 'light', primary: { main: '#ef691f' } }, typography: { fontFamily: 'inherit' } })
function App() {
  return (
    <ThemeProvider theme={theme}><DemoProvider><Routes>
      <Route path="perfis" element={<ProfileSelectionPage />} />

      <Route element={<StoreLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="clientes/novo" element={<CustomerRegistrationPage />} />
        <Route path="produtos/:productId" element={<ProductDetailPage />} />
        <Route path="carrinho" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="conta" element={<AccountPage />} />
        <Route path="conta/enderecos" element={<AddressesPage />} />
        <Route path="conta/cartoes" element={<CardsPage />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="pedidos/:orderId" element={<OrderDetailPage />} />
        <Route path="trocas" element={<ExchangesPage />} />
        <Route path="cupons" element={<CouponsPage />} />
      </Route>

      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route
          path="produtos"
          element={<AdminModulePage module="products" />}
        />
        <Route
          path="clientes"
          element={<AdminCustomersPage />}
        />
        <Route
          path="estoque"
          element={<AdminModulePage module="inventory" />}
        />
        <Route
          path="pedidos"
          element={<AdminModulePage module="orders" />}
        />
        <Route
          path="trocas"
          element={<AdminExchangesPage />}
        />
        <Route path="analises" element={<AdminAnalyticsPage />} />
        <Route path="inicio" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes></DemoProvider></ThemeProvider>
  )
}

export default App
