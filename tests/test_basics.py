"""Tests fuer die Module ohne externe Abhaengigkeiten.

Bewusst begrenzt auf pdf und context -- diese laufen ohne API-Key
und ohne Netzwerk. Die AI-Anbindung wird hier nicht getestet.
"""

import io

import pytest
from pypdf import PdfWriter

from app import context, pdf
from app.config import settings


def _erzeuge_leere_pdf() -> bytes:
    """Baut eine gueltige PDF mit einer leeren Seite (kein Text)."""
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    puffer = io.BytesIO()
    writer.write(puffer)
    return puffer.getvalue()


# --- pdf.extract_text ---

def test_kaputte_datei_wirft_pdferror():
    """Nicht-PDF-Bytes muessen einen PdfError ausloesen."""
    with pytest.raises(pdf.PdfError):
        pdf.extract_text(b"das ist keine pdf")


def test_pdf_ohne_text_wirft_pdferror():
    """Eine gueltige PDF ohne Textinhalt (z. B. Scan) wird abgelehnt."""
    leere_pdf = _erzeuge_leere_pdf()
    with pytest.raises(pdf.PdfError):
        pdf.extract_text(leere_pdf)


# --- context.get_context ---

def test_kurzer_text_bleibt_unveraendert():
    """Text unter der Grenze wird unveraendert zurueckgegeben."""
    text = "Ein kurzer Dokumenttext."
    assert context.get_context("egal", text) == text


def test_langer_text_wird_gekuerzt():
    """Text ueber der Grenze wird auf max_context_chars gekuerzt."""
    langer_text = "x" * (settings.max_context_chars + 5000)
    ergebnis = context.get_context("egal", langer_text)
    assert len(ergebnis) == settings.max_context_chars
