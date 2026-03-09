---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-bmad-todo-app-2026-03-09.md
  - _bmad-output/planning-artifacts/prd.md
status: complete
---

# UX Design Specification — bmad-todo-app

**Author:** Boz  
**Date:** 2026-03-09  
**Status:** Complete  
**Version:** 1.0

---

## Executive Summary

### Project Vision

bmad-todo-app is a zero-friction personal task manager. The UX is designed around one central truth: **the interface should disappear**. The moment a user opens the app, their task list is visible and actionable. No login screen. No onboarding. No empty marketing copy. Just the task list and an input field.

Every design decision filters through this lens: does it make the core interaction faster and more reliable, or does it add overhead?

### Target Users

**Primary:** Alex — an individual knowledge worker or student who needs a persistent, always-available personal task list. Alex is comfortably tech-literate but has no patience for tools that require setup or explanation. They use the app on both desktop (keyboard-first) and mobile (touch-first) across the day.

**Secondary:** Future developers reading the codebase as a reference implementation.

### Key Design Challenges

1. **Clarity at a glance:** The list must communicate task status (active / done) without requiring the user to read labels or interpret icons. Visual hierarchy carries the full load.
2. **Mobile-first interactions:** Core actions (add, complete, delete) must be as comfortable on a 375px touch screen as they are on a 1440px desktop with a keyboard.
3. **Graceful uncertainty:** The app must handle loading, empty, and error states in a way that feels calm and informative, never alarming or opaque.

### Design Opportunities

1. **Radical simplicity as differentiator:** Most task apps over-build. This one can stand out by being conspicuously minimal — users immediately feel the absence of clutter.
2. **Keyboard-first power:** Keyboard users (developers, power users) should be able to operate the entire app without touching a mouse. Tab, Enter, Space, and Delete are the full interface.
3. **Instant feedback as trust signal:** Every action that succeeds confirms reliability. This builds implicit trust over repeated use.

---

## Core User Experience

### Defining Experience

The defining experience of bmad-todo-app is the **instant task capture loop**: user thinks of a task → types it → presses Enter → task appears in the list → input clears. This loop should feel like writing on a notepad — zero friction, zero delay, zero confirmation dialogs.

The complementary loop is **completion acknowledgement**: user finishes a task in real life → clicks the checkbox → task becomes visually distinct → user feels a small moment of satisfaction. This loop is the emotional core of a todo app.

### Platform Strategy

- **Primary surface:** Web browser (desktop and mobile)
- **Input models:** Keyboard + mouse (desktop), touch (mobile)
- **No native app in MVP** — responsive web covers both surface areas
- **Offline:** Not supported in MVP — app shows error state when disconnected
- **No PWA installation** in MVP — accessed via URL

### Effortless Interactions

| Interaction           | Design Decision                                                       |
| --------------------- | --------------------------------------------------------------------- |
| Add a task            | Auto-focused input on load; Enter key submits; no form label required |
| Complete a task       | Single click/tap on checkbox; no confirmation dialog                  |
| Delete a task         | Single click/tap on delete button; no confirmation dialog             |
| See all tasks         | Automatic on page load; no menu, no navigation, no search required    |
| Clear input after add | Automatic — user never needs to clear the field manually              |

### Critical Success Moments

1. **First task created:** The user presses Enter and a task appears below the input within 200ms. This moment establishes trust that the app is responsive.
2. **Page reload with data:** The user refreshes the browser and sees their tasks unchanged. This moment establishes trust that the app is reliable.
3. **Task completion:** The user clicks a checkbox and the task visually transforms (strikethrough + dimmed). This moment delivers the emotional reward that makes the habit sticky.
4. **Mobile add:** The user taps the input on their phone, types a task, and taps Add. The keyboard dismisses, the task appears. The flow is as smooth as desktop.

### Experience Principles

