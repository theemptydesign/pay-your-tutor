export default function HomePage() {
  return (
    <main className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-medium tracking-tight text-foreground mb-4">
          Tutor Visit Tracker
        </h1>
        <p className="text-lg text-on-surface-variant mb-8">
          Track and manage your tutoring visits with ease.
        </p>
        <div className="rounded-3xl bg-surface-container p-8 shadow-sm">
          <p className="text-on-surface-variant mb-4">
            To access your personalized tracker, visit:
          </p>
          <code className="block bg-surface-container-high px-4 py-3 rounded-lg text-primary font-mono">
            /[your-name]
          </code>
          <p className="text-sm text-on-surface-variant mt-6">
            For example: <code className="text-primary">/monica</code>
          </p>
        </div>
      </div>
    </main>
  )
}
