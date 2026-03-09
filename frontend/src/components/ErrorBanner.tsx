/**
 * ErrorBanner — displayed when the API is unreachable or returns an error.
 * Uses role="alert" so screen readers announce it immediately (FR-18, FR-19).
 */

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <p className="error-banner__message">
        {message || "Couldn't load tasks. Check your connection."}
      </p>
      <button
        className="error-banner__retry btn btn--secondary"
        onClick={onRetry}
      >
        Try Again
      </button>
    </div>
  );
}
