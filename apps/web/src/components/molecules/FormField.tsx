import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({ label, htmlFor, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
