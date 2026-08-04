import Link from "next/link";

export default function BookingSuccessPage() {
  return (
    <section className="mx-auto max-w-2xl py-10 text-center">
      <div className="rounded-[1.75rem] border border-green-200 bg-green-50 p-8 shadow-sm sm:p-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-600 text-2xl text-white">✓</span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-green-700">Payment received</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-gray-950">Your lesson is being confirmed.</h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-gray-700">
          We are adding the lesson to the instructor&apos;s calendar now. Your confirmation and booking details will arrive by email shortly.
        </p>
        <Link href="/" className="btn-primary mt-8">Return home</Link>
      </div>
    </section>
  );
}
