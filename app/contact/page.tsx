// app/contact/page.tsx
import Link from "next/link";

const DISPLAY_PHONE = "+353 86 0235 666";
const TEL_HREF = "tel:+353860235666";
const WHATSAPP_HREF =
  "https://wa.me/353860235666?text=" +
  encodeURIComponent("Hi! I'd like to arrange a driving lesson.");
const EMAIL = "thedrivingschooldublin@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent("Lesson Enquiry")}`;

function PrimaryButton(props: React.ComponentProps<"a">) {
  const { className = "", ...rest } = props;
  return (
    <a
      {...rest}
      className={
        "inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 transition " +
        className
      }
    />
  );
}

function SecondaryButton(props: React.ComponentProps<"a">) {
  const { className = "", ...rest } = props;
  return (
    <a
      {...rest}
      className={
        "inline-flex w-full items-center justify-center rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-neutral-900 transition " +
        className
      }
    />
  );
}

export default function Contact() {
  return (
    <section className="mx-auto max-w-6xl space-y-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Contact Us</h1>

      {/* Top row: WhatsApp + Call */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* WhatsApp card */}
        <div className="rounded-2xl border shadow-sm p-6 flex flex-col h-full">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">WhatsApp</h3>
            <p className="text-xs text-gray-500">Fastest response</p>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-gray-900 leading-none">
                Chat on WhatsApp
              </div>
              <p className="text-xs text-gray-500 mt-1">Mon–Sat</p>
            </div>
          </div>

          <div className="flex-1" />
          <PrimaryButton href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
            Message us
          </PrimaryButton>
        </div>

        {/* Call card */}
        <div className="rounded-2xl border shadow-sm p-6 flex flex-col h-full">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Call</h3>
            <p className="text-xs text-gray-500">Talk to an instructor</p>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-gray-900 leading-tight">
                {DISPLAY_PHONE}
              </div>
              <p className="text-xs text-gray-500 mt-1">9am–6pm</p>
            </div>
          </div>

          <div className="flex-1" />
          <SecondaryButton href={TEL_HREF}>Call us</SecondaryButton>
        </div>
      </div>

      {/* Bottom row: wider Email card */}
      <div className="grid">
        <div className="rounded-2xl border shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: copy */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Email</h3>
            <p className="text-xs text-gray-500">We reply the same day</p>

            <div className="mt-3">
              {/* Styled email (no oversized text, no blue link styling) */}
              <div className="text-base md:text-lg font-medium text-gray-900">
                {EMAIL}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Include your area & car type
              </p>
            </div>
          </div>

          {/* Right: button kept level with other cards using flex */}
          <div className="md:w-64">
            <PrimaryButton href={MAILTO}>Email us</PrimaryButton>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Prefer a call‑back? Send a WhatsApp or email with your availability and location.
      </p>

      {/* Handy quick links row (on-brand) */}
      <div className="flex flex-wrap gap-3 text-sm">
        <a className="underline" href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <span>•</span>
        <a className="underline" href={TEL_HREF}>Call {DISPLAY_PHONE}</a>
        <span>•</span>
        <a className="underline" href={MAILTO}>Email {EMAIL}</a>
        <span>•</span>
        <Link className="underline" href="/prices">See prices</Link>
      </div>
    </section>
  );
}
