import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { INPUT_BASE } from '@/shared/constants/styles'
import { f } from '@/shared/schemas/fields'
import { authApi } from '../api/auth.api'

const schema = z
  .object({
    password: f.password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type Form = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [success, setSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
      await authApi.resetPassword(token, data.password)
      setSuccess(true)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 400) {
        setTokenError(true)
      } else {
        setServerError('Erro ao redefinir senha. Verifique sua conexão e tente novamente.')
      }
    }
  }

  // Token ausente na URL
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Link inválido</h1>
          <p className="text-sm text-muted-foreground">
            Este link de redefinição de senha é inválido.
          </p>
          <Link
            to="/esqueci-minha-senha"
            className="block text-sm text-primary underline-offset-4 hover:underline"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  // Token expirado ou inválido (resposta da API)
  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Link expirado</h1>
          <p className="text-sm text-muted-foreground">
            Este link de redefinição expirou ou já foi utilizado.
          </p>
          <Link
            to="/esqueci-minha-senha"
            className="block text-sm text-primary underline-offset-4 hover:underline"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  // Senha redefinida com sucesso
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Senha redefinida!</h1>
          <p className="text-sm text-muted-foreground">
            Sua senha foi redefinida com sucesso. Agora você pode entrar com a nova senha.
          </p>
          <Link
            to="/login"
            className="block text-sm text-primary underline-offset-4 hover:underline"
          >
            Ir para o login
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
          <p className="mt-1 text-sm text-muted-foreground">Crie uma nova senha</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Nova senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••"
                className={cn(INPUT_BASE, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2',
                  'cursor-pointer text-muted-foreground hover:text-foreground',
                )}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="••••••"
                className={cn(INPUT_BASE, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2',
                  'cursor-pointer text-muted-foreground hover:text-foreground',
                )}
                aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p role="alert" className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  )
}