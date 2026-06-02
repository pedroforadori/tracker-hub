import type { ImportResult } from '@/shared/types/api'

interface ImportResultAlertProps {
  result: ImportResult | null
  error: string
}

export function ImportResultAlert({ result, error }: ImportResultAlertProps) {
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </div>
    )
  }

  if (!result) return null

  return (
    <div role="status" className="rounded-md border border-border px-4 py-3 text-sm">
      <p className="font-medium">
        {result.imported} registro(s) importado(s) com sucesso.
      </p>
      {result.errors.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-destructive">
          {result.errors.map((e) => (
            <li key={`${e.row}-${e.message}`}>
              Linha {e.row}: {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
