import { test, expect, type APIRequestContext } from "@playwright/test";

const API_BASE = "http://localhost:8000/api/v1";

/** Delete every todo via the REST API so each test starts with a clean slate. */
async function clearAllTodos(request: APIRequestContext): Promise<void> {
  const res = await request.get(`${API_BASE}/todos`);
  const todos: Array<{ id: string }> = await res.json();
  await Promise.all(
    todos.map((todo) => request.delete(`${API_BASE}/todos/${todo.id}`)),
  );
}

test.describe("Todo App", () => {
  test.beforeEach(async ({ request, page }) => {
    await clearAllTodos(request);
    await page.goto("/");
  });

  // ─── Page Load ─────────────────────────────────────────────────────────────

  test.describe("Page load", () => {
    test("displays the app heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "My Tasks" }),
      ).toBeVisible();
    });

    test("displays the add-task input and button", async ({ page }) => {
      await expect(page.getByLabel("New task")).toBeVisible();
      await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
    });
  });

  // ─── Empty State ────────────────────────────────────────────────────────────

  test.describe("Empty state", () => {
    test("shows empty-state message when there are no tasks", async ({
      page,
    }) => {
      await expect(page.getByRole("status")).toContainText("Nothing to do");
    });
  });

  // ─── Add Task ───────────────────────────────────────────────────────────────

  test.describe("Add task", () => {
    test("adds a task by pressing Enter", async ({ page }) => {
      await page.getByLabel("New task").fill("Buy groceries");
      await page.getByLabel("New task").press("Enter");
      await expect(page.getByText("Buy groceries")).toBeVisible();
    });

    test("adds a task by clicking the Add button", async ({ page }) => {
      await page.getByLabel("New task").fill("Walk the dog");
      await page.getByRole("button", { name: "Add" }).click();
      await expect(page.getByText("Walk the dog")).toBeVisible();
    });

    test("clears the input after successfully adding a task", async ({
      page,
    }) => {
      const input = page.getByLabel("New task");
      await input.fill("Temporary task");
      await input.press("Enter");
      await expect(input).toHaveValue("");
    });

    test("shows inline validation error on empty submit", async ({ page }) => {
      await page.getByRole("button", { name: "Add" }).click();
      await expect(page.getByLabel("New task")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(page.getByRole("alert")).toContainText(
        "Task description is required",
      );
    });

    test("does not call the API when input is blank", async ({ page }) => {
      let postCalled = false;
      page.on("request", (req) => {
        if (req.url().includes("/api/v1/todos") && req.method() === "POST") {
          postCalled = true;
        }
      });

      await page.getByRole("button", { name: "Add" }).click();

      await expect(page.getByLabel("New task")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(postCalled).toBe(false);
    });

    test("clears validation error once the user starts typing", async ({
      page,
    }) => {
      // Trigger the error
      await page.getByRole("button", { name: "Add" }).click();
      await expect(page.getByRole("alert")).toBeVisible();

      // Start typing ─ error should disappear
      await page.getByLabel("New task").type("New");
      await expect(page.getByRole("alert")).not.toBeVisible();
    });

    test("added task persists after page reload", async ({ page }) => {
      await page.getByLabel("New task").fill("Persistent task");
      await page.getByLabel("New task").press("Enter");
      await expect(page.getByText("Persistent task")).toBeVisible();

      await page.reload();
      await expect(page.getByText("Persistent task")).toBeVisible();
    });
  });

  // ─── Complete Task ──────────────────────────────────────────────────────────

  test.describe("Complete task", () => {
    test("marks a task as complete by checking the checkbox", async ({
      page,
    }) => {
      await page.getByLabel("New task").fill("Finish report");
      await page.getByLabel("New task").press("Enter");
      await expect(page.getByText("Finish report")).toBeVisible();

      await page
        .getByRole("checkbox", { name: "Mark 'Finish report' as complete" })
        .click();
      await expect(
        page.getByRole("checkbox", {
          name: "Unmark 'Finish report' as complete",
        }),
      ).toBeChecked();
    });

    test("can toggle a completed task back to incomplete", async ({ page }) => {
      await page.getByLabel("New task").fill("Toggle me");
      await page.getByLabel("New task").press("Enter");

      // Mark complete
      await page
        .getByRole("checkbox", { name: "Mark 'Toggle me' as complete" })
        .click();
      await expect(
        page.getByRole("checkbox", { name: "Unmark 'Toggle me' as complete" }),
      ).toBeChecked();

      // Mark incomplete
      await page
        .getByRole("checkbox", { name: "Unmark 'Toggle me' as complete" })
        .click();
      await expect(
        page.getByRole("checkbox", { name: "Mark 'Toggle me' as complete" }),
      ).not.toBeChecked();
    });

    test("completed task state persists after page reload", async ({
      page,
    }) => {
      await page.getByLabel("New task").fill("Reload check");
      await page.getByLabel("New task").press("Enter");

      await page
        .getByRole("checkbox", { name: "Mark 'Reload check' as complete" })
        .click();
      await expect(
        page.getByRole("checkbox", {
          name: "Unmark 'Reload check' as complete",
        }),
      ).toBeChecked();

      await page.reload();

      await expect(
        page.getByRole("checkbox", {
          name: "Unmark 'Reload check' as complete",
        }),
      ).toBeChecked();
    });
  });

  // ─── Delete Task ────────────────────────────────────────────────────────────

  test.describe("Delete task", () => {
    test("removes a task from the list", async ({ page }) => {
      await page.getByLabel("New task").fill("Task to delete");
      await page.getByLabel("New task").press("Enter");
      await expect(page.getByText("Task to delete")).toBeVisible();

      await page
        .getByRole("button", { name: "Delete task 'Task to delete'" })
        .click();
      await expect(page.getByText("Task to delete")).not.toBeVisible();
    });

    test("shows empty state after the last task is deleted", async ({
      page,
    }) => {
      await page.getByLabel("New task").fill("Solo task");
      await page.getByLabel("New task").press("Enter");

      await page
        .getByRole("button", { name: "Delete task 'Solo task'" })
        .click();
      await expect(page.getByRole("status")).toContainText("Nothing to do");
    });
  });

  // ─── Full Workflow ──────────────────────────────────────────────────────────

  test.describe("Full workflow", () => {
    test("add → complete → delete a task", async ({ page }) => {
      const title = "Full workflow task";

      // Add
      await page.getByLabel("New task").fill(title);
      await page.getByLabel("New task").press("Enter");
      await expect(page.getByText(title)).toBeVisible();

      // Complete
      await page
        .getByRole("checkbox", { name: `Mark '${title}' as complete` })
        .click();
      await expect(
        page.getByRole("checkbox", { name: `Unmark '${title}' as complete` }),
      ).toBeChecked();

      // Delete
      await page
        .getByRole("button", { name: `Delete task '${title}'` })
        .click();
      await expect(page.getByText(title)).not.toBeVisible();
    });

    test("multiple tasks appear in insertion order", async ({ page }) => {
      const titles = ["First task", "Second task", "Third task"];

      for (const title of titles) {
        await page.getByLabel("New task").fill(title);
        await page.getByLabel("New task").press("Enter");
        await expect(page.getByText(title)).toBeVisible();
      }

      const items = page.getByRole("listitem");
      await expect(items.nth(0)).toContainText("First task");
      await expect(items.nth(1)).toContainText("Second task");
      await expect(items.nth(2)).toContainText("Third task");
    });

    test("deleting one task does not remove others", async ({ page }) => {
      for (const title of ["Keep me", "Delete me", "Keep me too"]) {
        await page.getByLabel("New task").fill(title);
        await page.getByLabel("New task").press("Enter");
        await expect(page.getByText(title)).toBeVisible();
      }

      await page
        .getByRole("button", { name: "Delete task 'Delete me'" })
        .click();

      await expect(page.getByText("Keep me")).toBeVisible();
      await expect(page.getByText("Keep me too")).toBeVisible();
      await expect(page.getByText("Delete me")).not.toBeVisible();
    });
  });

  // ─── Accessibility ──────────────────────────────────────────────────────────

  test.describe("Accessibility", () => {
    test("add-task input has an accessible label", async ({ page }) => {
      // getByLabel resolves via the associated <label> element
      await expect(page.getByLabel("New task")).toBeVisible();
    });

    test("keyboard: Tab from input to Add button, Enter submits", async ({
      page,
    }) => {
      await page.getByLabel("New task").fill("Keyboard task");
      await page.keyboard.press("Tab"); // move focus to Add button
      await page.keyboard.press("Enter"); // activate Submit
      await expect(page.getByText("Keyboard task")).toBeVisible();
    });

    test("error banner has role=alert so screen readers announce it", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Add" }).click();
      // role="alert" should be in the DOM and contain the validation message
      const alert = page.getByRole("alert");
      await expect(alert).toBeVisible();
      await expect(alert).toContainText("required");
    });

    test("checkbox aria-label changes when task is completed", async ({
      page,
    }) => {
      await page.getByLabel("New task").fill("Accessible task");
      await page.getByLabel("New task").press("Enter");

      // Before: label says Mark
      await expect(
        page.getByRole("checkbox", {
          name: "Mark 'Accessible task' as complete",
        }),
      ).toBeVisible();

      // Click to complete
      await page
        .getByRole("checkbox", { name: "Mark 'Accessible task' as complete" })
        .click();

      // After: label changes to Unmark
      await expect(
        page.getByRole("checkbox", {
          name: "Unmark 'Accessible task' as complete",
        }),
      ).toBeVisible();
    });

    test("mobile viewport (375px): all interactions work without horizontal scroll", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.reload();

      // No horizontal overflow
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

      // Core interactions still work
      await page.getByLabel("New task").fill("Mobile task");
      await page.getByLabel("New task").press("Enter");
      await expect(page.getByText("Mobile task")).toBeVisible();

      await page
        .getByRole("checkbox", { name: "Mark 'Mobile task' as complete" })
        .click();
      await page
        .getByRole("button", { name: "Delete task 'Mobile task'" })
        .click();
      await expect(page.getByText("Mobile task")).not.toBeVisible();
    });
  });
});
