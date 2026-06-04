# AI PDF Reader

Eine Web-App, mit der man ein PDF hochlädt und ihm per Frage gezielt Antworten entlocken kann – mit klarem Fokus auf **echte Barrierefreiheit** (Blind-first, Screenreader-tauglich, optionales Vorlesen).

<!-- Screenshot ersetzen: lege z. B. docs/screenshot.png ab -->
![Screenshot der Anwendung](docs/screenshot.png)

---

## Über das Projekt

Ursprünglich eine Uni-Gruppenarbeit (6 Personen; ich als Group Leader und verantwortlich für die Programmierung). Der ursprüngliche Code war unstrukturiert, „RAG" existierte nur dem Namen nach und war nie an den Abfragepfad angeschlossen, und ein echter PDF-Upload wie auch echte Barrierefreiheit fehlten.

**Diese Version ist ein vollständiger Solo-Neubau von Grund auf** – mit sauberer Modultrennung, durchdachter Barrierefreiheit und einer bewusst einfachen, aber erweiterbaren Architektur. Den ausführlichen Werdegang (Entscheidungen, Vorher/Nachher, Trennung von Gruppen- und Solo-Phase) beschreibt die [Case Study](#case-study).

---

## Features

- **PDF hochladen** und im Arbeitsspeicher in Text umwandeln (`pypdf`).
- **Fragen stellen** – die Antwort basiert ausschließlich auf dem Dokumenttext; fehlt eine Information, sagt das Modell das offen, statt zu raten.
- **Vorlesen** der Antwort per Web Speech API (clientseitig) – für Sehschwäche, Leseschwäche oder entspanntes Zuhören.
- **Klare Fehler- und Statusmeldungen** für Upload, leere Eingaben und KI-Ausfälle.

---

## Barrierefreiheit (Schwerpunkt)

Die App ist Blind-first gedacht – das Erlebnis entsteht in Semantik, Ansagen und Fokus, nicht nur in der Optik:

- Semantisches HTML mit Landmarks und **Skip-Link**
- `<label>` an jedem Eingabefeld
- **`aria-live`-Regionen** für Status- und Antworttext (höflich) sowie Fehler (assertiv)
- **Fokus-Management**: Nach dem Eintreffen einer Antwort springt der Fokus in die Antwort
- Sichtbare Fokusringe und durchgehend WCAG-geprüfte Kontraste (Text ≥ 4,5:1)
- `fetch` statt Seiten-Neuladen, damit der Kontext erhalten bleibt

---

## Architektur

Jede Datei hat genau eine Aufgabe; `main.py` verbindet sie nur.

| Datei            | Aufgabe                                                        |
| ---------------- | -------------------------------------------------------------- |
| `app/main.py`    | FastAPI-Routes, HTTP, verbindet die Module                     |
| `app/pdf.py`     | PDF-Bytes → reiner Text (`pypdf`)                              |
| `app/context.py` | Aufbereitung des Kontexts für die KI – **Naht für späteres RAG** |
| `app/ai.py`      | OpenAI gekapselt, vollständige Fehlerbehandlung                |
| `app/config.py`  | Einstellungen aus `.env`, getippt bereitgestellt               |
| `static/`        | `style.css`, `app.js` (Plain HTML/CSS/JS, kein Framework)      |
| `templates/`     | `index.html` (Jinja2)                                          |
| `tests/`         | Tests                                                          |

**Der wichtigste Entwurfsentscheid:** Die gesamte Anwendung greift nur über `context.get_context()` auf den Dokumentkontext zu. Ein späterer Umstieg auf RAG (Embeddings + Vektorsuche) berührt **nur diese eine Funktion** – die Signatur bleibt gleich, der Rest der App merkt vom Wechsel nichts.

---

## Tech-Stack

Python · FastAPI · OpenAI API (`gpt-4o-mini`) · pypdf · Jinja2 · Plain HTML/CSS/JS · Web Speech API

---

## Lokal starten

Voraussetzung: Python 3.11+ und ein OpenAI-API-Key.

```bash
# 1. Virtuelle Umgebung
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Abhängigkeiten
pip install -r requirements.txt

# 3. Konfiguration
cp .env.example .env             # danach OPENAI_API_KEY eintragen

# 4. Starten (aus dem Projekt-Wurzelverzeichnis)
uvicorn app.main:app --reload
```

Anschließend im Browser öffnen: <http://127.0.0.1:8000>

---

## Tests

```bash
pip install pytest httpx
pytest
```

---

## Bewusster Scope

Die App ist ein durchdachter Prototyp, kein Produkt – einige Vereinfachungen sind absichtlich:

- **Ein Dokument im Arbeitsspeicher**, keine Persistenz und kein Mehrbenutzer-Zustand.
- **Einfache Methode**: Der gesamte (ggf. gekürzte) PDF-Text geht in den Prompt. `context.py` ist die bereits vorbereitete Naht, um später auf RAG umzustellen, sobald PDFs regelmäßig zu groß werden.
- **Bewusste Grenzen** für Upload-Größe und Kontextlänge schützen vor Kosten und Kontextfenster-Überlauf.

---

## Case Study

Ausführlicher Design- und Engineering-Werdegang: **[Link einfügen]**

---

## Lizenz

MIT – siehe [`LICENSE`](LICENSE). © [Jahr] [Dein Name]
