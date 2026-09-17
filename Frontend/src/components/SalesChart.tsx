import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Checkbox, FormControlLabel, LinearProgress, TextField } from '@mui/material'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { analiseService, type AnaliseVendas, type FiltroVendas } from '../services/analiseService'
import { produtoService } from '../services/produtoService'
import { errorMessage } from '../services/api'

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const date = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
function period(months: number) {
  const now = new Date()
  return { inicio: date(new Date(now.getFullYear(), now.getMonth() - months + 1, 1)), fim: date(new Date(now.getFullYear(), now.getMonth() + 1, 0)) }
}
function Chart({ data }: { data: AnaliseVendas }) {
  const element = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!element.current) return
    const chart = echarts.init(element.current)
    chart.setOption({
      color: data.series.map((_, i) => `hsl(${i * 137.508 % 360},65%,42%)`),
      tooltip: { trigger: 'axis', valueFormatter: (value: unknown) => brl(Number(value)) },
      legend: { bottom: 0, icon: 'circle', type: 'scroll' },
      grid: { left: 12, right: 16, top: 24, bottom: 55, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: data.meses.map(m => m.slice(5) + '/' + m.slice(0, 4)), axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: { formatter: brl }, splitLine: { lineStyle: { color: '#edf0f5' } } },
      series: data.series.map(s => ({ name: s.nome, type: 'line', data: s.valores, connectNulls: false })),
    })
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(element.current)
    return () => { observer.disconnect(); chart.dispose() }
  }, [data])
  return <div ref={element} className="sales-chart" aria-label="Gráfico de linhas de vendas mensais por categoria" />
}
export function SalesChart() {
  const domains = useQuery({ queryKey: ['dominios-catalogo'], queryFn: produtoService.dominios })
  const [dates, setDates] = useState(() => period(6))
  const [selected, setSelected] = useState<string[] | null>(null)
  const [filter, setFilter] = useState<FiltroVendas | null>(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const categories = selected ?? domains.data?.categorias.map(c => c.id) ?? []
  const initial = { ...dates, categorias: categories }
  const applied = filter ?? { ...period(6), categorias: domains.data?.categorias.map(c => c.id) ?? [] }
  const query = useQuery({ queryKey: ['analise-vendas', applied], queryFn: () => analiseService.consultar(applied), enabled: !!domains.data, retry: false })
  const exportData = async () => {
    setError(''); setExporting(true)
    try {
      const blob = await analiseService.exportar(applied)
      const url = URL.createObjectURL(blob), anchor = document.createElement('a')
      anchor.href = url; anchor.download = 'tech-store-vendas.csv'; anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (cause) { setError(errorMessage(cause)) } finally { setExporting(false) }
  }
  return <>
    <Box component="form" aria-label="Filtros de vendas" onSubmit={e => { e.preventDefault(); setError(''); setFilter(initial) }} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
      <TextField label="Data inicial" name="inicio" type="date" value={dates.inicio} onChange={e => setDates({ ...dates, inicio: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
      <TextField label="Data final" name="fim" type="date" value={dates.fim} onChange={e => setDates({ ...dates, fim: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
      {[3, 6, 12, 24].map(n => <Button key={n} type="button" onClick={() => setDates(period(n))}>{n} meses</Button>)}
      <Box sx={{ width: '100%' }}>{domains.data?.categorias.map(c => <FormControlLabel key={c.id} label={c.nome} control={<Checkbox name={'categoria-' + c.id} checked={categories.includes(c.id)} onChange={e => setSelected(e.target.checked ? [...categories, c.id] : categories.filter(id => id !== c.id))} />} />)}</Box>
      <Button variant="contained" type="submit">Aplicar filtros</Button>
      <Button type="button" onClick={() => setSelected(domains.data?.categorias.map(c => c.id) ?? [])}>Todas as categorias</Button>
      <Button type="button" onClick={() => setSelected([])}>Limpar categorias</Button>
      <Button type="button" disabled={!query.data || query.isFetching || query.isError || exporting} onClick={() => void exportData()}>Exportar planilha (CSV)</Button>
    </Box>
    {(domains.isLoading || query.isFetching) && <LinearProgress />}
    {(error || domains.error || query.error) && <Alert severity="error">{error || errorMessage(domains.error ?? query.error)}</Alert>}
    {query.data && !query.isError && <><p>{query.data.criterio}</p><Chart data={query.data} />
      <details><summary>Dados do gráfico</summary><table aria-label="Dados de vendas"><thead><tr><th>Mês</th>{query.data.series.map(s => <th key={s.categoriaId}>{s.nome}</th>)}</tr></thead><tbody>{query.data.meses.map((m, i) => <tr key={m}><td>{m.slice(5) + '/' + m.slice(0, 4)}</td>{query.data?.series.map(s => <td key={s.categoriaId}>{brl(s.valores[i])}</td>)}</tr>)}</tbody></table></details></>}
  </>
}
