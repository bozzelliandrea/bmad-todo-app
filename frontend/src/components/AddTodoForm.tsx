/**
 * AddTodoForm — input + submit button for creating new todos.
 *
 * Behaviour:
 * - Auto-focuses input on desktop (window.innerWidth > 640)
 * - Enter key or button click submits
 * - Client-side validation: empty/whitespace input shows inline message
 * - On API error, input text is preserved and error shown inline
 * - Input font-size ≥ 16px to prevent iOS Safari zoom
 */

import { useRef, useState } from "react";

interface AddTodoFormProps {
  onAdd: (title: string) => Promise<void>;
}

export default function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [value, setValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on desktop only (avoids popping up mobile keyboard on load)
  const isDesktop = typeof window !== "undefined" && window.innerWidth > 640;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    // Clear validation error as soon as the user types
    if (validationError) setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!value.trim()) {
      setValidationError("Task description is required.");
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onAdd(value.trim());
      setValue("");
      inputRef.current?.focus();
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Failed to add task. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const errorId = "add-todo-error";

  return (
    <form className="add-todo-form" onSubmit={handleSubmit} noValidate>
      <div className="add-todo-form__row">
        <label htmlFor="new-todo-input" className="visually-hidden">
          New task
        </label>
        <input
          id="new-todo-input"
          ref={inputRef}
          className="add-todo-form__input"
          type="text"
          placeholder="What needs doing?"
          value={value}
          onChange={handleChange}
          disabled={submitting}
          autoFocus={isDesktop}
          aria-describedby={validationError || apiError ? errorId : undefined}
          aria-invalid={!!(validationError || apiError)}
        />
        <button
          type="submit"
          className="add-todo-form__submit btn btn--primary"
          disabled={submitting}
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </div>

      {(validationError || apiError) && (
        <p id={errorId} className="add-todo-form__error" role="alert">
          {validationError ?? apiError}
        </p>
      )}
    </form>
  );
}
