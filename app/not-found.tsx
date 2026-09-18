// app/not-found.tsx: unknown paths still return 404, inside the site layout
import Link from "next/link";
import { ArrowRight } from "@/components/lton/Icons";

export default function NotFound() {
  return (
    <section className="l-page l-result">
      <div className="l-result__mark" aria-hidden="true" style={{ color: "var(--red)", fontWeight: 900, fontSize: 40 }}>
        ?
      </div>
      <h1 className="l-display l-h2">Wrong turn.</h1>
      <p className="l-lede">This page could not be found.</p>
      <div className="l-result__actions">
        <Link href="/" className="l-btn l-btn--red l-btn--lg">
          Back to home <ArrowRight />
        </Link>
        <Link href="/book" className="l-btn l-btn--line l-btn--lg">Book a lesson</Link>
      </div>
    </section>
  );
}
