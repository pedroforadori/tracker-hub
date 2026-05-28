import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { FormField } from '@/components/molecules/FormField'
import { FormActions } from '@/components/molecules/FormActions'
import { FormSkeleton } from '@/shared/components/LoadingSkeleton'
import { INPUT_BASE } from '@/shared/constants/styles'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/shared/store/authStore'
import { BillingContent } from '@/features/billing/pages/BillingPage'
import { profileApi } from '../api/profile.api'

const profileSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, 'Mínimo 8 caracteres')
    .refine(
      (v) => !v || /^(?=.*[A-Za-z])(?=.*\d).+$/.test(v),
      'Deve conter ao menos uma letra e um número',
    ),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: {
      name: user?.name ?? '',
      password: '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setServerError('')
    setSuccess(false)
    try {
      const payload: { name?: string; password?: string } = { name: data.name }
      if (data.password) payload.password = data.password
      const updated = await profileApi.updateMe(payload)
      updateUser({ name: updated.name })
      reset({ name: updated.name, password: '' })
      setSuccess(true)
    } catch {
      setServerError('Erro ao salvar as alterações. Tente novamente.')
    }
  }

  const handleCancel = () => {
    setServerError('')
    setSuccess(false)
    reset({ name: user?.name ?? '', password: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Meu Perfil</h1>
      </div>

      <div className="rounded-lg border border-border p-6">
        <h2 className="mb-4 text-base font-medium">Editar Perfil</h2>

        {serverError && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="mb-4 rounded-md bg-primary/10 p-3 text-sm text-primary"
          >
            Perfil atualizado com sucesso.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Nome" htmlFor="name" error={errors.name?.message} required>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Seu nome"
              className={INPUT_BASE}
            />
          </FormField>

          <FormField label="E-mail" htmlFor="email">
            <input
              id="email"
              type="email"
              value={user?.email ?? ''}
              disabled
              readOnly
              className={INPUT_BASE}
            />
          </FormField>

          <FormField
            label="Nova senha"
            htmlFor="password"
            error={errors.password?.message}
          >
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Deixe em branco para manter a senha atual"
                className={cn(INPUT_BASE, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>

          <FormActions
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isEditing
            submitLabel="Salvar alterações"
          />
        </form>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="rounded-lg border border-border p-6">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-medium">Cobrança</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Em breve
            </span>
          </div>
          <div className="pointer-events-none opacity-50">
            <Suspense fallback={<FormSkeleton />}>
              <BillingContent asSection readOnly />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}
