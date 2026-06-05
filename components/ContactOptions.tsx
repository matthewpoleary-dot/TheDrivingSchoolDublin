// components/ContactOptions.tsx

const DISPLAY_PHONE = "+353 86 0235 666";
const TEL_HREF = "tel:+353860235666";
const WHATSAPP_HREF =
  "https://wa.me/353860235666?text=" +
  encodeURIComponent("Hi! I'd like to arrange a driving lesson.");
const EMAIL = "thedrivingschooldublin@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent("Lesson Enquiry")}`;

type OptionCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  primary: string;
  href: string;
  buttonLabel: string;
  buttonClass: string;
  external?: boolean;
};

function OptionCard({ icon, iconBg, title, subtitle, primary, href, buttonLabel, buttonClass, external }: OptionCardProps) {
  return (
    <div className="card flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          <p className="text-base font-semibold text-slate-900 mt-2 break-all">{primary}</p>
        </div>
      </div>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`w-full ${buttonClass}`}
      >
        {buttonLabel}
      </a>
    </div>
  );
}

export default function ContactOptions() {
  return (
    <div className="space-y-4">
      <OptionCard
        iconBg="bg-green-50"
        icon={
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
          </svg>
        }
        title="WhatsApp"
        subtitle="Fastest response · Mon–Sat"
        primary="Chat with us directly"
        href={WHATSAPP_HREF}
        buttonLabel="Message on WhatsApp"
        buttonClass="btn-primary"
        external
      />

      <OptionCard
        iconBg="bg-slate-100"
        icon={
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        }
        title="Call"
        subtitle="Speak with the instructor · 9am–6pm"
        primary={DISPLAY_PHONE}
        href={TEL_HREF}
        buttonLabel="Call now"
        buttonClass="btn-outline"
      />

      <OptionCard
        iconBg="bg-red-50"
        icon={
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        title="Email"
        subtitle="Same-day reply"
        primary={EMAIL}
        href={MAILTO}
        buttonLabel="Send an email"
        buttonClass="btn-outline"
      />
    </div>
  );
}
