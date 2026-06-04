"""PDF-Verarbeitung: rohe PDF-Bytes zu reinem Text.

Einzige Aufgabe dieses Moduls. Es kennt weder die AI noch das Web-Framework.
"""

import io

from pypdf import PdfReader


class PdfError(Exception):
    """Wird ausgeloest, wenn eine PDF nicht gelesen werden kann."""


def extract_text(pdf_bytes: bytes) -> str:
    """Extrahiert den Textinhalt aus einer PDF.

    Args:
        pdf_bytes: Der rohe Inhalt der PDF-Datei.

    Returns:
        Der zusammenhaengende Text aller Seiten.

    Raises:
        PdfError: Wenn die Datei keine lesbare PDF ist oder keinen
            extrahierbaren Text enthaelt (z. B. eine reine Scan-PDF).
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as exc:  # pypdf wirft diverse Fehlertypen
        raise PdfError("Die Datei konnte nicht als PDF gelesen werden.") from exc

    seiten_texte: list[str] = []
    for seite in reader.pages:
        text = seite.extract_text() or ""
        if text.strip():
            seiten_texte.append(text.strip())

    if not seiten_texte:
        raise PdfError(
            "Aus dieser PDF liess sich kein Text extrahieren. "
            "Vermutlich handelt es sich um ein gescanntes Dokument ohne "
            "Texterkennung."
        )

    return "\n\n".join(seiten_texte)
