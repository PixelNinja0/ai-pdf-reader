/* AI PDF Reader – Frontend-Logik (Variante B: Konversation) */

(function () {
  "use strict";

  // --- Elemente ---
  const dokStatusLeer   = document.getElementById("dok-status-leer");
  const dokStatusAktiv  = document.getElementById("dok-status-aktiv");
  const dokDateiname    = document.getElementById("dok-dateiname");
  const aendernKnopf    = document.getElementById("aendern-knopf");

  const statusLive      = document.getElementById("status-live");
  const fehlerLive      = document.getElementById("fehler-live");

  const uploadSektion   = document.getElementById("upload-sektion");
  const pdfDateiFeld    = document.getElementById("pdf-datei");
  const uploadKnopf     = document.getElementById("upload-knopf");
  const uploadFehlerBox = document.getElementById("upload-fehler");

  const verlaufSektion  = document.getElementById("verlauf-sektion");
  const verlauf         = document.getElementById("verlauf");
  const leerZustand     = document.getElementById("leer-zustand");

  const eingabeLeiste   = document.getElementById("eingabe-leiste");
  const frageForm       = document.getElementById("frage-form");
  const frageFeld       = document.getElementById("frage-feld");
  const sendenKnopf     = document.getElementById("senden-knopf");

  const dialog          = document.getElementById("wechsel-dialog");
  const dialogAbbrechen = document.getElementById("dialog-abbrechen");
  const dialogLaden     = document.getElementById("dialog-laden");
  const wechselDatei    = document.getElementById("wechsel-datei");
  const dialogFehlerBox = document.getElementById("dialog-fehler");

  // --- Hilfsfunktionen: Live-Regionen ---

  // Kurze Verzögerung stellt sicher, dass AT die Textänderung bemerkt
  function kündige(region, text) {
    region.textContent = "";
    setTimeout(function () { region.textContent = text; }, 50);
  }

  function setzeStatus(text) { kündige(statusLive, text); }
  function setzeFehler(text) { kündige(fehlerLive, text); }

  // --- Upload-Fehler-Box ---
  function zeigeUploadFehler(text) {
    uploadFehlerBox.textContent = "Fehler: " + text;
    uploadFehlerBox.hidden = false;
    setzeFehler("Fehler: " + text);
  }

  function verbergeUploadFehler() {
    uploadFehlerBox.hidden = true;
    uploadFehlerBox.textContent = "";
  }

  // --- Dialog-Fehler-Box ---
  function zeigeDialogFehler(text) {
    dialogFehlerBox.textContent = "Fehler: " + text;
    dialogFehlerBox.hidden = false;
    setzeFehler("Fehler: " + text);
  }

  function verbergeDialogFehler() {
    dialogFehlerBox.hidden = true;
    dialogFehlerBox.textContent = "";
  }

  // --- Auto-Grow Textarea ---
  function wachseTextarea() {
    frageFeld.style.height = "auto";
    frageFeld.style.height = frageFeld.scrollHeight + "px";
  }

  frageFeld.addEventListener("input", wachseTextarea);

  // --- Zustand: PDF geladen ---
  function zeigePdfAnsicht(dateiname) {
    uploadSektion.hidden   = true;
    verlaufSektion.hidden  = false;
    eingabeLeiste.hidden   = false;
    frageFeld.disabled     = false;
    sendenKnopf.disabled   = false;

    dokStatusLeer.hidden   = true;
    dokStatusAktiv.hidden  = false;
    if (dateiname) dokDateiname.textContent = dateiname;
  }

  // --- Zustand: kein PDF ---
  function zeigeUploadAnsicht() {
    verlaufSektion.hidden  = true;
    eingabeLeiste.hidden   = true;
    frageFeld.disabled     = true;
    sendenKnopf.disabled   = true;

    uploadSektion.hidden   = false;
    verbergeUploadFehler();

    dokStatusLeer.hidden   = false;
    dokStatusAktiv.hidden  = true;
  }

  // --- Verlauf leeren ---
  function leereVerlauf() {
    // Alle Bubbles entfernen, Leer-Zustand wieder einblenden
    Array.from(verlauf.children).forEach(function (kind) {
      if (kind !== leerZustand) kind.remove();
    });
    leerZustand.hidden = false;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // --- HTTP-Upload ---
  async function hochladen(datei) {
    const form = new FormData();
    form.append("file", datei);
    try {
      const res  = await fetch("/upload", { method: "POST", body: form });
      const body = await res.json();
      return { ok: res.ok, body };
    } catch (_) {
      return { ok: false, body: { fehler: "Netzwerkfehler beim Upload." } };
    }
  }

  // --- Initialer Upload ---
  // Knopf öffnet nur den Datei-Dialog; der Upload startet beim change-Event
  uploadKnopf.addEventListener("click", function () {
    pdfDateiFeld.click();
  });

  pdfDateiFeld.addEventListener("change", async function () {
    verbergeUploadFehler();
    const datei = pdfDateiFeld.files[0];
    if (!datei) return;

    uploadKnopf.disabled    = true;
    uploadKnopf.textContent = "Wird hochgeladen …";

    const { ok, body } = await hochladen(datei);

    uploadKnopf.disabled    = false;
    uploadKnopf.textContent = "PDF laden";

    if (!ok) {
      zeigeUploadFehler(body.fehler || "Upload fehlgeschlagen.");
      return;
    }
    zeigePdfAnsicht(body.dateiname);
    setzeStatus("Erfolg: " + body.dateiname + " geladen.");
    leerZustand.focus();
  });

  // --- Frage-Bubble ---
  function erstelleFrageBubble(text) {
    leerZustand.hidden = true;
    const art   = document.createElement("article");
    const label = document.createElement("p");
    const inhalt = document.createElement("p");

    art.className      = "bubble bubble--frage";
    art.setAttribute("aria-label", "Deine Frage");
    label.className    = "bubble__label";
    label.textContent  = "Deine Frage";
    inhalt.className   = "bubble__text";
    inhalt.textContent = text;

    art.appendChild(label);
    art.appendChild(inhalt);
    verlauf.appendChild(art);
    return art;
  }

  // --- Lade-Platzhalter ---
  function erstelleLadePlatzhalter() {
    const p = document.createElement("p");
    p.className   = "lade-bubble";
    p.textContent = "Antwort wird erstellt …";
    verlauf.appendChild(p);
    return p;
  }

  // --- Vorlesen-Button (Toggle) ---
  function erstelleVorlesenBtn(antwortText) {
    const btn = document.createElement("button");
    btn.type      = "button";
    btn.className = "btn btn--vorlesen";

    if (!("speechSynthesis" in window)) {
      btn.textContent = "Vorlesen";
      btn.disabled    = true;
      btn.title       = "Vorlesen wird von diesem Browser nicht unterstützt.";
      return btn;
    }

    let laeuft = false;

    function stoppe() {
      window.speechSynthesis.cancel();
      laeuft          = false;
      btn.textContent = "Vorlesen";
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label",   "Antwort vorlesen");
    }

    btn.textContent = "Vorlesen";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label",   "Antwort vorlesen");

    btn.addEventListener("click", function () {
      if (laeuft) { stoppe(); return; }

      window.speechSynthesis.cancel(); // andere Ausgabe stoppen
      const utter = new SpeechSynthesisUtterance(antwortText);
      utter.lang  = "de-DE";
      utter.addEventListener("end",   stoppe);
      utter.addEventListener("error", stoppe);
      window.speechSynthesis.speak(utter);

      laeuft          = true;
      btn.textContent = "Stoppen";
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label",   "Vorlesen stoppen");
    });

    return btn;
  }

  // --- Antwort-Bubble ---
  function erstelleAntwortBubble(text) {
    const art    = document.createElement("article");
    const label  = document.createElement("p");
    const inhalt = document.createElement("p");

    art.className = "bubble bubble--antwort";
    art.setAttribute("tabindex", "-1");
    art.setAttribute("aria-label", "Antwort");
    label.className    = "bubble__label";
    label.textContent  = "Antwort";
    inhalt.className   = "bubble__text";
    inhalt.textContent = text;

    art.appendChild(label);
    art.appendChild(inhalt);
    art.appendChild(erstelleVorlesenBtn(text));
    return art;
  }

  // --- Fehler-Bubble ---
  function erstelleFehlerBubble(fehlerText, frageText) {
    const art    = document.createElement("article");
    const label  = document.createElement("p");
    const inhalt = document.createElement("p");
    const btn    = document.createElement("button");

    art.className = "bubble bubble--fehler";
    art.setAttribute("tabindex", "-1");
    art.setAttribute("aria-label", "Fehler bei der Antwort");
    label.className    = "bubble__label";
    label.textContent  = "Fehler";
    inhalt.className   = "bubble__text";
    inhalt.textContent = fehlerText;
    btn.type           = "button";
    btn.className      = "btn btn--sekundaer";
    btn.style.marginTop = "var(--space-sm)";
    btn.textContent    = "Erneut versuchen";

    btn.addEventListener("click", function () {
      art.remove();
      frageAbschicken(frageText, false); // keine neue Frage-Bubble
    });

    art.appendChild(label);
    art.appendChild(inhalt);
    art.appendChild(btn);
    return art;
  }

  // --- Frage senden (Kernfunktion) ---
  // mitFrageBubble=true: normaler Ablauf; false: Wiederholung nach Fehler
  async function frageAbschicken(frageText, mitFrageBubble) {
    frageText = frageText.trim();
    if (!frageText) return;

    if (mitFrageBubble) {
      frageFeld.value = "";
      wachseTextarea();
      erstelleFrageBubble(frageText);
    }

    sendenKnopf.disabled = true;
    frageFeld.disabled   = true;

    const lade = erstelleLadePlatzhalter();

    const form = new FormData();
    form.append("frage", frageText);

    let res, body;
    try {
      res  = await fetch("/query", { method: "POST", body: form });
      body = await res.json();
    } catch (_) {
      lade.remove();
      const fehlerBubble = erstelleFehlerBubble("Netzwerkfehler. Bitte Verbindung prüfen.", frageText);
      verlauf.appendChild(fehlerBubble);
      setzeFehler("Fehler: Netzwerkfehler. Bitte Verbindung prüfen.");
      fehlerBubble.querySelector("button").focus();
      sendenKnopf.disabled = false;
      frageFeld.disabled   = false;
      return;
    }

    lade.remove();

    if (!res.ok) {
      const text         = body.fehler || "Anfrage fehlgeschlagen.";
      const fehlerBubble = erstelleFehlerBubble(text, frageText);
      verlauf.appendChild(fehlerBubble);
      setzeFehler("Fehler: " + text);
      fehlerBubble.querySelector("button").focus();
    } else {
      const antwortBubble = erstelleAntwortBubble(body.antwort);
      verlauf.appendChild(antwortBubble);
      antwortBubble.focus();
    }

    sendenKnopf.disabled = false;
    frageFeld.disabled   = false;
  }

  // --- Formular abschicken ---
  frageForm.addEventListener("submit", function (e) {
    e.preventDefault();
    frageAbschicken(frageFeld.value, true);
  });

  // Enter sendet; Shift+Enter erzeugt Zeilenumbruch
  frageFeld.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      frageAbschicken(frageFeld.value, true);
    }
  });

  // --- Dialog: PDF wechseln ---
  aendernKnopf.addEventListener("click", function () {
    wechselDatei.value = "";
    verbergeDialogFehler();
    dialog.showModal(); // setzt Fokus automatisch und sperrt ihn
  });

  dialogAbbrechen.addEventListener("click", function () {
    dialog.close();
  });

  // Fokus bei Schließen zurück auf den Auslöser
  dialog.addEventListener("close", function () {
    aendernKnopf.focus();
  });

  dialogLaden.addEventListener("click", async function () {
    const datei = wechselDatei.files[0];
    if (!datei) {
      zeigeDialogFehler("Bitte eine PDF auswählen.");
      return;
    }
    verbergeDialogFehler();
    dialogLaden.disabled    = true;
    dialogLaden.textContent = "Wird hochgeladen …";

    const { ok, body } = await hochladen(datei);

    dialogLaden.disabled    = false;
    dialogLaden.textContent = "Laden";

    if (!ok) {
      zeigeDialogFehler(body.fehler || "Upload fehlgeschlagen.");
      return;
    }

    dialog.close();
    leereVerlauf();
    zeigePdfAnsicht(body.dateiname);
    setzeStatus("Dokument gewechselt: " + body.dateiname + " geladen.");
    leerZustand.focus();
  });

})();
