// components/ContactOptions.tsx

const DISPLAY_PHONE = "+353 86 0235 666";
const TEL_HREF = "tel:+353860235666";
const WHATSAPP_HREF =
  "https://wa.me/353860235666?text=" +
  encodeURIComponent("Hi! I'd like to arrange a driving lesson.");
const EMAIL = "thedrivingschooldublin@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent("Lesson Enquiry")}`;

type OptionProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  primary: string;
  href: string;
  buttonLabel: string;
  red?: boolean;
  external?: boolean;
};

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" as const };

function Option({ icon, title, subtitle, primary, href, buttonLabel, red, external }: OptionProps) {
  return (
    <li className="l-option">
      <span className="l-option__icon" aria-hidden="true">{icon}</span>
      <div>
        <h3>{title}</h3>
        <p className="l-option__sub">{subtitle}</p>
        <p className="l-option__primary">{primary}</p>
      </div>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={red ? "l-btn l-btn--red" : "l-option__link"}
      >
        {buttonLabel}
      </a>
    </li>
  );
}

export default function ContactOptions() {
  return (
    <ul className="l-options">
      <Option
        icon={<svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 4h14v10H9l-4 3v-3H3V4z" {...stroke} /></svg>}
        title="WhatsApp"
        subtitle="Fastest response · Mon to Sat"
        primary="Chat with us directly"
        href={WHATSAPP_HREF}
        buttonLabel="Message on WhatsApp"
        red
        external
      />
      <Option
        icon={<svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 2.5h3l1.5 4-2 1.5a10 10 0 0 0 4.5 4.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 4.5a2 2 0 0 1 2-2z" {...stroke} /></svg>}
        title="Call"
        subtitle="Speak with the instructor · 8am to 6pm"
        primary={DISPLAY_PHONE}
        href={TEL_HREF}
        buttonLabel="Call now"
      />
      <Option
        icon={<svg width="20" height="20" viewBox="0 0 20 20"><path d="M2.5 4.5h15v11h-15z M2.5 5l7.5 6 7.5-6" {...stroke} /></svg>}
        title="Email"
        subtitle="Usually within a few hours"
        primary={EMAIL}
        href={MAILTO}
        buttonLabel="Send an email"
      />
    </ul>
  );
}
