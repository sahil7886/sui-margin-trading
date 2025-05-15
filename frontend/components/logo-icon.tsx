export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12h10" />
      <path d="M5 19h14" />
      <path d="M5 5h14" />
      <path d="M19 12h3" />
      <path d="m12 19-3-3 3-3" />
      <path d="m12 5 3 3-3 3" />
    </svg>
  )
}
