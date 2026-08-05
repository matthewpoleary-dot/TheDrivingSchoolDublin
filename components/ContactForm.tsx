"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTACT, contactLinks } from "@/lib/config";
import { Check, ArrowRight } from "@/components/brand";

/**
 * Contact form.
 *
 * Posts to our own API, which stores the enquiry in the database first and
 * emails second. The previous version posted to Formspree or fell back to a
 * `mailto:` link, which meant an enquiry could vanish entirely if the visitor
 * had no mail client configured. Now nothing is lost even if email fails.
 */
export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    company: "", // honeypot
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.fields) setErrors(data.fields);
        setErrorMessage(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("sent");
    } catch {
      setErrorMessage(
        `We could not send that. Please ring or WhatsApp ${CONTACT.phoneDisplay}.`
      );
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="border-2 border-pass bg-pass-wash p-6">
        <p className="flex items-center gap-2 font-extrabold text-pass">
          <Check /> Message sent
        </p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed">
          Conor will come back to you, usually the same day. If it is urgent, ring{" "}
          <a href={contactLinks.tel} className="tabular font-bold underline">
            {CONTACT.phoneDisplay}
          </a>
          .
        </p>
        <Link href="/book" className="btn btn-ink mt-5 text-sm">
          Book a lesson while you wait
          <ArrowRight />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="name"
          label="Your name"
          required
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          error={errors.name}
          autoComplete="name"
        />
        <Field
          id="phone"
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          error={errors.phone}
          autoComplete="tel"
          inputMode="tel"
        />
      </div>

      <Field
        id="email"
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        error={errors.email}
        autoComplete="email"
        inputMode="email"
      />

      <Field
        id="subject"
        label="What is it about?"
        value={form.subject}
        onChange={(v) => setForm({ ...form, subject: v })}
        error={errors.subject}
      />

      <div>
        <label htmlFor="message" className="field-label">
          Message <span className="ml-1 text-plate">*</span>
        </label>
        <textarea
          id="message"
          rows={5}
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          className="field resize-y"
        />
        {errors.message && (
          <p id="message-error" role="alert" className="field-error">
            <span aria-hidden="true">!</span> {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />
      </div>

      {status === "error" && errorMessage && (
        <div role="alert" className="border-2 border-plate bg-plate-wash p-4 text-sm">
          {errorMessage}
        </div>
      )}

      <button type="submit" disabled={status === "sending"} className="btn btn-primary">
        {status === "sending" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="ml-1 text-plate">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="field-error">
          <span aria-hidden="true">!</span> {error}
        </p>
      )}
    </div>
  );
}
