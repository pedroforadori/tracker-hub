import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { FormActions } from '@/components/molecules/FormActions'
import { INPUT_BASE } from '@/shared/constants/styles'
import { f } from '@/shared/schemas/fields'
import type { TeamMember } from '@/shared/types/api'

const schema = z.object({
  name: f.name,
  email: f.email,
  password: f.password,
})

export type TeamFormData = z.infer<typeof schema>

export function TeamForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<TeamMember>
  onSubmit: (data: TeamFormData) => Promise<void>
  onCancel: () => void
}) {
  const isEditing = !!initialData?.id

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
        <input id="name" {...register('name')} placeholder="Maria Santos" className={INPUT_BASE} />
      </FormField>

      <FormField label="E-mail" htmlFor="email" error={errors.email?.message} required>
        <input id="email" type="email" {...register('email')} placeholder="maria@empresa.com" className={INPUT_BASE} />
      </FormField>

      <FormField
        label={isEditing ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
        htmlFor="password"
        error={errors.password?.message}
        required={!isEditing}
      >
        <input id="password" type="password" {...register('password')} placeholder="••••••" className={INPUT_BASE} />
      </FormField>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} isEditing={isEditing} submitLabel={isEditing ? 'Salvar alterações' : 'Adicionar membro'} />
    </form>
  )
}
