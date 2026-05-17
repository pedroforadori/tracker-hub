import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { FormField } from '../molecules/FormField'

const CURRENT_YEAR = new Date().getFullYear()

const entitySchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  year: z.number().int().min(1990, 'Ano mínimo: 1990').max(CURRENT_YEAR, `Ano máximo: ${CURRENT_YEAR}`),
  plate: z.string().regex(/^[A-Z]{3}-\d[A-Z0-9]\d{2}$/, 'Formato: ABC-1D23 ou ABC-1234'),
})

export type EntityFormData = z.infer<typeof entitySchema>

interface FormEntityProps {
  initialData?: Partial<EntityFormData>
  isEditable?: boolean
  onSubmit?: (data: EntityFormData) => void
}

const inputBase = cn(
  'w-full rounded-md border border-input bg-background px-3 py-2',
  'text-sm text-foreground placeholder:text-muted-foreground',
  'focus:outline-none focus:ring-2 focus:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

export function FormEntity({ initialData, isEditable = true, onSubmit }: FormEntityProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: { year: CURRENT_YEAR, ...initialData },
  })

  const handleFormSubmit = (data: EntityFormData) => {
    onSubmit?.(data)
    console.log('[FormEntity] dados submetidos:', data)
  }

  const isCreating = !initialData?.email

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4 w-full max-w-lg"
      aria-label={isCreating ? 'Formulário de criação' : 'Formulário de edição'}
      noValidate
    >
      <h2 className="text-lg font-semibold text-foreground">
        {isCreating ? 'Novo Cadastro' : 'Editar Cadastro'}
      </h2>

      <FormField label="Nome" htmlFor="name" error={errors.name?.message} required>
        <input
          id="name"
          {...register('name')}
          disabled={!isEditable}
          placeholder="João Silva"
          className={inputBase}
        />
      </FormField>

      <FormField label="E-mail" htmlFor="email" error={errors.email?.message} required>
        <input
          id="email"
          type="email"
          {...register('email')}
          disabled={!isEditable || !isCreating}
          placeholder="joao@exemplo.com"
          className={inputBase}
        />
      </FormField>

      <FormField label="Telefone" htmlFor="phone" error={errors.phone?.message}>
        <PatternFormat
          id="phone"
          format="(##) #####-####"
          mask="_"
          onValueChange={(v) => setValue('phone', v.value)}
          defaultValue={initialData?.phone}
          disabled={!isEditable}
          placeholder="(11) 99999-9999"
          className={inputBase}
        />
      </FormField>

      <FormField label="Ano do veículo" htmlFor="year" error={errors.year?.message} required>
        <NumericFormat
          id="year"
          allowNegative={false}
          decimalScale={0}
          maxLength={4}
          onValueChange={(v) => setValue('year', v.floatValue ?? CURRENT_YEAR)}
          defaultValue={initialData?.year ?? CURRENT_YEAR}
          disabled={!isEditable}
          placeholder={String(CURRENT_YEAR)}
          className={inputBase}
        />
      </FormField>

      <FormField label="Placa" htmlFor="plate" error={errors.plate?.message} required>
        <PatternFormat
          id="plate"
          format="???-####"
          mask="_"
          onValueChange={(v) => setValue('plate', v.formattedValue.toUpperCase())}
          defaultValue={initialData?.plate}
          disabled={!isEditable}
          placeholder="ABC-1D23"
          className={cn(inputBase, 'uppercase')}
        />
      </FormField>

      {!isEditable && (
        <p role="status" className="text-sm text-muted-foreground italic">
          Este registro está bloqueado para edição.
        </p>
      )}

      <button
        type="submit"
        disabled={!isEditable || isSubmitting}
        className={cn(
          'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
          'hover:opacity-90 transition-opacity',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {isSubmitting ? 'Salvando...' : isCreating ? 'Criar' : 'Salvar alterações'}
      </button>
    </form>
  )
}
