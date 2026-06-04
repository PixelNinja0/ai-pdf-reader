"""Zentrale Konfiguration.

Alle Einstellungen werden hier aus der Umgebung (.env) gelesen und
getippt bereitgestellt. Kein anderes Modul liest os.getenv direkt.
"""

import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Anwendungseinstellungen, einmalig aus der Umgebung geladen."""

    # OpenAI API
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    model: str = os.getenv("MODEL", "gpt-4o-mini")

    # Begrenzung des PDF-Texts, der in einen Prompt geht.
    # Schutz gegen sehr grosse PDFs, die das Kontextfenster sprengen
    # oder unnoetig Kosten erzeugen. Bei spaeterem RAG-Umbau entfaellt das.
    max_context_chars: int = int(os.getenv("MAX_CONTEXT_CHARS", "200000"))

    # Maximale Upload-Groesse in Bytes (Standard 20 MB).
    max_upload_bytes: int = int(os.getenv("MAX_UPLOAD_BYTES", str(20 * 1024 * 1024)))

    def validate(self) -> None:
        """Prueft, ob zwingende Einstellungen vorhanden sind.

        Wird beim Serverstart aufgerufen, damit ein fehlender API-Key
        sofort auffaellt und nicht erst bei der ersten Frage.
        """
        if not self.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY fehlt. Lege eine .env-Datei an "
                "(siehe .env.example)."
            )


settings = Settings()
