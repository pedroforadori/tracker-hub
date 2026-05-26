import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { FormActions } from '@/components/molecules/FormActions'
import { INPUT_BASE } from '@/shared/constants/styles'
import { f } from '@/shared/schemas/fields'
import type { Customer } from '@/shared/types/api'

const schema = z.object({
  name: f.name,
  cnpj: f.cnpj,
  email: f.email,
  phone: f.phone,
  monthlyFee: z.number({ invalid_type_error: 'Informe o valor da mensalidade' }).min(0, 'Valor inválido'),
  status: z.enum(['ATIVO', 'INATIVO']),
})

export type CustomerFormData = z.infer<typeof schema>

interface CustomerFormProps {
  initialData?: Partial<Customer>
  onSubmit: (data: CustomerFormData) => Promise<void>
  onCancel: () => void
}

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
      monthlyFee: initialData?.monthlyFee != null ? Number(initialData.monthlyFee) : 0,
      status: initialData?.status ?? 'ATIVO',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Nome / Razão Social" htmlFor="name" error={errors.name?.message} required>
        <input id="name" {...register('name')} placeholder="Transportes Silva Ltda" className={INPUT_BASE} />
      </FormField>

      <FormField label="CNPJ" htmlFor="cnpj" error={errors.cnpj?.message} required>
        <PatternFormat
          id="cnpj"
          format="##.###.###/####-##"
          mask="_"
          defaultValue={initialData?.cnpj}
          onValueChange={(v) => setValue('cnpj', v.value, { shouldValidate: true })}
          placeholder="00.000.000/0000-00"
          className={INPUT_BASE}
        />
      </FormField>

      <FormField label="E-mail" htmlFor="email" error={errors.email?.message} required>
        <input id="email" type="email" {...register('email')} placeholder="contato@empresa.com" className={INPUT_BASE} />
      </FormField>

      <FormField label="Telefone" htmlFor="phone" error={errors.phone?.message} required>
        <PatternFormat
          id="phone"
          format="(##) #####-####"
          mask="_"
          defaultValue={initialData?.phone}
          onValueChange={(v) => setValue('phone', v.value, { shouldValidate: true })}
          placeholder="(11) 99999-9999"
          className={INPUT_BASE}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Mensalidade" htmlFor="monthlyFee" error={errors.monthlyFee?.message} required>
          <NumericFormat
            id="monthlyFee"
            decimalScale={2}
            fixedDecimalScale
            decimalSeparator=","
            thousandSeparator="."
            prefix="R$ "
            allowNegative={false}
            defaultValue={initialData?.monthlyFee}
            onValueChange={(v) => setValue('monthlyFee', v.floatValue ?? 0, { shouldValidate: true })}
            placeholder="R$ 0,00"
            className={INPUT_BASE}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" error={errors.status?.message} required>
          <select id="status" {...register('status')} className={INPUT_BASE}>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </FormField>
      </div>

      {isEditing && initialData?.createdAt && (
        <FormField label="Data de Contratação" htmlFor="contractDate">
          <input
            id="contractDate"
            readOnly
            value={new Date(initialData.createdAt).toLocaleDateString('pt-BR')}
            className={INPUT_BASE}
          />
        </FormField>
      )}

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} isEditing={isEditing} />
    </form>
  )
}
