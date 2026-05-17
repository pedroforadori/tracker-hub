import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { cn } from '@/lib/utils'
import type { Customer, Vehicle } from '@/shared/types/api'
import { customersApi } from '../../customers/api/customers.api'

const CURRENT_YEAR = new Date().getFullYear()

const schema = z.object({
  plate: z.string().min(7, 'Placa inválida'),
  brand: z.string().min(2, 'Informe a marca'),
  model: z.string().min(2, 'Informe o modelo'),
  year: z.number().int().min(1990, 'Ano mínimo: 1990').max(CURRENT_YEAR + 1),
  customerId: z.string().min(1, 'Selecione um cliente'),
})

export type VehicleFormData = z.infer<typeof schema>

interface VehicleFormProps {
  initialData?: Partial<Vehicle>
  onSubmit: (data: VehicleFormData) => Promise<void>
  onCancel: () => void
}

const inputBase = cn(
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50',
)

export function VehicleForm({ initialData, onSubmit, onCancel }: VehicleFormProps) {
  const isEditing = !!initialData?.id
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    customersApi.getAll().then(setCustomers).catch(() => {})
  }, [])

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
          className={cn(inputBase, 'uppercase')}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Marca" htmlFor="brand" error={errors.brand?.message} required>
          <input id="brand" {...register('brand')} placeholder="Toyota" className={inputBase} />
        </FormField>
        <FormField label="Modelo" htmlFor="model" error={errors.model?.message} required>
          <input id="model" {...register('model')} placeholder="Hilux" className={inputBase} />
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
          className={inputBase}
        />
      </FormField>

      <FormField label="Cliente" htmlFor="customerId" error={errors.customerId?.message} required>
        <select id="customerId" {...register('customerId')} className={inputBase}>
          <option value="">Selecione um cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar'}
        </button>
      </div>
    </form>
  )
}
