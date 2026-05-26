const fleetCells = [
  'on','','on','amber','on','',
  '','on','on','','amber','on',
  'on','amber','','on','','on',
]

const signalHeights = ['30%','48%','70%','55%','90%','62%','40%','78%','50%','35%']

const customers = [
  { initials: 'TV', name: 'Transvale Logística', count: '14 veíc.' },
  { initials: 'CC', name: 'Carga & Caminho',     count: '38 veíc.' },
  { initials: 'PC', name: 'PampaCargo',           count: '112 veíc.' },
  { initials: 'NV', name: 'Norteville',           count: '6 veíc.' },
]

export function FeaturesSection() {
  return (
    <section id="recursos" className="px-8 py-24 lg:px-22 lg:py-28">
      <div className="mb-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-3">Módulos</p>
          <h2 className="mt-3 max-w-2xl font-display text-5xl leading-tight tracking-tight lg:text-7xl">
            Tudo que sua transportadora precisa,{' '}
            <em className="italic text-amber-deep">e nada que ela não precisa</em>.
          </h2>
        </div>
        <p className="max-w-sm text-base text-ink-2 lg:pb-2">
          Da onboarding do cliente até a leitura do rastreador no asfalto — todos os módulos
          conversam pelo mesmo tenant, sem integração arrastada.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* 01 Veículos */}
        <div className="rounded-2xl border border-line bg-paper p-6 lg:col-span-7">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">01 · Veículos</p>
          <h3 className="mt-2.5 font-display text-3xl font-normal leading-tight">
            Cadastro de frota com máscara de placa Mercosul, ano e renavam.
          </h3>
          <p className="mt-2 max-w-sm text-sm text-ink-2">
            Vínculo direto cliente → veículo → rastreador → chip. Histórico de manutenção
            e troca de motorista sem precisar abrir planilha.
          </p>
          <div className="mt-6 grid grid-cols-6 gap-1.5">
            {fleetCells.map((state, i) => (
              <div
                key={i}
                className={`aspect-square rounded-md border ${
                  state === 'on'    ? 'border-ink bg-ink' :
                  state === 'amber' ? 'border-amber-deep bg-amber-deep' :
                  'border-line bg-bg-warm'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 02 Rastreadores */}
        <div className="rounded-2xl bg-ink p-6 text-paper lg:col-span-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50">02 · Rastreadores</p>
          <h3 className="mt-2.5 font-display text-3xl font-normal leading-tight">
            Telemetria a cada 30 segundos com IMEI validado.
          </h3>
          <p className="mt-2 max-w-xs text-sm text-paper/70">
            Compatível com Suntech, Queclink, Teltonika. Recebimento via webhook + buffer offline.
          </p>
          <div className="mt-6 flex h-24 items-end gap-1.5">
            {signalHeights.map((h, i) => {
              const isAmber = [2, 4, 7].includes(i)
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${isAmber ? 'bg-amber-deep' : 'bg-paper'}`}
                  style={{ height: h }}
                />
              )
            })}
          </div>
        </div>

        {/* 03 Chips */}
        <div className="rounded-2xl border border-line bg-paper p-6 lg:col-span-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">03 · Chips</p>
          <h3 className="mt-2.5 font-display text-3xl font-normal leading-tight">
            1 chip por rastreador, vinculado para sempre.
          </h3>
          <p className="mt-2 text-sm text-ink-2">ICCID, operadora e status num clique. Sem chip órfão na operação.</p>
          <div className="relative mt-5 aspect-[1.6] overflow-hidden rounded-xl bg-gradient-to-br from-[#2C2A26] to-[#0F0E0C] p-4 font-mono text-[11px] text-[#E8DFC9]">
            <div className="absolute right-4 top-4 h-7 w-10 rounded bg-gradient-to-br from-[#C9A878] to-[#8A6E3F]" />
            <span className="block text-sm tracking-widest">8955 1023 4711 0029</span>
            <div className="mt-auto flex justify-between text-[9px] text-[#E8DFC9]/60 pt-6">
              <span>VIVO M2M</span>
              <span>● ATIVO</span>
            </div>
          </div>
        </div>

        {/* 04 Clientes */}
        <div className="rounded-2xl border border-line bg-paper p-6 lg:col-span-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">04 · Clientes</p>
          <h3 className="mt-2.5 font-display text-3xl font-normal leading-tight">
            CNPJ, contato e responsável — com máscara.
          </h3>
          <p className="mt-2 text-sm text-ink-2">Onboarding em menos de 90 segundos e zero ambiguidade entre filiais.</p>
          <div className="mt-4">
            {customers.map(({ initials, name, count }) => (
              <div key={name} className="flex items-center gap-3 border-b border-line/80 py-2.5 last:border-0 text-sm">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-bg-warm-2 text-[11px] font-semibold text-ink-2">
                  {initials}
                </div>
                <span className="flex-1">{name}</span>
                <span className="font-mono text-[11px] text-ink-3">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 05 Equipe */}
        <div className="rounded-2xl p-6 lg:col-span-6" style={{ background: 'linear-gradient(135deg, oklch(0.78 0.13 60), oklch(0.65 0.16 45))' }}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[rgba(26,18,8,0.6)]">05 · Equipe</p>
          <h3 className="mt-2.5 font-display text-3xl font-normal leading-tight text-[#1a1208]">
            Até 3 operadores por conta — sem dor.
          </h3>
          <p className="mt-2 text-sm text-[rgba(26,18,8,0.7)]">
            Admin + 3 usuários, controle por papéis. Sem cobrar por assento extra que não vai ser usado.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {['AD', 'MR', 'JS'].map((i, idx) => (
              <div key={i} className={`grid size-11 place-items-center rounded-full text-sm font-semibold ${idx === 0 ? 'bg-ink text-amber' : 'bg-[#1a1208] text-paper'}`}>
                {i}
              </div>
            ))}
            <div className="grid size-11 place-items-center rounded-full border border-dashed border-line-2 text-ink-3">+</div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(26,18,8,0.15)]">
              <div className="h-full w-3/4 rounded-full bg-[#1a1208]" />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-[rgba(26,18,8,0.5)]">
              <span>3 DE 3 USUÁRIOS</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* 06 Segurança */}
        <div className="rounded-2xl bg-ink p-6 text-paper lg:col-span-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-paper/50">06 · Segurança</p>
          <h3 className="mt-2.5 font-display text-3xl font-normal leading-tight">
            Isolamento por tenant, JWT com rotação e logs auditáveis.
          </h3>
          <p className="mt-2 text-sm text-paper/70">
            Cada empresa enxerga apenas o que é dela. Compliance LGPD por padrão, não por checkbox.
          </p>
          <div className="relative mt-6 flex h-36 items-center justify-center">
            <div className="absolute size-40 rounded-full border border-paper/20" />
            <div className="absolute size-28 rounded-full border border-paper/20" />
            <div className="absolute size-20 rounded-full border border-paper/20" />
            <div className="relative grid size-14 place-items-center rounded-2xl bg-amber font-display text-2xl italic text-ink">
              🔐
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
