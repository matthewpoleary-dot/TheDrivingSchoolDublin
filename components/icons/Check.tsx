// components/icons/Check.tsx
type Props = { className?: string };

export default function Check({ className = "h-5 w-5 text-red-600" }: Props) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <circle cx="10" cy="10" r="10" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M6 10.5L8.5 13L14 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
