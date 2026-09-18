// components/ContactForm.tsx
"use client";

import { useState, FormEvent } from "react";

type FormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  company: string; // honeypot
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialData: FormData = { name: "", email: "", phone: "", subject: "", message: "", company: "" };


export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setStatus("success");
      setFormData(initialData);
      setErrors({});
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <form onSubmit={handleSubmit} className="l-form">
      {status === "success" && (
        <div className="l-notice l-notice--ok" role="status">
          <span><strong>Message sent!</strong> We&apos;ll get back to you soon.</span>
        </div>
      )}
      {status === "error" && (
        <div className="l-notice l-notice--error" role="alert">
          <span><strong>Error:</strong> {errorMessage}</span>
        </div>
      )}

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input type="text" id="company" name="company" value={formData.company}
          onChange={(e) => handleChange("company", e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="l-field">
        <label htmlFor="name" className="l-label">
          Full Name <i aria-hidden="true">*</i>
        </label>
        <input
          type="text" id="name" value={formData.name} autoComplete="name"
          onChange={(e) => handleChange("name", e.target.value)}
          className="l-input" aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          placeholder="John Smith"
        />
        {errors.name && <p id="name-error" className="l-error">{errors.name}</p>}
      </div>

      <div className="l-field">
        <label htmlFor="email" className="l-label">
          Email <i aria-hidden="true">*</i>
        </label>
        <input
          type="email" id="email" value={formData.email} autoComplete="email" inputMode="email"
          onChange={(e) => handleChange("email", e.target.value)}
          className="l-input" aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          placeholder="john@example.com"
        />
        {errors.email && <p id="email-error" className="l-error">{errors.email}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-[18px]">
        <div className="l-field">
          <label htmlFor="phone" className="l-label">
            Phone <em>(optional)</em>
          </label>
          <input
            type="tel" id="phone" value={formData.phone} autoComplete="tel"
            onChange={(e) => handleChange("phone", e.target.value)}
            className="l-input"
            placeholder="+353 86 123 4567"
          />
        </div>
        <div className="l-field">
          <label htmlFor="subject" className="l-label">
            Subject <em>(optional)</em>
          </label>
          <input
            type="text" id="subject" value={formData.subject}
            onChange={(e) => handleChange("subject", e.target.value)}
            className="l-input"
            placeholder="e.g. EDT lessons, Pre-test"
          />
        </div>
      </div>

      <div className="l-field">
        <label htmlFor="message" className="l-label">
          Message <i aria-hidden="true">*</i>
        </label>
        <textarea
          id="message" value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          rows={5}
          className="l-input" aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          placeholder="Tell us about your requirements..."
        />
        {errors.message && <p id="message-error" className="l-error">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="l-btn l-btn--red l-btn--lg l-btn--block"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>

      <p className="l-hint" style={{ textAlign: "center" }}>
        We typically respond within a few hours during business hours.
      </p>
    </form>
  );
}
