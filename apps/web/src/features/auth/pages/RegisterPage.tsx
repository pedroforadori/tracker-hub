import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/atoms/Spinner'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { INPUT_BASE } from '@/shared/constants/styles'
import { f } from '@/shared/schemas/fields'
import { useAuthStore } from '@/shared/store/authStore'
import { authApi } from '../api/auth.api'

const registerSchema = z
  .object({
    tenantName: z.string().min(2, 'Nome da empresa deve ter ao menos 2 caracteres').max(100),
    name: f.name,
    email: f.email,
    password: f.password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: RegisterForm) => {
    setServerError('')
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        tenantName: data.tenantName,
      })
      login(res.accessToken, res.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setServerError('E-mail já cadastrado. Tente fazer login.')
      } else {
        setServerError('Erro ao criar conta. Tente novamente.')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Tracker Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie sua conta de administrador</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="tenantName" className="text-sm font-medium text-foreground">
              Nome da empresa
            </label>
            <input
              id="tenantName"
              type="text"
              {...register('tenantName')}
              placeholder="Minha Empresa Ltda."
              className={INPUT_BASE}
            />
            {errors.tenantName && (
              <p role="alert" className="text-xs text-destructive">{errors.tenantName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="João Silva"
              className={INPUT_BASE}
            />
            {errors.name && (
              <p role="alert" className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

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
                placeholder="••••••••"
                className={cn(INPUT_BASE, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
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
              Confirmar senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="••••••••"
                className={cn(INPUT_BASE, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2',
                  'cursor-pointer text-muted-foreground hover:text-foreground',
                )}
                aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p role="alert" className="text-xs text-destructive">{errors.confirmPassword.message}</p>
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
                Criando conta...
              </span>
            ) : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
