import { LogoMark } from '../atoms/LogoMark'

const vehicles = [
  { plate: 'RIO-2841', driver: 'João Silva',    initials: 'JS', tracker: 'SUNT 357 G', speed: '82 km/h', status: 'online', label: 'Em rota' },
  { plate: 'SPA-9013', driver: 'Maria Rocha',   initials: 'MR', tracker: 'QUEC P-12',  speed: '68 km/h', status: 'online', label: 'Em rota' },
  { plate: 'MGT-4477', driver: 'Carlos Alencar',initials: 'CA', tracker: 'SUNT 357 G', speed: '0 km/h',  status: 'idle',   label: 'Parado · 12min' },
  { plate: 'PRB-1206', driver: 'Eliana Faria',  initials: 'EF', tracker: 'QUEC P-12',  speed: '— —',     status: 'offline',label: 'Sem sinal' },
  { plate: 'BAH-7732', driver: 'Renan Dias',    initials: 'RD', tracker: 'SUNT 357 G', speed: '94 km/h', status: 'online', label: 'Em rota' },
]

const statusClasses: Record<string, string> = {
  online:  'bg-brand-green/15 text-green-700',
  idle:    'bg-bg-warm-2 text-ink-2',
  offline: 'bg-brand-red/10 text-red-700',
}

const dotClasses: Record<string, string> = {
  online:  'bg-brand-green',
  idle:    'bg-ink-3',
  offline: 'bg-brand-red',
}

const sideItems = [
  { icon: <DashIcon />, label: 'Painel',      count: '—',   active: true },
  { icon: <UsersIcon />,label: 'Clientes',    count: '128', active: false },
  { icon: <TruckIcon />,label: 'Veículos',    count: '412', active: false },
  { icon: <RadioIcon />,label: 'Rastreadores',count: '412', active: false },
  { icon: <ChipIcon />, label: 'Chips',       count: '412', active: false },
]

const accountItems = [
  { icon: <TeamIcon />,    label: 'Equipe',       count: '3/3' },
  { icon: <SettingsIcon />,label: 'Configurações', count: ''   },
]

