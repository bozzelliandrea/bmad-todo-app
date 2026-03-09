/**
 * API module — all HTTP communication with the backend.
 * Components and hooks must use these functions; no raw fetch() in components.
 *
 * The Vite dev server proxies /api → http://backend:8000 (see vite.config.ts).
 */

import type { Todo } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      (body as { detail?: string } | null)?.detail ?? `HTTP ${response.status}`,
    );
  }

  // 204 No Content has no body
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export const getTodos = (): Promise<Todo[]> => request<Todo[]>("/api/v1/todos");

export const createTodo = (title: string): Promise<Todo> =>
  request<Todo>("/api/v1/todos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });

export const updateTodo = (id: string, is_done: boolean): Promise<Todo> =>
  request<Todo>(`/api/v1/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_done }),
  });

export const deleteTodo = (id: string): Promise<void> =>
  request<void>(`/api/v1/todos/${id}`, { method: "DELETE" });
