/**
 * EmptyState — shown when the todo list is empty.
 */

export default function EmptyState() {
  return (
    <div className="empty-state" role="status">
      <p className="empty-state__headline">Nothing to do — enjoy the quiet.</p>
      <p className="empty-state__subtext">Add your first task above.</p>
    </div>
  );
}
