"""FastAPI-Anwendung: Routes und nichts als Routes.

Die eigentliche Arbeit liegt in den Modulen pdf, context und ai.
main.py verbindet sie nur und kuemmert sich um HTTP.
"""

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app import ai, context, pdf
from app.config import settings

# Beim Start pruefen, ob der API-Key da ist -- lieber jetzt scheitern
# als bei der ersten Frage des Nutzers.
settings.validate()

app = FastAPI(title="AI PDF Reader")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# In-Memory-Speicher fuer den zuletzt hochgeladenen PDF-Text.
# Bewusste Vereinfachung fuer den Prototyp: ein einzelnes Dokument,
# kein Nutzer-spezifischer Zustand. Bei Server-Neustart leer.
_pdf_text: str | None = None


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    """Liefert die Hauptseite aus."""
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "pdf_geladen": _pdf_text is not None},
    )


@app.post("/upload")
async def upload(file: UploadFile = File(...)) -> JSONResponse:
    """Nimmt eine PDF entgegen, extrahiert den Text, haelt ihn im Speicher."""
    global _pdf_text

    inhalt = await file.read()

    if len(inhalt) > settings.max_upload_bytes:
        grenze_mb = settings.max_upload_bytes // (1024 * 1024)
        return JSONResponse(
            status_code=413,
            content={"fehler": f"Die Datei ist zu gross (max. {grenze_mb} MB)."},
        )

    try:
        _pdf_text = pdf.extract_text(inhalt)
    except pdf.PdfError as exc:
        return JSONResponse(status_code=422, content={"fehler": str(exc)})

    return JSONResponse(
        content={
            "erfolg": True,
            "dateiname": file.filename,
            "zeichen": len(_pdf_text),
        }
    )


@app.post("/query")
async def query(frage: str = Form(...)) -> JSONResponse:
    """Beantwortet eine Frage zum aktuell geladenen PDF."""
    if _pdf_text is None:
        return JSONResponse(
            status_code=400,
            content={"fehler": "Es wurde noch keine PDF hochgeladen."},
        )

    frage = frage.strip()
    if not frage:
        return JSONResponse(
            status_code=400,
            content={"fehler": "Die Frage ist leer."},
        )

    kontext = context.get_context(frage, _pdf_text)

    try:
        antwort = ai.ask(frage, kontext)
    except ai.AiError as exc:
        return JSONResponse(status_code=502, content={"fehler": str(exc)})

    return JSONResponse(content={"frage": frage, "antwort": antwort})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
