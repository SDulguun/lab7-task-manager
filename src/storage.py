import json
from pathlib import Path

from src.task import Task


def load_tasks(path: str) -> list[Task]:
    p = Path(path)
    if not p.exists() or p.stat().st_size == 0:
        return []
    with open(p, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [Task.from_dict(item) for item in data]


def save_tasks(tasks: list[Task], path: str) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump([t.to_dict() for t in tasks], f, indent=2)


def get_next_id(tasks: list[Task]) -> int:
    if not tasks:
        return 1
    return max(t.id for t in tasks) + 1