1. **Show, don't explain.** No instructional copy, tooltips, or onboarding. The interface speaks for itself.
2. **Instant over perfect.** Prefer showing a result immediately over showing a spinner for accuracy.
3. **Calm over clever.** Neutral tones, no animations that call attention to themselves, no micro-interactions that distract.
4. **Touch as first class.** Every interactive element sized for fingers. Hover states are an enhancement, not a requirement.
5. **Stability signals trust.** Consistent layout, predictable behavior, no UI that jumps or shifts unexpectedly.

---

## Desired Emotional Response

### Primary Emotion: Calm Reliability

The dominant feeling is **calm control** — "this place holds my tasks, I can trust it." Not excitement. Not delight. Control.

Users of a todo app are often in low-grade stress contexts (things to remember, things undone). The app should reduce anxiety, not add to it. This means: no loading spinners that oscillate, no error dialogs that block content, no interactions that require confirmation.

### Emotional Journey Map

| Stage                             | Desired Emotion                  | Design Support                                      |
| --------------------------------- | -------------------------------- | --------------------------------------------------- |
| First open                        | Curiosity → immediate usefulness | No onboarding. Task list visible in < 1s.           |
| Adding first task                 | Confidence                       | Input auto-focused. Enter works immediately.        |
| Seeing task persist after refresh | Relief → trust                   | Fast load; tasks appear in < 1s.                    |
| Completing a task                 | Small satisfaction               | Strikethrough animation (subtle). Visual dimming.   |
| Deleting old tasks                | Tidiness, control                | Immediate removal. Clean list.                      |
| Error state                       | Concern → reassurance            | Clear message. Data not destroyed. Retry available. |

### What to Avoid

- **Anxiety:** Do not use red colors for normal delete actions, only for destructive warnings.
- **Frustration:** No confirmation dialogs for delete or complete — these are instant and reversible by re-toggling (complete) or they're clearly intentional (delete).
- **Overwhelm:** No feature discovery overlays, no empty state CTAs with marketing copy.

---

## Design Inspiration

### Reference Experiences

The app draws inspiration from tools known for their restraint and clarity:

- **Things 3 (Today view):** Clean list, strong separation between done and not-done, full-width rows that are easy to tap.
- **Apple Reminders (minimal state):** High legibility, simple checkbox interaction, generous whitespace.
- **Superhuman inbox zero:** The satisfaction of clearing a list. The clean empty state that feels like an achievement rather than an error.
- **Linear issue tracker:** Keyboard-first, instant feedback, clean typography with good density.

### Aesthetic Direction: **Calm Utility**

- **Not:** Minimal to the point of sterility (no personality)
- **Not:** Playful to the point of distraction (no gamification)
- **Is:** Clean, legible, professional, slightly warm. Like a quality notepad.

---

## Design System Foundation

### Color Palette

| Token                      | Value     | Usage                                               |
| -------------------------- | --------- | --------------------------------------------------- |
| `--color-bg`               | `#FAFAFA` | Page background                                     |
| `--color-surface`          | `#FFFFFF` | Card / list surface                                 |
| `--color-border`           | `#E5E7EB` | Dividers, input borders                             |
| `--color-text-primary`     | `#111827` | Active task title, headings                         |
| `--color-text-secondary`   | `#6B7280` | Completed task title, metadata                      |
| `--color-text-placeholder` | `#9CA3AF` | Input placeholder                                   |
| `--color-accent`           | `#4F46E5` | Checkbox checked state, focus rings, primary button |
| `--color-accent-hover`     | `#4338CA` | Button hover                                        |
| `--color-danger`           | `#EF4444` | Delete button hover                                 |
| `--color-danger-hover`     | `#DC2626` | Delete button active                                |
| `--color-success`          | `#10B981` | Optional: completion micro-feedback                 |
| `--color-error-bg`         | `#FEF2F2` | Error state background                              |
| `--color-error-text`       | `#991B1B` | Error state message                                 |

### Typography

