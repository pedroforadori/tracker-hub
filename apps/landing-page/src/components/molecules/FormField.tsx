import { Input } from '../atoms/Input'
import { Label } from '../atoms/Label'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  children?: React.ReactNode
}

export function FormField({ label, htmlFor, error, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children ?? <Input id={htmlFor} error={!!error} aria-describedby={error ? `${htmlFor}-error` : undefined} />}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
