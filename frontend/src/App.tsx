import AddTodoForm from "./components/AddTodoForm";
import Header from "./components/Header";
import TodoList from "./components/TodoList";
import { useTodos } from "./hooks/useTodos";

export default function App() {
  const { todos, loading, error, addTodo, toggleTodo, removeTodo, retry } =
    useTodos();

  return (
    <main className="app-shell">
      <div className="app-card">
        <Header />
        <AddTodoForm onAdd={addTodo} />
        <TodoList
          todos={todos}
          loading={loading}
          error={error}
          onToggle={toggleTodo}
          onDelete={removeTodo}
          onRetry={retry}
        />
      </div>
    </main>
  );
}
