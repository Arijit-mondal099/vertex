import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-display-2 text-black">Course not found</h1>
      <p className="mt-3 text-body text-neutral-500">The course you are looking for does not exist.</p>
      <Link href="/" className="mt-6 inline-flex text-small font-medium text-primary-500 hover:text-primary-600">
        Back to courses
      </Link>
    </div>
  );
}
