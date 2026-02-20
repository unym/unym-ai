export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <section className="mx-auto max-w-4xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Use AI Safely
        </h1>
        <p className="mt-6 text-xl leading-8 text-gray-600">
          unym protects your privacy when using AI tools by automatically
          detecting and anonymizing personal information before it leaves your
          browser.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/dashboard"
            className="rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Get started
          </a>
          <a
            href="https://github.com/unym"
            className="text-sm font-semibold leading-6 text-gray-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  )
}
