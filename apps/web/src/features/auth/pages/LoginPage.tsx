import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { INPUT_BASE } from '@/shared/constants/styles'
import { f } from '@/shared/schemas/fields'
import { useAuthStore } from '@/shared/store/authStore'
import { useBillingStore } from '@/shared/store/billingStore'
import { billingApi } from '../../billing/api/billing.api'
import { authApi } from '../api/auth.api'

const loginSchema = z.object({
  email: f.email,
  password: f.password,
})

type LoginForm = z.infer<typeof loginSchema>


export function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: LoginForm) => {
    setServerError('')
    try {
      const res = await authApi.login(data.email, data.password)
      login(res.accessToken, res.user)

      // Check billing status on every login to show payment warnings
      billingApi.getStatus().then((status) => {
        if (status.status === 'PAST_DUE' && status.gracePeriodEndsAt) {
          useBillingStore.getState().setPastDue(status.gracePeriodEndsAt)
        }
      }).catch(() => { /* non-critical */ })

      navigate('/')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 402) {
        setServerError('Acesso bloqueado por inadimplência. Contate o administrador da conta.')
      } else {
        setServerError('E-mail ou senha incorretos. Tente novamente.')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Tracker Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre na sua conta</p>
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

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
