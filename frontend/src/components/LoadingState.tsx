/**
 * LoadingState — skeleton placeholder shown while todos are fetching.
 * Uses aria-busy and aria-label for screen reader accessibility.
 */

export default function LoadingState() {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading tasks"
      className="todo-list todo-list--loading"
    >
      {[1, 2, 3].map((n) => (
        <li key={n} className="todo-skeleton" aria-hidden="true">
          <span className="todo-skeleton__checkbox" />
          <span className="todo-skeleton__text" />
        </li>
      ))}
    </ul>
  );
}
