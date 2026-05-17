import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { cn } from '@/lib/utils'
import type { TeamMember } from '@/shared/types/api'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export type TeamFormData = z.infer<typeof schema>

const inputBase = cn(
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50',
)

export function TeamForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<TeamMember>
  onSubmit: (data: TeamFormData) => Promise<void>
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      password: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Nome" htmlFor="name" error={errors.name?.message} required>
        <input id="name" {...register('name')} placeholder="Maria Santos" className={inputBase} />
      </FormField>

      <FormField label="E-mail" htmlFor="email" error={errors.email?.message} required>
        <input id="email" type="email" {...register('email')} placeholder="maria@empresa.com" className={inputBase} />
      </FormField>

      <FormField
        label={initialData?.id ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
        htmlFor="password"
        error={errors.password?.message}
        required={!initialData?.id}
      >
        <input id="password" type="password" {...register('password')} placeholder="••••••" className={inputBase} />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {isSubmitting ? 'Salvando...' : initialData?.id ? 'Salvar alterações' : 'Adicionar membro'}
        </button>
      </div>
    </form>
  )
}
