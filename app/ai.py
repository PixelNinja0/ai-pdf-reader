"""AI-Anbindung: kapselt die OpenAI-API vollstaendig.

Kein anderes Modul kennt das openai-SDK. Wer die AI wechseln will
(oder das Modell, den Prompt), aendert nur diese Datei.
"""

import openai

from app.config import settings

# Anweisung an das Modell. Bewusst knapp gehalten.
SYSTEM_PROMPT = (
    "Du bist ein Assistent, der Fragen zu einem PDF-Dokument beantwortet. "
    "Antworte ausschliesslich auf Basis des bereitgestellten Dokumenttexts. "
    "Wenn die Antwort nicht im Dokument steht, sage das klar und rate nicht. "
    "Formuliere klar und gut vorlesbar, da die Antwort per Sprachausgabe "
    "wiedergegeben werden kann."
)


class AiError(Exception):
    """Wird ausgeloest, wenn der AI-Aufruf fehlschlaegt."""


# Ein Client pro Prozess, nicht pro Anfrage.
_client = openai.OpenAI(api_key=settings.openai_api_key)


def ask(frage: str, kontext: str) -> str:
    """Stellt der AI eine Frage zum gegebenen Dokumentkontext.

    Args:
        frage: Die Frage des Nutzers.
        kontext: Der Dokumenttext (aus context.get_context).

    Returns:
        Die Antwort der AI als reiner Text.

    Raises:
        AiError: Bei jedem Problem mit dem API-Aufruf. Die Meldung ist
            so formuliert, dass sie dem Nutzer gezeigt werden kann.
    """
    user_nachricht = (
        f"Hier ist der Inhalt des Dokuments:\n\n{kontext}\n\n"
        f"Frage: {frage}"
    )

    try:
        antwort = _client.chat.completions.create(
            model=settings.model,
            max_tokens=1024,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_nachricht},
            ],
        )
    except openai.APIStatusError as exc:
        # Fehler von der API selbst (ungueltiger Key, Rate Limit, ...)
        raise AiError(
            f"Die AI-Anfrage wurde abgelehnt (Status {exc.status_code}). "
            "Pruefe API-Key und Kontingent."
        ) from exc
    except openai.APIConnectionError as exc:
        # Netzwerkproblem
        raise AiError(
            "Keine Verbindung zur AI moeglich. Pruefe die Internetverbindung."
        ) from exc
    except Exception as exc:  # letzte Sicherung
        raise AiError("Unerwarteter Fehler bei der AI-Anfrage.") from exc

    if not antwort.choices:
        raise AiError("Die AI hat keine verwertbare Antwort geliefert.")

    text = antwort.choices[0].message.content
    if not text:
        raise AiError("Die AI hat keine verwertbare Antwort geliefert.")

    return text.strip()
