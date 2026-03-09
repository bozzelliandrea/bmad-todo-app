---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
date: 2026-03-09
author: Boz
lastStep: 6
status: complete
---

# Product Brief: bmad-todo-app

---

## Executive Summary

**bmad-todo-app** is a simple, full-stack personal task management application that allows individual users to create, view, complete, and delete todo items through a clean, intuitive interface backed by a persistent REST API.

The application addresses a universal and fundamental need: the ability to reliably track personal tasks without friction, onboarding overhead, or cognitive overload. Unlike heavyweight project management tools, notes apps, or complex task managers, this product stays deliberately minimal — making it immediately useful from the first interaction and trustworthy across sessions.

The first version intentionally scopes out authentication, multi-user support, collaboration, prioritization, deadlines, and notifications. This constraint is a feature, not a limitation: it ensures the core experience is polished, stable, and complete before any complexity is added.

**The product succeeds if a user can open the app, add a task, complete it, and delete it — without any guidance, confusion, or data loss.**

---

## Core Vision

### Problem Statement

People need a fast, frictionless way to track personal tasks. Most existing solutions are either too heavy (full project management tools like Jira, Notion, or Trello) or too ephemeral (sticky notes, mental lists, plain text files). Neither extreme gives individual users what they actually need: a persistent, simple, reliable task list that just works.

The problem is not a lack of tools — it is a lack of tools that prioritize **simplicity and reliability above everything else**. Users who want to manage their own tasks without collaboration features, deadlines, or project hierarchies are underserved by the current landscape.

### Problem Impact

- Users either over-invest in complex tools they don't fully use, leading to maintenance overhead and cognitive friction.
- Or they rely on fragile workarounds (browser tabs, notes, verbal reminders) that break down the moment complexity increases even slightly.
- Tasks are forgotten, lost across sessions, or buried in systems too complex to maintain consistently.

### Why Existing Solutions Fall Short

| Category                                       | Gap                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| Project management tools (Jira, Trello, Asana) | Require setup, projects, teams, onboarding — overkill for personal use |
| Notes apps (Notion, Apple Notes)               | Unstructured; no native task state (done/not done); fragile            |
| OS-native reminders                            | Device-bound, limited to mobile/desktop ecosystem                      |
| Browser todo extensions                        | Ephemeral, lost across sessions or device changes                      |
| Plain text / paper                             | Not persistent across digital contexts; easily lost                    |

None of these provide a **web-accessible, session-persistent, opinionated-but-minimal** personal task list.

### Proposed Solution

A web application with a single-page frontend and a REST API backend that:

- Shows the user's entire task list on load, immediately.
- Allows adding a new todo with a short text description in one action.
- Allows toggling completion state directly from the list.
- Allows deleting any todo directly from the list.
- Persists all data across page refreshes and sessions via a PostgreSQL database.
- Works well on both desktop and mobile browsers.
- Shows clear empty, loading, and error states.

### Key Differentiators

- **Zero onboarding:** The app is fully functional on first open with no registration, login, or tutorial.
- **Instant feedback:** All state changes (add, complete, delete) reflect immediately in the UI.
- **Deliberately minimal scope:** No feature bloat. Every UI element serves a core task-management action.
- **Extensible foundation:** The architecture is designed to support future features (auth, multi-user, prioritization) without requiring a rewrite.
- **Full-stack learning artifact:** The codebase is clean, well-structured, and designed to be extended by future developers.

---

## Target Users

### Primary Users

**Persona: Individual Task Manager — "The Focused Individual"**

Meet **Alex**, a software developer / knowledge worker / student who needs to track daily tasks without switching contexts to a heavy tool.

