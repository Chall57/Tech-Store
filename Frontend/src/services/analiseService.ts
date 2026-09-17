import { api, apiFile } from './api'
export type FiltroVendas = { inicio: string; fim: string; categorias: string[] }
export type AnaliseVendas = { inicio: string; fim: string; meses: string[]; series: { categoriaId: string; nome: string; valores: number[] }[]; criterio: string }
const route = (f: FiltroVendas, exportar = false) => '/analises/vendas' + (exportar ? '/exportacao' : '') + '?' + new URLSearchParams({ inicio: f.inicio, fim: f.fim, categorias: f.categorias.join(',') })
export const analiseService = {
  consultar: (f: FiltroVendas) => api<AnaliseVendas>(route(f)),
  exportar: (f: FiltroVendas) => apiFile(route(f, true)),
}
