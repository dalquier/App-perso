"""Pyto client for the temporary Replit connectivity experiment."""

from __future__ import annotations

import json
import urllib.error
import urllib.request


# Replace this value with the development or published URL shown by Replit.
REPLIT_BASE_URL = "https://REPLACE-ME.replit.dev"


def fetch_ping(base_url: str = REPLIT_BASE_URL) -> dict[str, object]:
    """Fetch and validate the Replit health-check response."""
    url = f"{base_url.rstrip('/')}/ping"
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "Pyto-Replit-Test/1.0",
        },
    )

    with urllib.request.urlopen(request, timeout=15) as response:
        if response.status != 200:
            raise RuntimeError(f"Statut HTTP inattendu : {response.status}")
        data = json.loads(response.read().decode("utf-8"))

    required = {"success", "message", "source", "timestamp"}
    missing = required.difference(data)
    if missing:
        raise ValueError(f"Champs manquants : {', '.join(sorted(missing))}")
    if data["success"] is not True:
        raise ValueError("Replit a répondu, mais le test est signalé en échec")
    return data


def main() -> None:
    """Run the test and print a result suited to the Pyto console."""
    if "REPLACE-ME" in REPLIT_BASE_URL:
        print("❌ Remplace REPLIT_BASE_URL par l'adresse fournie par Replit.")
        return

    print("Test de connexion à Replit…")
    try:
        data = fetch_ping()
    except urllib.error.HTTPError as error:
        print(f"❌ Erreur HTTP : {error.code}")
    except urllib.error.URLError as error:
        print(f"❌ Serveur inaccessible : {error.reason}")
    except (json.JSONDecodeError, ValueError, RuntimeError) as error:
        print(f"❌ Réponse invalide : {error}")
    except Exception as error:  # final user-facing safety net in Pyto
        print(f"❌ Erreur inattendue : {error}")
    else:
        print("✅ CONNEXION RÉUSSIE")
        print(f"Message : {data['message']}")
        print(f"Source  : {data['source']}")
        print(f"Date    : {data['timestamp']}")


if __name__ == "__main__":
    main()
