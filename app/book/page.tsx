// app/book/page.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Chat } from "@/components/lton/Icons";

const DISPLAY_PHONE = "+353 86 0235 666";
const TEL_HREF = "tel:+353860235666";
const WHATSAPP_HREF = "https://wa.me/353860235666?text=" + encodeURIComponent("Hi! I'd like to arrange a driving lesson.");
const EMAIL = "thedrivingschooldublin@gmail.com";

export default function BookPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    carType: "",
    lessonType: "",
    area: "",
    availability: "",
    consent: false,
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const formspreeEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

    if (formspreeEndpoint) {
      // Use Formspree
      try {
        const response = await fetch(formspreeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            carType: formData.carType,
            lessonType: formData.lessonType,
            area: formData.area,
            availability: formData.availability,
          }),
        });

        if (response.ok) {
          setStatus("success");
          setFormData({
            name: "",
            phone: "",
            email: "",
            carType: "",
            lessonType: "",
            area: "",
            availability: "",
            consent: false,
          });
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    } else {
      // Fallback to mailto
      const subject = encodeURIComponent("Lesson Request");
      const body = encodeURIComponent(
        `Name: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\nCar Type: ${formData.carType}\nLesson Type: ${formData.lessonType}\nArea: ${formData.area}\nAvailability: ${formData.availability}`
      );
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      setStatus("success");
    }
  };

  if (status === "success") {
    return (
      <section className="l-page l-result">
        <div className="l-result__mark l-result__mark--ok" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path d="M6 18l7.5 7L28 9" stroke="currentColor" strokeWidth="4.5" />
          </svg>
        </div>
        <h1 className="l-h2">Request sent!</h1>
        <p className="l-lede">
          Thank you for your request. We&apos;ll get back to you the same day to confirm your lesson time.
        </p>
        <div className="l-result__actions">
          <Link href="/" className="l-btn l-btn--red l-btn--lg">
            Back to home <ArrowRight />
          </Link>
          <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="l-btn l-btn--line l-btn--lg">
            <Chat size={16} /> WhatsApp us
          </a>
        </div>
      </section>
    );
  }

  return (
    <div className="l-page l-flow l-flow--narrow">
      <p className="l-eyebrow">Lesson request</p>
      <h1 className="l-h2" style={{ marginTop: 14 }}>Request a lesson.</h1>
      <p className="l-lede">
        Fill out the form below and we&apos;ll get back to you the same day to confirm your lesson time.
      </p>

      {/* Quick contact options */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, margin: "24px 0 28px" }}>
        <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="l-btn l-btn--ink l-btn--lg">
          <Chat size={16} /> WhatsApp us
        </a>
        <a href={TEL_HREF} className="l-btn l-btn--line l-btn--lg">
          Call {DISPLAY_PHONE}
        </a>
      </div>

      <form onSubmit={handleSubmit} className="l-form l-panel">
        <div className="l-field">
          <label htmlFor="name" className="l-label">Full Name <i aria-hidden="true">*</i></label>
          <input
            type="text"
            id="name"
            required
            autoComplete="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="l-input"
          />
        </div>

        <div className="l-field">
          <label htmlFor="phone" className="l-label">Phone Number <i aria-hidden="true">*</i></label>
          <input
            type="tel"
            id="phone"
            required
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="l-input"
            placeholder="+353 86 123 4567"
          />
        </div>

        <div className="l-field">
          <label htmlFor="email" className="l-label">Email Address <i aria-hidden="true">*</i></label>
          <input
            type="email"
            id="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="l-input"
          />
        </div>

        <div className="l-field">
          <label htmlFor="carType" className="l-label">Car Type <i aria-hidden="true">*</i></label>
          <select
            id="carType"
            required
            value={formData.carType}
            onChange={(e) => setFormData({ ...formData, carType: e.target.value })}
            className="l-input"
          >
            <option value="">Select...</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
            <option value="not-sure">Not sure yet</option>
          </select>
        </div>

        <div className="l-field">
          <label htmlFor="lessonType" className="l-label">Lesson Type <i aria-hidden="true">*</i></label>
          <select
            id="lessonType"
            required
            value={formData.lessonType}
            onChange={(e) => setFormData({ ...formData, lessonType: e.target.value })}
            className="l-input"
          >
            <option value="">Select...</option>
            <option value="standard">Standard Lesson</option>
            <option value="edt-single">Single EDT Lesson</option>
            <option value="edt-bundle">EDT Bundle (12 lessons)</option>
            <option value="pre-test">Pre-Test Lesson</option>
            <option value="car-hire">Car Hire for Test</option>
            <option value="refresher">Refresher Lesson</option>
          </select>
        </div>

        <div className="l-field">
          <label htmlFor="area" className="l-label">Preferred Area</label>
          <input
            type="text"
            id="area"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            className="l-input"
            placeholder="e.g., Tallaght, Dún Laoghaire, Churchtown"
          />
        </div>

        <div className="l-field">
          <label htmlFor="availability" className="l-label">Your Availability <i aria-hidden="true">*</i></label>
          <textarea
            id="availability"
            required
            rows={4}
            value={formData.availability}
            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
            className="l-input"
            placeholder="e.g., Weekday evenings after 6pm, Saturday mornings..."
          />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <input
            type="checkbox"
            id="consent"
            required
            checked={formData.consent}
            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
            style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
          />
          <label htmlFor="consent" className="l-hint" style={{ color: "var(--ink-2)" }}>
            I consent to being contacted about my lesson request <i aria-hidden="true" style={{ fontStyle: "normal", color: "var(--red)" }}>*</i>
          </label>
        </div>

        {status === "error" && (
          <p className="l-notice l-notice--error" role="alert">
            Something went wrong. Please try again or contact us directly via WhatsApp or phone.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="l-btn l-btn--red l-btn--lg l-btn--block"
        >
          {status === "submitting" ? "Sending..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
