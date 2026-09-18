// components/lton/Icons.tsx — one stroke family (2px, square caps) for the L to N system
type P = { size?: number; className?: string };

export function ArrowRight({ size = 18, className }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 10h13M11 4.5 16.5 10 11 15.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
    </svg>
  );
}

export function Star({ size = 18, className }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 1.6l2.47 5.3 5.8.68-4.28 3.97 1.14 5.73L10 14.4l-5.13 2.88 1.14-5.73L1.73 7.58l5.8-.68L10 1.6z"
      />
    </svg>
  );
}

export function Plus({ size = 14, className }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

export function Chat({ size = 18, className }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 4h14v10H9l-4 3v-3H3V4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
