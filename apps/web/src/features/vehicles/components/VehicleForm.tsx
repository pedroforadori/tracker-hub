import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { FormActions } from '@/components/molecules/FormActions'
import { INPUT_BASE } from '@/shared/constants/styles'
import { useRelatedEntities } from '@/shared/hooks/useRelatedEntities'
import { f } from '@/shared/schemas/fields'
import type { Customer, Vehicle } from '@/shared/types/api'
import { customersApi } from '../../customers/api/customers.api'
import { cn } from '@/lib/utils'

const schema = z.object({
  plate: z.string().min(7, 'Placa inválida'),
  brand: f.name,
  model: f.name,
  year: f.year,
  customerId: z.string().min(1, 'Selecione um cliente'),
})

export type VehicleFormData = z.infer<typeof schema>

interface VehicleFormProps {
  initialData?: Partial<Vehicle>
  onSubmit: (data: VehicleFormData) => Promise<void>
  onCancel: () => void
}

export function VehicleForm({ initialData, onSubmit, onCancel }: VehicleFormProps) {
  const isEditing = !!initialData?.id
  const CURRENT_YEAR = new Date().getFullYear()
  const customers = useRelatedEntities<Customer>(customersApi.getAll)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      plate: initialData?.plate ?? '',
      brand: initialData?.brand ?? '',
      model: initialData?.model ?? '',
      year: initialData?.year ?? CURRENT_YEAR,
      customerId: initialData?.customerId ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Placa" htmlFor="plate" error={errors.plate?.message} required>
        <PatternFormat
          id="plate"
          format="???-####"
          mask="_"
          defaultValue={initialData?.plate}
          onValueChange={(v) => setValue('plate', v.formattedValue.toUpperCase(), { shouldValidate: true })}
          placeholder="ABC-1D23"
          className={cn(INPUT_BASE, 'uppercase')}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Marca" htmlFor="brand" error={errors.brand?.message} required>
          <input id="brand" {...register('brand')} placeholder="Toyota" className={INPUT_BASE} />
        </FormField>
        <FormField label="Modelo" htmlFor="model" error={errors.model?.message} required>
          <input id="model" {...register('model')} placeholder="Hilux" className={INPUT_BASE} />
        </FormField>
      </div>

      <FormField label="Ano" htmlFor="year" error={errors.year?.message} required>
        <NumericFormat
          id="year"
          allowNegative={false}
          decimalScale={0}
          maxLength={4}
          defaultValue={initialData?.year ?? CURRENT_YEAR}
          onValueChange={(v) => setValue('year', v.floatValue ?? CURRENT_YEAR, { shouldValidate: true })}
          placeholder={String(CURRENT_YEAR)}
          className={INPUT_BASE}
        />
      </FormField>

      <FormField label="Cliente" htmlFor="customerId" error={errors.customerId?.message} required>
        <select id="customerId" {...register('customerId')} className={INPUT_BASE}>
          <option value="">Selecione um cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </FormField>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} isEditing={isEditing} />
    </form>
  )
}
