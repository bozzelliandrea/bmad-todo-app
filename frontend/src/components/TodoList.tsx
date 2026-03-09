/**
 * TodoList — orchestrates loading / error / empty / populated list states.
 */

import EmptyState from "./EmptyState";
import ErrorBanner from "./ErrorBanner";
import LoadingState from "./LoadingState";
import TodoItem from "./TodoItem";
import type { Todo } from "../types";

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  onToggle: (id: string, is_done: boolean) => void;
  onDelete: (id: string) => void;
  onRetry: () => void;
}

export default function TodoList({
  todos,
  loading,
  error,
  onToggle,
  onDelete,
  onRetry,
}: TodoListProps) {
  if (loading) return <LoadingState />;

  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  if (todos.length === 0) return <EmptyState />;

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
