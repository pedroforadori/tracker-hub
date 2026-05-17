import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { cn } from '@/lib/utils'
import type { Customer } from '@/shared/types/api'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
})

export type CustomerFormData = z.infer<typeof schema>

interface CustomerFormProps {
  initialData?: Partial<Customer>
  onSubmit: (data: CustomerFormData) => Promise<void>
  onCancel: () => void
}

const inputBase = cn(
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50',
)

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
  const isEditing = !!initialData?.id

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: initialData?.name ?? '',
      cnpj: initialData?.cnpj ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Nome / Razão Social" htmlFor="name" error={errors.name?.message} required>
        <input id="name" {...register('name')} placeholder="Transportes Silva Ltda" className={inputBase} />
      </FormField>

      <FormField label="CNPJ" htmlFor="cnpj" error={errors.cnpj?.message} required>
        <PatternFormat
          id="cnpj"
          format="##.###.###/####-##"
          mask="_"
          defaultValue={initialData?.cnpj}
          onValueChange={(v) => setValue('cnpj', v.value, { shouldValidate: true })}
          placeholder="00.000.000/0000-00"
          className={inputBase}
        />
      </FormField>

      <FormField label="E-mail" htmlFor="email" error={errors.email?.message} required>
        <input id="email" type="email" {...register('email')} placeholder="contato@empresa.com" className={inputBase} />
      </FormField>

      <FormField label="Telefone" htmlFor="phone" error={errors.phone?.message} required>
        <PatternFormat
          id="phone"
          format="(##) #####-####"
          mask="_"
          defaultValue={initialData?.phone}
          onValueChange={(v) => setValue('phone', v.value, { shouldValidate: true })}
          placeholder="(11) 99999-9999"
          className={inputBase}
        />
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