| Token                    | Value                                         | Usage                       |
| ------------------------ | --------------------------------------------- | --------------------------- |
| `--font-family`          | `Inter, ui-sans-serif, system-ui, sans-serif` | All text                    |
| `--font-size-xs`         | `12px`                                        | Metadata, timestamps        |
| `--font-size-sm`         | `14px`                                        | Helper text, error messages |
| `--font-size-base`       | `16px`                                        | Task titles, body text      |
| `--font-size-lg`         | `20px`                                        | App title / header          |
| `--font-weight-normal`   | `400`                                         | Task titles (active)        |
| `--font-weight-medium`   | `500`                                         | Buttons, labels             |
| `--font-weight-semibold` | `600`                                         | App title                   |
| `--line-height-task`     | `1.5`                                         | Task list items             |

### Spacing

| Token       | Value  | Usage                          |
| ----------- | ------ | ------------------------------ |
| `--space-1` | `4px`  | Fine gaps                      |
| `--space-2` | `8px`  | Internal component padding     |
| `--space-3` | `12px` | Tight spacing between elements |
| `--space-4` | `16px` | Standard element spacing       |
| `--space-6` | `24px` | Section spacing                |
| `--space-8` | `32px` | Large section breaks           |

### Border Radius

- Inputs, buttons, cards: `8px`
- Checkbox: `4px`
- Error/info banners: `8px`

---

## Visual Foundation

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  [App Header: "My Tasks"]                           │
├─────────────────────────────────────────────────────┤
│  [Add Task Form: input + button on one row]         │
├─────────────────────────────────────────────────────┤
│  [Task List]                                        │
│    ┌──────────────────────────────────────────────┐ │
│    │ ☐  Buy groceries                         [×] │ │
│    ├──────────────────────────────────────────────┤ │
│    │ ☑  Call dentist (strikethrough, dimmed)  [×] │ │
│    └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Max content width:** `640px`, centered on desktop.
- **Full width** on mobile (≤ 640px), with `16px` horizontal padding.
- **Page background:** `--color-bg` (`#FAFAFA`). Card container: `--color-surface` (`#FFFFFF`) with subtle shadow on desktop.

### Component Visual States

**Task Item — Active:**

```
[ ☐ ]  Buy groceries                            [ 🗑 ]
       color: --color-text-primary
       font-size: --font-size-base
```

**Task Item — Completed:**

```
[ ☑ ]  ~~Buy groceries~~                        [ 🗑 ]
       color: --color-text-secondary
       text-decoration: line-through
       opacity: 0.7
```

**Task Input — Default:**

```
┌─────────────────────────────────────────┐  [Add]
│ What needs to be done?                  │
└─────────────────────────────────────────┘
```

**Task Input — Focus:**

```
┌─────────────────────────────────────────┐  [Add]
│ What needs to be done?   |              │  ← accent ring
└─────────────────────────────────────────┘
```

---

## Design Directions

### Direction: "Calm List"

**Visual signature:** White card on light gray background. Clean, no icon clutter. Line separators between tasks. Checkbox is the only accent color element.

**Interaction signature:** No animations except a brief fade-in for newly added tasks (150ms). Completion adds strikethrough immediately. Delete is instant — no fade-out animation (keeps the list feeling responsive).

**Header:** "My Tasks" in `--font-size-lg`, `--font-weight-semibold`. No logo, no nav, no hamburger menu.

**Empty state:** Centered, inline with the list area. Icon: ✓ in a circle (soft gray). Message: `"Nothing to do — enjoy the quiet."` Subtext: `"Add your first task above."` No CTA beyond the visible input.

**Loading state:** 2–3 skeleton rows (gray animated pulsing bars) in place of the task list. Input is visible and interactive during load.

**Error state:** A non-modal error banner below the input: `"Couldn't load tasks. Check your connection."` + `[Try Again]` button. List area shows last known state or skeleton.

---

## User Journey Flows (Screen-by-Screen)

### Flow 1 — Initial Load (Fresh User)

```
[Browser opens app]
        │
        ▼
[Page renders: Header + Input + Loading skeleton (2 rows)]
        │
        ▼ (API responds: empty array)
[Empty state displays]
 ┌──────────────────────────────────┐
 │  ✓   Nothing to do               │
 │      Add your first task above.  │
 └──────────────────────────────────┘
[Input is auto-focused]
```

