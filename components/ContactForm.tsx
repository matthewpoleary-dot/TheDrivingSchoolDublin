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

const inputBase =
  "w-full rounded-xl bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 ring-0 border-0 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === "success" && (
        <div className="rounded-xl bg-green-50 ring-1 ring-green-200 p-4 text-sm text-green-800">
          <strong>Message sent!</strong> We&apos;ll get back to you soon.
        </div>
      )}
      {status === "error" && (
        <div className="rounded-xl bg-red-50 ring-1 ring-red-200 p-4 text-sm text-red-800">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input type="text" id="company" name="company" value={formData.company}
          onChange={(e) => handleChange("company", e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text" id="name" value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={`${inputBase} ${errors.name ? "ring-2 ring-red-400" : ""}`}
          placeholder="John Smith"
        />
        {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email" id="email" value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className={`${inputBase} ${errors.email ? "ring-2 ring-red-400" : ""}`}
          placeholder="john@example.com"
        />
        {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Phone <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="tel" id="phone" value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className={inputBase}
            placeholder="+353 86 123 4567"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Subject <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text" id="subject" value={formData.subject}
            onChange={(e) => handleChange("subject", e.target.value)}
            className={inputBase}
            placeholder="e.g. EDT lessons, Pre-test"
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1.5">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message" value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          rows={5}
          className={`${inputBase} resize-none ${errors.message ? "ring-2 ring-red-400" : ""}`}
          placeholder="Tell us about your requirements..."
        />
        {errors.message && <p className="mt-1.5 text-sm text-red-600">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary w-full text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>

      <p className="text-xs text-slate-500 text-center">
        We typically respond within a few hours during business hours.
      </p>
    </form>
  );
}
