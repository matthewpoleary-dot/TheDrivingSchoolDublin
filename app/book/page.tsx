// app/book/page.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

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
      <section className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border bg-green-50 p-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight mb-4">Request Sent!</h1>
          <p className="text-gray-700 mb-6">
            Thank you for your request. We'll get back to you the same day to confirm your lesson time.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/" className="btn-primary">
              Back to home
            </Link>
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="btn-outline">
              WhatsApp us
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Request a Lesson</h1>
        <p className="text-gray-700">
          Fill out the form below and we'll get back to you the same day to confirm your lesson time.
        </p>
      </div>

      {/* Quick contact options */}
      <div className="grid gap-3 md:grid-cols-2">
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border bg-green-600 px-4 py-3 text-center font-medium text-white hover:bg-green-700 transition"
        >
          WhatsApp us
        </a>
        <a
          href={TEL_HREF}
          className="rounded-lg border bg-gray-900 px-4 py-3 text-center font-medium text-white hover:bg-black transition"
        >
          Call {DISPLAY_PHONE}
        </a>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-1">
            Phone Number <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            placeholder="+353 86 123 4567"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
            Email Address <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
          />
        </div>

        <div>
          <label htmlFor="carType" className="block text-sm font-medium text-gray-900 mb-1">
            Car Type <span className="text-red-600">*</span>
          </label>
          <select
            id="carType"
            required
            value={formData.carType}
            onChange={(e) => setFormData({ ...formData, carType: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
          >
            <option value="">Select...</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
            <option value="not-sure">Not sure yet</option>
          </select>
        </div>

        <div>
          <label htmlFor="lessonType" className="block text-sm font-medium text-gray-900 mb-1">
            Lesson Type <span className="text-red-600">*</span>
          </label>
          <select
            id="lessonType"
            required
            value={formData.lessonType}
            onChange={(e) => setFormData({ ...formData, lessonType: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
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

        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-900 mb-1">
            Preferred Area
          </label>
          <input
            type="text"
            id="area"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            placeholder="e.g., Tallaght, Dún Laoghaire, Churchtown"
          />
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-900 mb-1">
            Your Availability <span className="text-red-600">*</span>
          </label>
          <textarea
            id="availability"
            required
            rows={4}
            value={formData.availability}
            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
            placeholder="e.g., Weekday evenings after 6pm, Saturday mornings..."
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consent"
            required
            checked={formData.consent}
            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
          />
          <label htmlFor="consent" className="text-sm text-gray-700">
            I consent to being contacted about my lesson request <span className="text-red-600">*</span>
          </label>
        </div>

        {status === "error" && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            Something went wrong. Please try again or contact us directly via WhatsApp or phone.
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending..." : "Submit Request"}
        </button>
      </form>
    </section>
  );
}

