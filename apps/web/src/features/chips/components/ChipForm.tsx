import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { cn } from '@/lib/utils'
import type { Chip, Tracker } from '@/shared/types/api'
import { trackersApi } from '../../trackers/api/trackers.api'

const schema = z.object({
  iccid: z.string().min(18, 'ICCID inválido'),
  phoneNumber: z.string().min(10, 'Número inválido'),
  provider: z.string().min(2, 'Informe a operadora'),
  trackerId: z.string().min(1, 'Selecione um rastreador'),
})

export type ChipFormData = z.infer<typeof schema>

const inputBase = cn(
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50',
)

export function ChipForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<Chip>
  onSubmit: (data: ChipFormData) => Promise<void>
  onCancel: () => void
}) {
  const [trackers, setTrackers] = useState<Tracker[]>([])

  useEffect(() => {
    trackersApi.getAll().then(setTrackers).catch(() => {})
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChipFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      iccid: initialData?.iccid ?? '',
      phoneNumber: initialData?.phoneNumber ?? '',
      provider: initialData?.provider ?? '',
      trackerId: initialData?.trackerId ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="ICCID" htmlFor="iccid" error={errors.iccid?.message} required>
        <input id="iccid" {...register('iccid')} placeholder="89550534000171234567" className={inputBase} />
      </FormField>

      <FormField label="Número de Telefone" htmlFor="phoneNumber" error={errors.phoneNumber?.message} required>
        <input id="phoneNumber" {...register('phoneNumber')} placeholder="11999999999" className={inputBase} />
      </FormField>

      <FormField label="Operadora" htmlFor="provider" error={errors.provider?.message} required>
        <input id="provider" {...register('provider')} placeholder="Vivo" className={inputBase} />
      </FormField>

      <FormField label="Rastreador" htmlFor="trackerId" error={errors.trackerId?.message} required>
        <select id="trackerId" {...register('trackerId')} className={inputBase}>
          <option value="">Selecione um rastreador</option>
          {trackers.map((t) => (
            <option key={t.id} value={t.id}>{t.imei} — {t.brand} {t.model}</option>
          ))}
        </select>
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">Cancelar</button>
        <button type="submit" disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {isSubmitting ? 'Salvando...' : initialData?.id ? 'Salvar alterações' : 'Cadastrar'}
        </button>
      </div>
    </form>
  )
}