- **Context:** Alex works on multiple concerns throughout the day — code tasks, personal errands, research items, things to follow up on. They want a single, always-available list that persists across sessions.
- **Current behavior:** Alex keeps tasks in a browser tab with a notes app, a physical notepad, or just their memory — all of which are fragile and easily disrupted.
- **Goal:** Open the app, see current tasks instantly, add a new task in seconds, tick off completed ones, delete stale ones. No login. No setup. No friction.
- **Pain points:** Existing tools require either too much ceremony (auth, project setup, teams) or are too ephemeral (don't persist across sessions).
- **Success moment:** Alex refreshes the page after closing the browser and still sees all their tasks exactly as they left them.

### Secondary Users

**Persona: Developer / Future Maintainer — "The Builder"**

The application is also implicitly targeted at developers who will read, extend, and learn from it:

- Well-structured code with clear separation of concerns.
- Documented API with predictable behavior.
- A codebase that demonstrates good patterns for React + FastAPI + PostgreSQL projects.

This persona benefits even if they never interact with the running application — they interact with the code.

### User Journey

**Alex's Core Journey:**

1. **Discovery:** Alex opens the app URL in a browser (or bookmarks it). No login screen appears — the task list loads immediately.
2. **First use:** The list is empty. A clear empty state message is shown. Alex sees the input field and adds their first task: "Buy groceries". The task appears instantly below.
3. **Daily use:** Alex opens the app each morning. Their full task list from the previous session is visible. They scan it, add new items, and check off completed tasks. Completed tasks are visually distinct (e.g., strikethrough, dimmed).
4. **Cleanup:** Alex deletes tasks that are no longer relevant. The list remains clean and actionable.
5. **Mobile use:** Alex checks the list from their phone mid-day. The responsive layout adapts cleanly to the smaller screen.
6. **Error recovery:** If the backend is temporarily unavailable, the UI shows a non-destructive error state without clearing the list. Alex knows something went wrong without losing context.

---

## Success Metrics

**Primary success criterion (from project specification):**

> "The ability of a user to complete all core task-management actions without guidance."

This is the north star metric: a new user with no instructions can open the app, create a task, complete it, and delete it — all without any friction, tutorial, or support.

### User Success Metrics

| Metric                        | Target                                                  | Measurement                                       |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Task creation completion rate | 100% of attempts succeed or show clear error            | Manual QA + error log monitoring                  |
| Session persistence           | Tasks present on page reload across browsers            | Integration test: add → reload → assert present   |
| Completion toggle reliability | 100% of toggle actions reflect correct state            | Integration test: toggle → assert DB state        |
| Delete reliability            | 100% of delete actions remove item permanently          | Integration test: delete → reload → assert absent |
| Empty state clarity           | User understands the app is empty (not broken)          | UX review                                         |
| Error state quality           | User understands something went wrong without data loss | UX review + manual test with network disabled     |
| Mobile usability              | Core actions usable on 375px viewport                   | Manual test on mobile / browser devtools          |

### Business Objectives

Since this is a learning and portfolio project rather than a commercial product, "business" objectives are reframed as **project quality objectives**:

1. **Completeness:** All four core actions (create, read, complete, delete) work end-to-end with data persisting across sessions.
2. **Stability:** The app handles page refreshes, empty states, and backend errors gracefully without crashing or losing data.
3. **Clarity:** The UI communicates current state at a glance — active vs. completed tasks are visually distinct.
4. **Extensibility:** The architecture enables adding authentication, multi-user support, or additional task fields without rewriting core components.
5. **Learnability (BMAD):** The project successfully demonstrates the full BMAD workflow from brief → PRD → architecture → epics → implementation.

### Key Performance Indicators

| KPI                                                      | Target              |
| -------------------------------------------------------- | ------------------- |
| All core CRUD operations functional                      | 100% (binary)       |
| Backend API response time (local)                        | < 200ms per request |
| Frontend first contentful paint (local)                  | < 1 second          |
| Zero data loss on page refresh                           | Pass                |
| Mobile layout usable without horizontal scroll           | Pass at 375px       |
| No unhandled errors in browser console during normal use | Pass                |

---

## MVP Scope

### Core Features

The MVP delivers exactly four user-facing capabilities, plus the infrastructure to support them:

**1. View all todos**

- On page load, fetch and display all existing todos from the API.
- Show loading state while fetching.
- Show empty state when no todos exist.
- Show error state if fetch fails.

**2. Create a todo**

- Input field (text) at the top of the list.
- Submit via button click or Enter key.
- New todo appears immediately in the list (optimistic update or refetch).
- Input clears after submission.
- Short description is the only required field.

**3. Complete a todo**

- Toggle checkbox or click to mark a todo as done / not done.
- Visual distinction between active and completed todos (strikethrough, dimmed text, different icon).
- State persists across page refreshes.

**4. Delete a todo**

- Delete button/icon visible on each todo item.
- Todo removed immediately from the list.
- Deletion is permanent (no undo in MVP).

**Infrastructure requirements:**

- React frontend (Vite) deployed as a static SPA.
- FastAPI (Python) REST API with endpoints: `GET /todos`, `POST /todos`, `PATCH /todos/{id}`, `DELETE /todos/{id}`.
- PostgreSQL database with a single `todos` table.
- CORS configured for frontend ↔ backend communication.
- Basic error handling both client-side and server-side.
- Responsive layout (desktop + mobile).

### Out of Scope for MVP

The following capabilities are **explicitly excluded** from the initial version. This is a deliberate constraint to keep the scope focused:

| Feature                                 | Reason for exclusion                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| User authentication / accounts          | Adds significant complexity (authN, authZ, session management); multi-user is not a V1 goal |
| Multi-user / collaboration              | No auth = no isolation; deferred to future version                                          |
| Task prioritization / ordering          | Beyond the minimal task-management scope                                                    |
| Due dates / deadlines                   | Adds calendar complexity not required for core value                                        |
| Notifications / reminders               | Requires push/email infrastructure outside defined scope                                    |
| Tags / categories / labels              | Filtering and organization deferred to V2                                                   |
| Search                                  | Deferred; list is assumed small enough to scan visually                                     |
| Task editing (beyond completion toggle) | Edit-in-place adds UI complexity; delete-and-recreate is acceptable for MVP                 |
| Undo delete                             | Nice-to-have; skipped to keep deletion logic simple                                         |
| Bulk actions                            | Deferred to V2                                                                              |
| Dark mode                               | Nice-to-have; not required for core experience                                              |

### MVP Success Criteria

The MVP is considered complete when:

1. A user can open the app in a browser and see their task list (or an empty state) within 1 second on a local dev machine.
2. A user can create a new todo by typing text and pressing Enter or clicking a button.
3. A user can mark a todo as complete and the visual state reflects this immediately.
4. A user can delete a todo and it disappears immediately.
5. All state persists correctly after a full page refresh.
6. The layout is usable on a mobile viewport (375px wide) without horizontal scroll.
7. Graceful error states are shown when the backend is unavailable (no crash, no data loss).
8. No unhandled exceptions appear in the browser console or server logs during normal use.

### Future Vision

In future iterations, the application can evolve into a more complete personal productivity tool:

**V2 — User Accounts:**

- Authentication (email/password or OAuth).
- Each user has their own private task list.
- Session management and logout.

**V3 — Richer Task Management:**

- Edit task description in-place.
- Task prioritization (high/medium/low).
- Due dates with overdue visual indicators.
- Undo delete.

**V4 — Organization & Discovery:**

- Tags or categories for grouping tasks.
- Search/filter by keyword, status, or tag.
- Bulk-complete or bulk-delete.

**V5 — Collaboration:**

- Shared lists (family, small teams).
- Assigned tasks.
- Real-time sync via WebSockets.

**Long-term:**

- Native mobile app (React Native).
- Notifications / reminders (push, email).
- Integrations (calendar, GitHub issues, Slack).

The MVP architecture — React SPA + FastAPI REST API + PostgreSQL — is chosen specifically because it naturally scales to support all of these future capabilities without a fundamental rewrite.

---

_Product Brief generated via BMAD workflow — Phase 1 Analysis — Agent: Mary (📊 Business Analyst)_
_Project: bmad-todo-app | Author: Boz | Date: 2026-03-09_
