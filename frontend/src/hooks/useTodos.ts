/**
 * useTodos — central state management hook for the todo list.
 * All API calls are made here; components receive data and callbacks only.
 */

import { useCallback, useEffect, useState } from "react";

import * as api from "../api";
import type { Todo } from "../types";

interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  addTodo: (title: string) => Promise<void>;
  toggleTodo: (id: string, is_done: boolean) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;
  retry: () => void;
}

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTodos();
      setTodos(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't load tasks. Check your connection.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (title: string): Promise<void> => {
    await api.createTodo(title);
    await fetchTodos();
  };

  const toggleTodo = async (id: string, is_done: boolean): Promise<void> => {
    await api.updateTodo(id, is_done);
    await fetchTodos();
  };

  const removeTodo = async (id: string): Promise<void> => {
    await api.deleteTodo(id);
    await fetchTodos();
  };

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    removeTodo,
    retry: fetchTodos,
  };
}
