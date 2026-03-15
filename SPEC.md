# Task Manager — Project Specification

## Overview

A command-line task manager built with Python and Click. Tasks are persisted locally in a JSON file. The tool supports creating, listing, updating, completing, deleting, and searching tasks.

## Tech Stack

- **Language**: Python 3.10+
- **CLI Framework**: Click
- **Storage**: JSON file (`tasks.json` in project root)
- **Testing**: pytest

## Data Model

Each task has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Auto-incremented unique identifier |
| `title` | str | Short title (required) |
| `description` | str | Optional longer description |
| `due_date` | str | Optional due date (YYYY-MM-DD) |
| `priority` | str | `low`, `medium`, or `high` (default: `medium`) |
| `status` | str | `pending` or `done` (default: `pending`) |
| `created_at` | str | ISO 8601 timestamp |
| `updated_at` | str | ISO 8601 timestamp |

## Commands

### `add`
Add a new task.

```
task add "Buy groceries" --description "Milk, eggs, bread" --due 2026-03-20 --priority high
```

### `list`
List all tasks. Optional filters: `--status`, `--priority`.

```
task list
task list --status pending
task list --priority high
```

### `done`
Mark a task as done by ID.

```
task done 3
```

### `delete`
Delete a task by ID.

```
task delete 5
```

### `edit`
Edit a task's fields by ID.

```
task edit 2 --title "Updated title" --priority low
```

### `search`
Search tasks by keyword (title and description).

```
task search groceries
```

## Storage

Tasks are saved in `tasks.json` as a JSON array. The file is created automatically on first use.

## Exit Codes

- `0` — success
- `1` — task not found or invalid input
