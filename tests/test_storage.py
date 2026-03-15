import json
import pytest
from pathlib import Path

from src.task import Task
from src.storage import load_tasks, save_tasks, get_next_id


@pytest.fixture
def tmp_path_file(tmp_path):
    return str(tmp_path / "tasks.json")


def make_task(id: int, title: str) -> Task:
    return Task(id=id, title=title)


def test_load_tasks_nonexistent_file(tmp_path_file):
    tasks = load_tasks(tmp_path_file)
    assert tasks == []


def test_load_tasks_empty_file(tmp_path_file):
    Path(tmp_path_file).write_text("")
    tasks = load_tasks(tmp_path_file)
    assert tasks == []


def test_save_and_load_round_trip(tmp_path_file):
    original = [make_task(1, "Task one"), make_task(2, "Task two")]
    save_tasks(original, tmp_path_file)
    loaded = load_tasks(tmp_path_file)
    assert len(loaded) == 2
    assert loaded[0].id == 1
    assert loaded[0].title == "Task one"
    assert loaded[1].id == 2
    assert loaded[1].title == "Task two"


def test_save_creates_valid_json(tmp_path_file):
    save_tasks([make_task(1, "Hello")], tmp_path_file)
    with open(tmp_path_file) as f:
        data = json.load(f)
    assert isinstance(data, list)
    assert data[0]["title"] == "Hello"


def test_save_empty_list(tmp_path_file):
    save_tasks([], tmp_path_file)
    loaded = load_tasks(tmp_path_file)
    assert loaded == []


def test_get_next_id_empty():
    assert get_next_id([]) == 1


def test_get_next_id_with_tasks():
    tasks = [make_task(1, "a"), make_task(3, "b"), make_task(2, "c")]
    assert get_next_id(tasks) == 4


def test_get_next_id_single():
    assert get_next_id([make_task(5, "x")]) == 6
