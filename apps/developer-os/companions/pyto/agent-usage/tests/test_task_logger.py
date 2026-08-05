import tempfile, unittest
from pathlib import Path
from helpers import ROOT  # noqa: F401
from storage import JsonlStore
from task_logger import TaskLogger

class TaskLoggerTests(unittest.TestCase):
    def test_start_and_close_task(self):
        with tempfile.TemporaryDirectory() as tmp:
            logger = TaskLogger(JsonlStore(Path(tmp)))
            task = logger.start_task("codex", "developeros", "Build", started_at="2026-08-05T10:00:00+00:00")
            closed = logger.close_task(task.task_id, ended_at="2026-08-05T10:10:00+00:00")
            self.assertEqual(closed.status, "completed")
            self.assertEqual(len(logger.store.tasks()), 2)
if __name__ == "__main__": unittest.main()
