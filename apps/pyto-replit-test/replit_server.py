"""Minimal JSON server used to validate a Pyto-to-Replit connection."""

from __future__ import annotations

from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from typing import Any


def build_ping_response() -> dict[str, Any]:
    """Return the stable response contract for the health-check endpoint."""
    return {
        "success": True,
        "message": "Connexion Pyto + Replit réussie !",
        "source": "Replit",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


class RequestHandler(BaseHTTPRequestHandler):
    """Serve the single public endpoint required by the experiment."""

    def do_GET(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        if self.path != "/ping":
            self.send_error(404, "Endpoint introuvable")
            return

        body = json.dumps(build_ping_response(), ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        """Keep a concise access log in the Replit console."""
        print(f"[http] {self.address_string()} - {format % args}")


def run_server() -> None:
    """Start the server on Replit's assigned port or port 3000 locally."""
    port = int(os.environ.get("PORT", "3000"))
    server = HTTPServer(("0.0.0.0", port), RequestHandler)
    print(f"Serveur Pyto + Replit actif sur le port {port}")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
