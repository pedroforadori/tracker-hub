interface LogoMarkProps {
  size?: 'sm' | 'md'
}

export function LogoMark({ size = 'md' }: LogoMarkProps) {
  const cls =
    size === 'sm'
      ? 'size-6 text-sm rounded-md'
      : 'size-7 text-lg rounded-lg'

  return (
    <div
      className={`${cls} bg-ink text-paper font-display italic grid place-items-center shrink-0 leading-none`}
      aria-hidden="true"
    >
      T
    </div>
  )
}
