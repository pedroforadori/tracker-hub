import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Spinner } from '@/components/atoms/Spinner'
import { INPUT_BASE } from '@/shared/constants/styles'
import { f } from '@/shared/schemas/fields'
import { authApi } from '../api/auth.api'

const schema = z.object({ email: f.email })
type Form = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: Form) => {
    setServerError('')
    try {
      await authApi.forgotPassword(data.email)
      setSubmitted(true)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        setServerError('Nenhuma conta encontrada com este e-mail.')
      } else {
        setServerError('Erro ao enviar solicitação. Verifique sua conexão e tente novamente.')
      }
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Verifique seu e-mail</h1>
          <p className="text-sm text-muted-foreground">
            Enviamos um link de redefinição de senha para o seu e-mail.
            O link expira em 30 minutos.
          </p>
          <Link
            to="/login"
            className="block text-sm text-primary underline-offset-4 hover:underline"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Tracker Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">Esqueceu sua senha?</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="admin@empresa.com"
              className={INPUT_BASE}
            />
            {errors.email && (
              <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Enviando...
              </span>
            ) : 'Enviar link de redefinição'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="underline-offset-4 hover:underline">
              Voltar para o login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
