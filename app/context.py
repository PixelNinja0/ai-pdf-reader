"""Kontext-Aufbereitung: aus Frage + PDF-Text wird der Kontext fuer die AI.

WICHTIG -- das ist die zentrale Austauschstelle des Projekts.

Aktuell (einfache Methode): die Funktion gibt den vollstaendigen
PDF-Text zurueck, ggf. gekuerzt. Die gesamte PDF wandert so in den Prompt.

Spaeterer RAG-Umbau: NUR die Implementierung dieser Funktion wird ersetzt
-- Embeddings der Frage bilden, aehnlichste Textabschnitte aus einer
Vektor-Datenbank holen, diese zurueckgeben. Die Signatur bleibt gleich,
deshalb merkt der Rest der Anwendung (main.py, ai.py) vom Wechsel nichts.

Genau diese Trennung hat im alten Prototyp gefehlt: dort war eine
RAG-Pipeline gebaut, aber nie an den Abfragepfad angeschlossen.
"""

from app.config import settings


def get_context(frage: str, pdf_text: str) -> str:
    """Baut den Kontext, der zusammen mit der Frage an die AI geht.

    Args:
        frage: Die Frage des Nutzers. Wird in der einfachen Methode
            nicht verwendet -- bei RAG dient sie als Suchanfrage.
        pdf_text: Der vollstaendige extrahierte PDF-Text.

    Returns:
        Der Kontexttext fuer den Prompt.
    """
    # frage wird hier bewusst noch nicht genutzt. Der Parameter ist
    # vorhanden, damit die RAG-Implementierung dieselbe Signatur hat.
    _ = frage

    if len(pdf_text) <= settings.max_context_chars:
        return pdf_text

    # PDF zu lang fuer einen einzigen Prompt: vorne kuerzen.
    # Das ist eine bewusste Vereinfachung. Sobald PDFs regelmaessig
    # diese Grenze ueberschreiten, ist das das Signal, auf RAG umzustellen.
    return pdf_text[: settings.max_context_chars]
