"""Convenience API to start and close Codex/Work task records."""

from __future__ import annotations

from datetime import datetime

from identifiers import next_identifier
from models import TaskRecord
from storage import JsonlStore


class TaskLogger:
    def __init__(self, store: JsonlStore) -> None:
        self.store = store

    def start_task(self, tool: str, project_id: str, title: str, source: str = "manual", started_at: str | None = None, notes: str | None = None) -> TaskRecord:
        when = datetime.fromisoformat(started_at.replace("Z", "+00:00")) if started_at else datetime.now().astimezone()
        task = TaskRecord.create(
            task_id=next_identifier("task", [item.task_id for item in self.store.tasks()], when),
            tool=tool,
            project_id=project_id,
            title=title,
            started_at=when.isoformat(),
            status="running",
            source=source,
            notes=notes,
        )
        self.store.add_task(task)
        return task

    def close_task(self, task_id: str, status: str = "completed", ended_at: str | None = None) -> TaskRecord:
        tasks = self.store.tasks()
        matches = [task for task in tasks if task.task_id == task_id]
        if not matches:
            raise ValueError(f"unknown task_id: {task_id}")
        current = matches[-1]
        closed = TaskRecord.create(**{**current.to_dict(), "status": status, "ended_at": ended_at or datetime.now().astimezone().isoformat()})
        self.store.add_task(closed)
        return closed
