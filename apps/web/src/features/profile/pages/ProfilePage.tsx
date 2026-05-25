import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormField } from '@/components/molecules/FormField'
import { INPUT_BASE } from '@/shared/constants/styles'
import { useAuthStore } from '@/shared/store/authStore'
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

  const {
    register,
    handleSubmit,
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
      setSuccess(true)
    } catch {
      setServerError('Erro ao salvar as alterações. Tente novamente.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          PAINEL TRACKERHUB CONTROL
        </p>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
      </div>

      <div className="max-w-md rounded-lg border border-border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="rounded-md bg-primary/10 p-3 text-sm text-primary"
            >
              Perfil atualizado com sucesso.
            </div>
          )}

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
            <input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Deixe em branco para manter a senha atual"
              className={INPUT_BASE}
            />
          </FormField>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
