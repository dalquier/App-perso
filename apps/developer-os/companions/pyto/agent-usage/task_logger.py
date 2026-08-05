"""Convenience API to plan, start, query, and close task records."""

from __future__ import annotations

from datetime import datetime, timedelta

from errors import ValidationError
from identifiers import next_identifier
from models import TERMINAL_STATUSES, TaskRecord, parse_datetime
from storage import JsonlStore


class TaskLogger:
    def __init__(self, store: JsonlStore) -> None:
        self.store = store

    def _latest_records(self) -> list[TaskRecord]:
        """Return only the latest event for each task id, preserving event order."""
        latest: dict[str, TaskRecord] = {}
        order: list[str] = []
        for task in self.store.tasks():
            if task.task_id not in latest:
                order.append(task.task_id)
            latest[task.task_id] = task
        return [latest[task_id] for task_id in order]

    def create_task(self, tool: str, project_id: str, title: str, source: str = "manual", started_at: str | None = None, notes: str | None = None) -> TaskRecord:
        when = parse_datetime(started_at, "started_at") if started_at else datetime.now().astimezone()
        task = TaskRecord.create(
            task_id=next_identifier("task", [item.task_id for item in self.store.tasks()], when),
            tool=tool,
            project_id=project_id,
            title=title,
            started_at=when.isoformat(),
            status="planned",
            source=source,
            notes=notes,
        )
        self.store.add_task(task)
        return task

    def start_task(self, tool: str | None = None, project_id: str | None = None, title: str | None = None, source: str = "manual", started_at: str | None = None, notes: str | None = None, task_id: str | None = None) -> TaskRecord:
        when = parse_datetime(started_at, "started_at") if started_at else datetime.now().astimezone()
        if task_id:
            current = self.latest(task_id)
            if current.status != "planned":
                raise ValidationError("only planned tasks can be started")
            task = TaskRecord.create(**{**current.to_dict(), "status": "running", "started_at": when.isoformat()})
        else:
            if tool is None or project_id is None or title is None:
                raise ValidationError("tool, project_id and title are required")
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

    def latest(self, task_id: str) -> TaskRecord:
        matches = [task for task in self.store.tasks() if task.task_id == task_id]
        if not matches:
            raise ValueError(f"unknown task_id: {task_id}")
        return matches[-1]

    def close_task(self, task_id: str, status: str = "completed", ended_at: str | None = None) -> TaskRecord:
        if status not in TERMINAL_STATUSES:
            raise ValidationError("close status must be completed, failed, or cancelled")
        current = self.latest(task_id)
        if current.status in TERMINAL_STATUSES:
            raise ValidationError("task is already closed")
        if current.status not in {"planned", "running"}:
            raise ValidationError("invalid task transition")
        closed = TaskRecord.create(**{**current.to_dict(), "status": status, "ended_at": ended_at or datetime.now().astimezone().isoformat()})
        self.store.add_task(closed)
        return closed

    def active_task(self, tool: str | None = None, project_id: str | None = None) -> TaskRecord | None:
        active = [
            task
            for task in self._latest_records()
            if task.status == "running"
            and (tool is None or task.tool == tool)
            and (project_id is None or task.project_id == project_id)
        ]
        return active[-1] if active else None

    def filter_tasks(self, week_start: str | None = None, tool: str | None = None, project_id: str | None = None) -> list[TaskRecord]:
        tasks = self._latest_records()
        if week_start:
            start = parse_datetime(week_start, "week_start")
            end = start + timedelta(days=7)
            tasks = [task for task in tasks if start <= parse_datetime(task.started_at, "started_at") < end]
        if tool:
            tasks = [task for task in tasks if task.tool == tool]
        if project_id:
            tasks = [task for task in tasks if task.project_id == project_id]
        return tasks