export function DashboardMockup() {
  return (
    <div className="relative mt-14">
      <div className="pointer-events-none absolute -inset-10 top-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,oklch(0.65_0.17_50_/_0.18),transparent_70%)]" />
      <div className="relative overflow-hidden rounded-2xl border border-line-2 bg-paper shadow-[0_30px_60px_-30px_rgba(20,15,5,0.25),0_8px_20px_-10px_rgba(20,15,5,0.12)]">
        {/* Browser bar */}
        <div className="flex items-center gap-3 border-b border-line bg-[#F4F1E8] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
          </div>
          <div className="mx-auto flex max-w-sm flex-1 items-center justify-center rounded-full border border-line bg-bg-warm px-3.5 py-1.5 font-mono text-xs text-ink-3">
            app.trackerhub.com.br/<b className="text-ink-2 font-medium">painel</b>
          </div>
          <div className="w-11" />
        </div>

        {/* App shell */}
        <div className="grid grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="flex flex-col gap-1 border-r border-line bg-[#FAF7EE] px-3.5 py-4">
            <div className="mb-2 flex items-center gap-2 px-2.5 pb-2 font-semibold text-sm">
              <LogoMark size="sm" />
              TrackerHub
            </div>

            <p className="px-2.5 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-ink-3">Operação</p>
            {sideItems.map(({ icon, label, count, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                  active ? 'bg-ink text-paper' : 'text-ink-2'
                }`}
              >
                <span className={`size-4 ${active ? 'text-amber' : 'text-ink-3'}`}>{icon}</span>
                {label}
                <span className={`ml-auto font-mono text-[10.5px] ${active ? 'text-paper/70' : 'text-ink-3'}`}>
                  {count}
                </span>
              </div>
            ))}

            <p className="px-2.5 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-ink-3">Conta</p>
            {accountItems.map(({ icon, label, count }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-2">
                <span className="size-4 text-ink-3">{icon}</span>
                {label}
                {count && <span className="ml-auto font-mono text-[10.5px] text-ink-3">{count}</span>}
              </div>
            ))}
          </aside>

          {/* Main panel */}
          <main className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Painel da operação</h2>
                <p className="mt-0.5 text-xs text-ink-3">Sex · 17 mai · 14:32 · Atualizado há 8s</p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-paper px-3 py-1.5 text-xs text-ink-2">
                  <CalIcon /> Últimos 7 dias
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs text-paper">
                  + Novo veículo
                </span>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Veículos ativos', val: '412', delta: '▲ 4.2%', up: true },
                { label: 'Em rota agora',   val: '287', delta: '▲ 12',   up: true },
                { label: 'Chips ativos',    val: '412', delta: 'est.',    up: null },
                { label: 'Alertas hoje',    val: '7',   delta: '▼ 2',    up: false },
              ].map(({ label, val, delta, up }) => (
                <div key={label} className="rounded-xl border border-line bg-paper p-4">
                  <p className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">{label}</p>
                  <p className="mt-1.5 font-display text-4xl leading-none">{val}</p>
                  <p className={`mt-2.5 font-mono text-xs ${up === true ? 'text-brand-green' : up === false ? 'text-brand-red' : 'text-ink-3'}`}>
                    {delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Table + Map */}
            <div className="grid grid-cols-[1.4fr_1fr] gap-3.5">
              <div className="overflow-hidden rounded-xl border border-line bg-paper">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <span className="text-sm font-semibold">Veículos · em rota</span>
                  <span className="rounded-lg border border-line-2 px-3 py-1 text-xs text-ink-2">Filtrar</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line bg-[#FAF7EE]">
                      {['Placa', 'Motorista', 'Rastreador', 'Velocidade', 'Status'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-ink-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => (
                      <tr key={v.plate} className="border-b border-line last:border-0">
                        <td className="px-4 py-2.5 font-mono font-medium">{v.plate}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="grid size-6 place-items-center rounded-full bg-bg-warm-2 text-[10px] font-semibold text-ink-2">{v.initials}</div>
                            {v.driver}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-ink-3">{v.tracker}</td>
                        <td className="px-4 py-2.5 font-mono">{v.speed}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] ${statusClasses[v.status]}`}>
                            <span className={`size-1.5 rounded-full ${dotClasses[v.status]}`} />
                            {v.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between border-t border-line px-4 py-2.5 text-[11px] text-ink-3">
                  <span>Mostrando 5 de 412</span>
                  <span>Atualizado há 8 segundos</span>
                </div>
              </div>

              {/* Map */}
              <div className="overflow-hidden rounded-xl border border-line bg-paper">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <span className="text-sm font-semibold">Mapa · tempo real</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 px-3 py-1 text-xs text-ink-2">
                    <span className="size-1.5 rounded-full bg-brand-green" /> 87 ativos
                  </span>
                </div>
                <div className="relative aspect-[4/3.2] bg-gradient-to-b from-[#EFE9D8] to-[#E5DDC6]">
                  {/* Grid lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
                  {/* Roads */}
                  <div className="absolute" style={{ left: '8%', right: '6%', top: '42%', height: 2, background: 'rgba(19,18,17,0.55)', transform: 'rotate(-3deg)' }} />
                  <div className="absolute" style={{ left: '18%', right: '10%', top: '64%', height: 1, background: 'repeating-linear-gradient(90deg,rgba(19,18,17,0.35) 0 6px,transparent 6px 12px)', transform: 'rotate(2deg)' }} />
                  {/* Pin label */}
                  <div className="absolute -translate-y-full -translate-x-1/2 rounded-md bg-ink px-2 py-1 font-mono text-[10px] whitespace-nowrap text-paper" style={{ left: '32%', top: '38%' }}>
                    RIO-2841 · 82 km/h
                    <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-ink" />
                  </div>
                  {/* Pins */}
                  {[
                    { left: '32%', top: '42%', color: 'bg-amber-deep' },
                    { left: '58%', top: '30%', color: 'bg-brand-green' },
                    { left: '48%', top: '58%', color: 'bg-brand-green' },
                    { left: '72%', top: '48%', color: 'bg-slate-500' },
                    { left: '22%', top: '68%', color: 'bg-brand-green' },
                    { left: '80%', top: '70%', color: 'bg-amber-deep' },
                  ].map((p, i) => (
                    <span
                      key={i}
                      className={`absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper shadow-md ${p.color}`}
                      style={{ left: p.left, top: p.top }}
                    />
                  ))}
                  {/* Legend */}
                  <div className="absolute bottom-3 left-3 flex flex-col gap-1 rounded-lg border border-line bg-paper px-2.5 py-2 text-[11px]">
                    <span className="flex items-center gap-1.5 text-ink-2"><i className="inline-block size-2 rounded-full bg-amber-deep" />Em rota (alerta)</span>
                    <span className="flex items-center gap-1.5 text-ink-2"><i className="inline-block size-2 rounded-full bg-brand-green" />Em rota (ok)</span>
                    <span className="flex items-center gap-1.5 text-ink-2"><i className="inline-block size-2 rounded-full bg-slate-500" />Parado</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function DashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="size-4"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
}
function UsersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="size-4"><circle cx="9" cy="7" r="3"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><circle cx="17" cy="9" r="2"/></svg>
}
function TruckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M3 17h2l1-4h12l1 4h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 13V8h11l3 5"/></svg>
}
function RadioIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}
function ChipIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="size-4"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>
}
function TeamIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="size-4"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
}
function SettingsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="size-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5"/></svg>
}
function CalIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="size-3"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
