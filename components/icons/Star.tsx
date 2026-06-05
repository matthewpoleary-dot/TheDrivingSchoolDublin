// components/icons/Star.tsx
type Props = { className?: string; filled?: boolean };

export default function Star({ className = "h-5 w-5", filled = true }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`${className} ${filled ? "fill-red-600" : "fill-slate-200"}`}
    >
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

export function StarRow({ rating = 5, className = "h-5 w-5" }: { rating?: number; className?: string }) {
  const full = Math.round(rating);
  return (
    <div className="inline-flex gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={className} filled={i < full} />
      ))}
    </div>
  );
}
