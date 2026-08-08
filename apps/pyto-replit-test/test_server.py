"""Static contract tests for the temporary Replit server."""

from datetime import datetime
import unittest

from replit_server import build_ping_response


class PingResponseTests(unittest.TestCase):
    def test_ping_response_contract(self) -> None:
        response = build_ping_response()

        self.assertIs(response["success"], True)
        self.assertEqual(response["source"], "Replit")
        self.assertIn("Pyto + Replit", response["message"])
        self.assertIsNotNone(datetime.fromisoformat(response["timestamp"]))


if __name__ == "__main__":
    unittest.main()
