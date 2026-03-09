/**
 * TodoItem — renders a single todo with a completion checkbox and delete button.
 *
 * Accessibility:
 * - Checkbox aria-label: "Mark '{title}' as complete / Unmark…"
 * - Delete button aria-label: "Delete task '{title}'"
 * - Both reach 44px minimum touch target via CSS
 */

import type { Todo } from "../types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, is_done: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const checkboxLabel = todo.is_done
    ? `Unmark '${todo.title}' as complete`
    : `Mark '${todo.title}' as complete`;

  return (
    <li className={`todo-item${todo.is_done ? " todo-item--done" : ""}`}>
      <label className="todo-item__toggle">
        <input
          type="checkbox"
          className="todo-item__checkbox"
          checked={todo.is_done}
          onChange={() => onToggle(todo.id, !todo.is_done)}
          aria-label={checkboxLabel}
        />
      </label>

      <span className="todo-item__title">{todo.title}</span>

      <button
        className="todo-item__delete btn btn--icon"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete task '${todo.title}'`}
      >
        {/* Visually a ✕ icon */}
        <span aria-hidden="true">✕</span>
      </button>
    </li>
  );
}