### Flow 2 — Add a Task

```
[User types "Buy groceries" in input]
        │
        ▼
[User presses Enter or clicks "Add"]
        │
        ▼
[Input disabled briefly (pending)]
        │
        ▼
[POST /todos resolves]
        │
        ▼
[Input clears. Input re-focuses. Task appears at bottom of list]
 ┌─────────────────────────────────────────┐
 │ ☐  Buy groceries                   [×] │
 └─────────────────────────────────────────┘
```

**Validation path:**

```
[User clicks "Add" with empty input]
        │
        ▼
[Inline validation message appears below input]
 "Task description is required."
[Input stays focused. No API call made.]
```

### Flow 3 — Complete a Task

```
[User clicks checkbox next to "Buy groceries"]
        │
        ▼
[PATCH /todos/{id} sent with { is_done: true }]
        │
        ▼
[Task item updates: strikethrough + dimmed]
 ┌─────────────────────────────────────────┐
 │ ☑  ~~Buy groceries~~               [×] │
 └─────────────────────────────────────────┘
```

**Un-complete path:**

```
[User clicks checkbox again on completed task]
        │
        ▼
[PATCH /todos/{id} sent with { is_done: false }]
        │
        ▼
[Task item returns to active visual state]
```

### Flow 4 — Delete a Task

```
[User clicks [×] on a task]
        │
        ▼
[DELETE /todos/{id} sent]
        │
        ▼
[Task removed from list. Neighboring items shift up smoothly.]
```

### Flow 5 — Error Recovery

```
[Page loads. API unreachable.]
        │
        ▼
[Skeleton rows shown for 5s]
        │
        ▼
[Error banner appears]
 ┌────────────────────────────────────────────────────┐
 │ ⚠  Couldn't load tasks. Check your connection.  │
 │                              [Try Again]           │
 └────────────────────────────────────────────────────┘
[List area empty (or shows stale data if cached)]
        │
        ▼
[User clicks "Try Again"]
        │
        ▼
[Skeleton shows again. Fetch retried.]
```

---

## Component Strategy

### Component Inventory

| Component        | Responsibility                               | Notes                                             |
| ---------------- | -------------------------------------------- | ------------------------------------------------- |
| `<App>`          | Root layout, global error boundary           | Renders `<Header>`, `<AddTodoForm>`, `<TodoList>` |
| `<Header>`       | App title                                    | Static text "My Tasks"                            |
| `<AddTodoForm>`  | Controlled text input + submit               | Handles empty validation, calls `createTodo()`    |
| `<TodoList>`     | Renders list, loading, empty, error states   | Delegates individual items to `<TodoItem>`        |
| `<TodoItem>`     | Single row: checkbox + title + delete button | Handles its own toggle and delete                 |
| `<LoadingState>` | Skeleton rows during initial fetch           | 2–3 animated placeholder bars                     |
| `<EmptyState>`   | Empty list message                           | Shown when `todos.length === 0` after load        |
| `<ErrorBanner>`  | Non-modal error message + retry              | Shown on API fetch failure                        |

### Component Interaction Map

```
<App>
 ├── <Header />
 ├── <AddTodoForm onAdd={createTodo} />
 └── <TodoList
        todos={todos}
        loading={loading}
        error={error}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onRetry={fetchTodos}
      >
       ├── [loading] → <LoadingState />
       ├── [error]   → <ErrorBanner onRetry={onRetry} />
       ├── [empty]   → <EmptyState />
       └── [items]   → todos.map(t => <TodoItem
                            key={t.id}
                            todo={t}
                            onToggle={onToggle}
                            onDelete={onDelete}
                          />)
```

---

## UX Patterns

### Pattern 1 — Optimistic vs. Confirmed Updates

In MVP, all mutations wait for server confirmation before updating the UI. This is the safe, simpler choice:

- **Add:** Input disabled during POST. Task appears after 200 OK.
- **Toggle:** Checkbox click triggers PATCH. Visual update after response.
- **Delete:** Button click triggers DELETE. Row removed after 204.

