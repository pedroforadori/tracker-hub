import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { FormActions } from '@/components/molecules/FormActions'
import { INPUT_BASE } from '@/shared/constants/styles'
import { useRelatedEntities } from '@/shared/hooks/useRelatedEntities'
import { f } from '@/shared/schemas/fields'
import type { Tracker, Vehicle } from '@/shared/types/api'
import { vehiclesApi } from '../../vehicles/api/vehicles.api'

const schema = z.object({
  imei: f.imei,
  brand: f.name,
  model: f.name,
  vehicleId: z.string().min(1, 'Selecione um veículo'),
})

export type TrackerFormData = z.infer<typeof schema>

export function TrackerForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<Tracker>
  onSubmit: (data: TrackerFormData) => Promise<void>
  onCancel: () => void
}) {
  const isEditing = !!initialData?.id
  const vehicles = useRelatedEntities<Vehicle>(vehiclesApi.getAll)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TrackerFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      imei: initialData?.imei ?? '',
      brand: initialData?.brand ?? '',
      model: initialData?.model ?? '',
      vehicleId: initialData?.vehicleId ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="IMEI" htmlFor="imei" error={errors.imei?.message} required>
        <NumericFormat
          id="imei"
          allowNegative={false}
          decimalScale={0}
          maxLength={15}
          defaultValue={initialData?.imei}
          onValueChange={(v) => setValue('imei', v.value, { shouldValidate: true })}
          placeholder="356938035643809"
          className={INPUT_BASE}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Marca" htmlFor="brand" error={errors.brand?.message} required>
          <input id="brand" {...register('brand')} placeholder="Suntech" className={INPUT_BASE} />
        </FormField>
        <FormField label="Modelo" htmlFor="model" error={errors.model?.message} required>
          <input id="model" {...register('model')} placeholder="TK303" className={INPUT_BASE} />
        </FormField>
      </div>

      <FormField label="Veículo" htmlFor="vehicleId" error={errors.vehicleId?.message} required>
        <select id="vehicleId" {...register('vehicleId')} className={INPUT_BASE}>
          <option value="">Selecione um veículo</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
          ))}
        </select>
      </FormField>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} isEditing={isEditing} />
    </form>
  )
}
