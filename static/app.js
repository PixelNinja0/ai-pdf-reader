/* AI PDF Reader -- Frontend-Logik
 *
 * Drei Aufgaben: PDF hochladen, Frage senden, Antwort vorlesen.
 * Die Kommunikation mit dem Server laeuft ueber fetch(), damit die
 * Seite nicht neu laedt -- das ist die Voraussetzung dafuer, dass
 * eine neue Antwort einem Screenreader sauber angekuendigt werden kann.
 */

(function () {
    "use strict";

    // --- Elemente einsammeln ---
    const dateiFeld = document.getElementById("pdf-datei");
    const uploadKnopf = document.getElementById("upload-knopf");
    const uploadStatus = document.getElementById("upload-status");

    const frageFeld = document.getElementById("frage-feld");
    const frageKnopf = document.getElementById("frage-knopf");

    const antwortBereich = document.getElementById("antwort-bereich");
    const antwortInhalt = document.getElementById("antwort-inhalt");
    const vorlesenKnopf = document.getElementById("vorlesen-knopf");

    // --- Hilfsfunktion: Statusmeldung setzen ---
    function setzeStatus(element, text, art) {
        element.textContent = text;
        element.className = "status" + (art ? " " + art : "");
    }

    // --- PDF hochladen ---
    async function ladeHoch() {
        const datei = dateiFeld.files[0];
        if (!datei) {
            setzeStatus(uploadStatus, "Bitte zuerst eine PDF auswaehlen.", "fehler");
            return;
        }

        setzeStatus(uploadStatus, "PDF wird hochgeladen ...", null);
        uploadKnopf.disabled = true;

        const daten = new FormData();
        daten.append("file", datei);

        try {
            const antwort = await fetch("/upload", {
                method: "POST",
                body: daten,
            });
            const ergebnis = await antwort.json();

            if (!antwort.ok) {
                setzeStatus(uploadStatus, ergebnis.fehler || "Upload fehlgeschlagen.", "fehler");
                return;
            }

            setzeStatus(
                uploadStatus,
                'PDF "' + ergebnis.dateiname + '" geladen. Du kannst jetzt Fragen stellen.',
                "erfolg"
            );
            // Frage-Bereich freischalten
            frageFeld.disabled = false;
            frageKnopf.disabled = false;
        } catch (e) {
            setzeStatus(uploadStatus, "Netzwerkfehler beim Upload.", "fehler");
        } finally {
            uploadKnopf.disabled = false;
        }
    }

    // --- Frage absenden ---
    async function sendeFrage() {
        const frage = frageFeld.value.trim();
        if (!frage) {
            return;
        }

        // Antwortbereich sichtbar machen und Ladezustand anzeigen
        antwortBereich.hidden = false;
        antwortInhalt.textContent = "Antwort wird erstellt ...";
        frageKnopf.disabled = true;

        const daten = new FormData();
        daten.append("frage", frage);

        try {
            const antwort = await fetch("/query", {
                method: "POST",
                body: daten,
            });
            const ergebnis = await antwort.json();

            if (!antwort.ok) {
                antwortInhalt.textContent = ergebnis.fehler || "Anfrage fehlgeschlagen.";
            } else {
                antwortInhalt.textContent = ergebnis.antwort;
            }
        } catch (e) {
            antwortInhalt.textContent = "Netzwerkfehler bei der Anfrage.";
        } finally {
            frageKnopf.disabled = false;
            // Fokus auf die Antwort setzen, damit Tastatur- und
            // Screenreader-Nutzer direkt dort sind.
            antwortInhalt.focus();
        }
    }

    // --- Antwort vorlesen (Web Speech API, laeuft im Browser) ---
    function leseVor() {
        const text = antwortInhalt.textContent.trim();
        if (!text) {
            return;
        }
        if (!("speechSynthesis" in window)) {
            setzeStatus(uploadStatus, "Vorlesen wird von diesem Browser nicht unterstuetzt.", "fehler");
            return;
        }
        // Laufende Ausgabe stoppen, bevor eine neue beginnt
        window.speechSynthesis.cancel();
        const aeusserung = new SpeechSynthesisUtterance(text);
        aeusserung.lang = "de-DE";
        window.speechSynthesis.speak(aeusserung);
    }

    // --- Ereignisse verbinden ---
    uploadKnopf.addEventListener("click", ladeHoch);
    frageKnopf.addEventListener("click", sendeFrage);
    vorlesenKnopf.addEventListener("click", leseVor);

    // Enter im Frage-Feld sendet die Frage
    frageFeld.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendeFrage();
        }
    });
})();