This prevents inconsistency at the cost of a very short perceived delay (~50–100ms on local). Acceptable for MVP.

**Post-MVP consideration:** Add optimistic updates (update UI immediately, roll back on failure) to eliminate perceived latency.

### Pattern 2 — Input Auto-Focus

The task input is auto-focused on page load on desktop. This enables keyboard-first users to start typing immediately without clicking. On mobile, auto-focus is suppressed (it would immediately pop the keyboard, which is intrusive on load).

### Pattern 3 — Enter to Submit

The `<AddTodoForm>` is a `<form>` element with `onSubmit`. Both Enter key and button click trigger the same submit handler. The input field has `type="text"` and the button is `type="submit"`.

### Pattern 4 — Keyboard Navigation

Full keyboard operability:

| Key     | Action                                                                           |
| ------- | -------------------------------------------------------------------------------- |
| `Tab`   | Move focus: input → Add button → first task checkbox → first delete button → ... |
| `Enter` | Submit form (when input focused)                                                 |
| `Space` | Toggle checkbox (when checkbox focused)                                          |
| `Enter` | Activate delete button (when delete button focused)                              |

### Pattern 5 — Empty Input Validation

Client-side validation is performed before the API call:

1. Trim whitespace from input value.
2. If empty string: show inline error message below input. No API call.
3. On input change: clear the error message immediately.

The API also validates (returns `422` for empty title). The client-side check is for faster feedback and reduced server load.

### Pattern 6 — Completed Tasks Remain Visible

Completed tasks stay in the list at their original position until explicitly deleted. They are visually de-emphasized but not hidden. Users can un-complete a task with another click.

**Rationale:** Hiding completed tasks requires a separate "show completed" toggle, adding complexity. Keeping them visible (de-emphasized) is simpler and gives users the satisfaction of seeing a growing completion list.

---

## Responsive & Accessibility

### Responsive Breakpoints

| Breakpoint | Width   | Layout                                                               |
| ---------- | ------- | -------------------------------------------------------------------- |
| Mobile     | < 640px | Full-width, 16px horizontal padding, no card shadow                  |
| Desktop    | ≥ 640px | 640px max-width centered, card with subtle shadow, 24px side padding |

### Mobile-Specific Behavior

- **Touch targets:** All interactive elements (checkbox, delete button, Add button) have a minimum tap target of `44px × 44px`.
- **Input:** `font-size: 16px` minimum to prevent iOS Safari auto-zoom on focus.
- **Keyboard dismiss:** After task add on mobile, blur the input so the keyboard hides automatically.
- **No hover states required:** Hover-only interactions do not exist (delete button is always visible, not hover-reveal).

### Accessibility Requirements

| Requirement               | Implementation                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| Focus visible             | Custom focus ring: `2px solid var(--color-accent)`, `2px offset`                                    |
| Input label               | `<label>` element associated with input via `htmlFor` (visually hidden with `sr-only` if not shown) |
| Checkbox label            | Each `<TodoItem>` checkbox has an accessible label: `aria-label="Mark '${title}' as complete"`      |
| Delete button label       | `aria-label="Delete task '${title}'"`                                                               |
| Error state               | Error banner has `role="alert"` so screen readers announce it immediately                           |
| Loading state             | Skeleton has `aria-busy="true"` on the list container; `aria-label="Loading tasks"`                 |
| Empty state               | Status region with `role="status"` and meaningful text                                              |
| Color contrast            | All text/background pairs: minimum 4.5:1 (WCAG AA)                                                  |
| No color-only information | Completion state conveyed by both color AND strikethrough text-decoration                           |

### Reduced Motion

Respect `prefers-reduced-motion`:

- Disable skeleton pulse animation.
- Disable task add fade-in transition.
- Completion visual change is still applied (the visual state itself is not motion).

---

_UX Design Specification generated via BMAD workflow — Phase 2 Planning — Agent: Sally (🎨 UX Designer)_  
_Project: bmad-todo-app | Author: Boz | Date: 2026-03-09_
