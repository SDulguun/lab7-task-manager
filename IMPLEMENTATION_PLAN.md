# Task Manager — Implementation Plan

## Phase 1: Core Data Layer (complete)

- [x] Create `Task` dataclass with all required fields (`id`, `title`, `description`, `due_date`, `priority`, `status`, `created_at`, `updated_at`)
- [x] Implement `to_dict()` serialization method on `Task`
- [x] Implement `Task.from_dict()` deserialization classmethod
- [x] Implement `load_tasks(path)` in `storage.py`
- [x] Implement `save_tasks(tasks, path)` in `storage.py`
- [x] Implement `get_next_id(tasks)` in `storage.py`
- [x] Write tests for Task creation and serialization round-trip
- [x] Write tests for storage load/save and edge cases

## Phase 2: CLI Entry Point + `add` command

- [ ] Create `src/main.py` with Click group entry point
- [ ] Implement `task add` command (title required, optional: description, due_date, priority)
- [ ] Write integration test for `add` command

## Phase 3: Read + Update commands

- [ ] Implement `task list` command with optional `--status` and `--priority` filters
- [ ] Implement `task done <id>` command
- [ ] Implement `task delete <id>` command
- [ ] Implement `task edit <id>` command
- [ ] Write tests for list, done, delete, edit

## Phase 4: Search + Polish

- [ ] Implement `task search <keyword>` command
- [ ] Add user-friendly error messages for missing task IDs
- [ ] Write tests for search
- [ ] Final end-to-end smoke test
