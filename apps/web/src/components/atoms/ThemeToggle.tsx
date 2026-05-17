import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from './ThemeProvider'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
      className={cn(
        'inline-flex items-center justify-center rounded-md p-2',
        'border border-border bg-background text-foreground',
        'hover:bg-accent hover:text-accent-foreground transition-colors',
        className,
      )}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
