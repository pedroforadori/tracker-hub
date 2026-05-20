import { use } from 'react'
import { ArrowRight, CreditCard, TrendingDown, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { getCustomersPromise, getVehiclesPromise } from '@/shared/store/entityPromises'
import type { Customer, Vehicle } from '@/shared/types/api'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function buildChartData(customers: Customer[], months = 7) {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0)
    const label = new Date(now.getFullYear(), now.getMonth() - offset, 1).toLocaleDateString('pt-BR', { month: 'short' })
    const mrr = customers
      .filter(c => c.status === 'ATIVO' && new Date(c.createdAt) <= monthEnd)
      .reduce((sum, c) => sum + Number(c.monthlyFee), 0)
    return { month: label.charAt(0).toUpperCase() + label.slice(1, 3), mrr }
  })
}

function computeMonthlyTrend(items: { createdAt: string }[]): number | null {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = items.filter(x => new Date(x.createdAt) >= thisMonthStart).length
  const lastMonth = items.filter(x => {
    const d = new Date(x.createdAt)
    return d >= lastMonthStart && d < thisMonthStart
  }).length
  if (lastMonth === 0) return null
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
}

interface StatCardProps {
  label: string
  value: string | number
  trend: number | null
  href: string
  trendInvert?: boolean
}

function StatCard({ label, value, trend, href, trendInvert }: StatCardProps) {
  const isPositive = trend !== null && (trendInvert ? trend < 0 : trend > 0)
  const isNegative = trend !== null && (trendInvert ? trend > 0 : trend < 0)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
          {label}
        </span>
        {trend !== null && (
          <span className={cn(
            'flex shrink-0 items-center gap-0.5 text-xs font-semibold',
            isPositive && 'text-teal-400',
            isNegative && 'text-destructive',
            !isPositive && !isNegative && 'text-muted-foreground',
          )}>
            {isPositive
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />}
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <Link to={href} className="mt-3 flex items-center text-muted-foreground hover:text-primary transition-colors">
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}

function MrrChart({ data }: { data: { month: string; mrr: number }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold">Crescimento de Escala</h2>
      <p className="mt-1 text-xs text-muted-foreground">MRR acumulado de clientes ativos</p>
      <div className="mt-6 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
            />
            <Tooltip
              formatter={(v: number) => [formatBRL(v), 'MRR']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: 12,
                color: 'hsl(var(--foreground))',
              }}
              cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#mrrGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#8b5cf6', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function FinancialHealth({ receita, fluxo }: { receita: number; fluxo: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
      <div className="flex items-center gap-2">
        <CreditCard size={16} className="text-primary" />
        <h2 className="text-base font-semibold">Saúde Financeira</h2>
      </div>

      <div className="mt-4 flex-1 space-y-3">
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Receita Auditada
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{formatBRL(receita)}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fluxo Pendente
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-400">{formatBRL(fluxo)}</p>
        </div>
      </div>

      <Link
        to="/customers"
        className="mt-5 block text-center text-xs font-semibold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
      >
        Relatório de Auditoria
      </Link>
    </div>
  )
}

export function DashboardPage() {
  const customers = use(getCustomersPromise())
  const vehicles = use(getVehiclesPromise())

  const activeCustomers = customers.filter(c => c.status === 'ATIVO')
  const inactiveCustomers = customers.filter(c => c.status === 'INATIVO')

  const mrr = activeCustomers.reduce((sum, c) => sum + Number(c.monthlyFee), 0)
  const totalMrr = customers.reduce((sum, c) => sum + Number(c.monthlyFee), 0)

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const mrrThisMonth = activeCustomers
    .filter(c => new Date(c.createdAt) >= thisMonthStart)
    .reduce((sum, c) => sum + Number(c.monthlyFee), 0)
  const mrrLastMonth = activeCustomers
    .filter(c => { const d = new Date(c.createdAt); return d >= lastMonthStart && d < thisMonthStart })
    .reduce((sum, c) => sum + Number(c.monthlyFee), 0)
  const mrrTrend = mrrLastMonth === 0 ? null : Math.round(((mrrThisMonth - mrrLastMonth) / mrrLastMonth) * 100)

  const chartData = buildChartData(customers)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Painel TrackerHub Control
        </p>
        <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Clientes Ativos"
          value={activeCustomers.length}
          trend={computeMonthlyTrend(activeCustomers)}
          href="/customers"
        />
        <StatCard
          label="MRR (Mensal)"
          value={formatBRL(mrr)}
          trend={mrrTrend}
          href="/customers"
        />
        <StatCard
          label="Ativos Monitorados"
          value={vehicles.length}
          trend={computeMonthlyTrend(vehicles)}
          href="/vehicles"
        />
        <StatCard
          label="Status de Alerta"
          value={inactiveCustomers.length}
          trend={computeMonthlyTrend(inactiveCustomers)}
          href="/customers"
          trendInvert
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <MrrChart data={chartData} />
        <FinancialHealth receita={mrr} fluxo={totalMrr - mrr} />
      </div>
    </div>
  )
}
