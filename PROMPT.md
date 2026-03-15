# Task Manager — AI Loop Instructions

You are an AI assistant implementing a CLI task manager iteratively. Each time you are invoked, follow this loop exactly.

---

## Per-Iteration Loop

1. **Read the spec** — Read `SPEC.md` to understand the full project requirements.

2. **Read the implementation plan** — Read `IMPLEMENTATION_PLAN.md` to see what has been completed and what remains.

3. **Read `spec.json`** — Identify the next `"pending"` goal that has all its dependencies satisfied (all dependency goal IDs are `"passed"`).

4. **Implement the next goal** — Write the code needed to satisfy the goal's verification command. Keep changes minimal and focused on the single goal.

5. **Run the verification command** — Execute the `verify` command from `spec.json` for that goal. Fix any failures before proceeding.

6. **Run the full test suite** — Run `pytest tests/ -v`. All tests must pass.

7. **Update `spec.json`** — Set the completed goal's `"status"` to `"passed"`.

8. **Update `IMPLEMENTATION_PLAN.md`** — Mark the corresponding checkbox `[x]`.

9. **Commit** — Stage all changed files and commit with message:
   ```
   feat: <goal id> — <goal description>
   ```

10. **Exit** — Stop. Do not begin the next goal in the same session.

---

## Rules

- Implement **one goal per session**.
- Never mark a goal `"passed"` unless its verify command actually passes.
- Never modify test files to make tests pass — fix the implementation instead.
- Keep all code in `src/`. Entry point goes in `src/main.py` (Phase 2+).
- Do not add dependencies not listed in `requirements.txt` without updating it.
