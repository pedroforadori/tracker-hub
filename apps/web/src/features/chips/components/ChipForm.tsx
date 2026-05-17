import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { FormActions } from '@/components/molecules/FormActions'
import { INPUT_BASE } from '@/shared/constants/styles'
import { useRelatedEntities } from '@/shared/hooks/useRelatedEntities'
import type { Chip, Tracker } from '@/shared/types/api'
import { trackersApi } from '../../trackers/api/trackers.api'

const schema = z.object({
  iccid: z.string().min(18, 'ICCID inválido'),
  phoneNumber: z.string().min(10, 'Número inválido'),
  provider: z.string().min(2, 'Informe a operadora'),
  trackerId: z.string().min(1, 'Selecione um rastreador'),
})

export type ChipFormData = z.infer<typeof schema>

export function ChipForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<Chip>
  onSubmit: (data: ChipFormData) => Promise<void>
  onCancel: () => void
}) {
  const isEditing = !!initialData?.id
  const trackers = useRelatedEntities<Tracker>(trackersApi.getAll)

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
        <input id="iccid" {...register('iccid')} placeholder="89550534000171234567" className={INPUT_BASE} />
      </FormField>

      <FormField label="Número de Telefone" htmlFor="phoneNumber" error={errors.phoneNumber?.message} required>
        <input id="phoneNumber" {...register('phoneNumber')} placeholder="11999999999" className={INPUT_BASE} />
      </FormField>

      <FormField label="Operadora" htmlFor="provider" error={errors.provider?.message} required>
        <input id="provider" {...register('provider')} placeholder="Vivo" className={INPUT_BASE} />
      </FormField>

      <FormField label="Rastreador" htmlFor="trackerId" error={errors.trackerId?.message} required>
        <select id="trackerId" {...register('trackerId')} className={INPUT_BASE}>
          <option value="">Selecione um rastreador</option>
          {trackers.map((t) => (
            <option key={t.id} value={t.id}>{t.imei} — {t.brand} {t.model}</option>
          ))}
        </select>
      </FormField>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} isEditing={isEditing} />
    </form>
  )
}
