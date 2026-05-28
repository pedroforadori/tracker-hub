import { Spinner } from '@/components/atoms/Spinner'

interface FormActionsProps {
  onCancel: () => void
  isSubmitting?: boolean
  isEditing?: boolean
  submitLabel?: string
  loadingLabel?: string
}

export function FormActions({ onCancel, isSubmitting, isEditing, submitLabel, loadingLabel }: FormActionsProps) {
  const label = submitLabel ?? (isEditing ? 'Salvar alterações' : 'Cadastrar')
  const loadingText = loadingLabel ?? 'Salvando...'

  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            {loadingText}
          </span>
        ) : label}
      </button>
    </div>
  )
}
