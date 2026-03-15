from src.task import Task


def test_task_creation_defaults():
    t = Task(title="Buy milk")
    assert t.title == "Buy milk"
    assert t.id == 0
    assert t.description == ""
    assert t.due_date == ""
    assert t.priority == "medium"
    assert t.status == "pending"
    assert t.created_at != ""
    assert t.updated_at != ""


def test_task_creation_custom_fields():
    t = Task(
        title="Write report",
        id=5,
        description="Q1 summary",
        due_date="2026-03-31",
        priority="high",
        status="done",
    )
    assert t.id == 5
    assert t.description == "Q1 summary"
    assert t.due_date == "2026-03-31"
    assert t.priority == "high"
    assert t.status == "done"


def test_to_dict_contains_all_fields():
    t = Task(title="Test task", id=1)
    d = t.to_dict()
    assert set(d.keys()) == {
        "id", "title", "description", "due_date",
        "priority", "status", "created_at", "updated_at",
    }


def test_round_trip_serialization():
    t = Task(
        title="Round trip",
        id=7,
        description="Check me",
        due_date="2026-04-01",
        priority="low",
        status="pending",
    )
    restored = Task.from_dict(t.to_dict())
    assert restored.id == t.id
    assert restored.title == t.title
    assert restored.description == t.description
    assert restored.due_date == t.due_date
    assert restored.priority == t.priority
    assert restored.status == t.status
    assert restored.created_at == t.created_at
    assert restored.updated_at == t.updated_at


def test_from_dict_uses_defaults_for_missing_fields():
    d = {"id": 2, "title": "Minimal"}
    t = Task.from_dict(d)
    assert t.description == ""
    assert t.due_date == ""
    assert t.priority == "medium"
    assert t.status == "pending"
