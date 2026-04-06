"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 text-center">
      <h2 className="text-2xl font-bold mb-4">Något gick fel</h2>
      <p className="text-muted-foreground mb-6">
        {error.message || "Ett oväntat fel inträffade."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        Försök igen
      </button>
    </div>
  );
}
