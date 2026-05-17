import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'dark' | 'amber'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  outline: 'border border-line-2 text-ink hover:bg-bg-warm-2',
  ghost:   'text-ink-2 hover:text-ink',
  dark:    'bg-ink text-paper hover:bg-ink-2',
  amber:   'bg-amber-deep text-paper hover:opacity-90',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3.5 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-full font-medium transition-all hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
