(() => {
  "use strict";
  const init = () => {
    const button = document.getElementById("audioRead");
    const status = document.getElementById("readerStatus");
    const content = document.getElementById("chapterContent");
    const speedSelect = document.getElementById("audioSpeed");
    if (!button || !content || button.dataset.audioFallbackReady === "1") return;
    button.dataset.audioFallbackReady = "1";

    let playing = false;
    let runId = 0;
    let verses = [];
    let index = 0;
    let observer = null;
    let singleVerseMode = false;

    const setStatus = (message) => { if (status) status.textContent = message; };
    const setButton = (label) => { button.textContent = label; };

    function stop(message = "Áudio pausado.") {
      runId++;
      playing = false;
      if (observer) { observer.disconnect(); observer = null; }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      content.querySelectorAll(".bible-verse.is-speaking").forEach(el => el.classList.remove("is-speaking"));
      setButton("▶ Ouvir capítulo");
      setStatus(message);
    }

    function collectVerses() {
      return [...content.querySelectorAll(".bible-verse")].map(el => {
        const number = el.querySelector(".verse-num")?.textContent?.trim() || "";
        const verseText = el.querySelector(".verse-text")?.textContent?.trim() || "";
        return { number, text: verseText ? "Versículo " + number + ". " + verseText : "" };
      }).filter(v => v.number && v.text.length > 15);
    }

    function speakNext(token) {
      if (!playing || token !== runId) return;
      if (index >= verses.length) { stop(singleVerseMode ? "Versículo concluído." : "Leitura em áudio concluída."); return; }
      const item = verses[index++];
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = "pt-BR";
      utterance.rate = Number(speedSelect?.value || 0.9);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => /^pt[-_]BR$/i.test(v.lang)) || voices.find(v => /^pt[-_]/i.test(v.lang));
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        if (token !== runId) return;
        setStatus("Lendo versículo " + item.number + "…");
        content.querySelectorAll(".bible-verse.is-speaking").forEach(el => el.classList.remove("is-speaking"));
        const el = document.getElementById("verse-" + item.number);
        if (el) { el.classList.add("is-speaking"); el.scrollIntoView({behavior:"smooth", block:"nearest"}); }
      };
      utterance.onend = () => { if (token === runId && playing) speakNext(token); };
      utterance.onerror = (event) => {
        if (token !== runId) return;
        stop("O navegador não conseguiu iniciar a voz (" + (event.error || "erro") + "). Confira o volume e tente novamente.");
      };
      window.speechSynthesis.speak(utterance);
    }

    function startWhenReady(token, attempts = 0) {
      if (!playing || token !== runId) return;
      verses = collectVerses();
      if (verses.length) {
        index = 0;
        setButton("■ Parar áudio");
        setStatus("Iniciando leitura em voz alta…");
        window.speechSynthesis.cancel();
        speakNext(token);
        return;
      }
      if (attempts === 0) {
        setStatus("Aguardando o capítulo carregar para iniciar o áudio…");
        const readButton = document.getElementById("readButton");
        if (readButton) readButton.click();
        observer = new MutationObserver(() => {
          verses = collectVerses();
          if (verses.length) {
            observer.disconnect(); observer = null;
            startWhenReady(token, 1);
          }
        });
        observer.observe(content, {childList:true, subtree:true, characterData:true});
      } else {
        stop("Não encontrei os versículos. Selecione livro e capítulo e clique em “Ler Capítulo”.");
      }
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        setStatus("A leitura em voz alta não está disponível neste navegador. Atualize o Chrome ou Edge.");
        return;
      }
      if (playing || window.speechSynthesis.speaking) { stop(); return; }
      runId++;
      singleVerseMode = false;
      playing = true;
      setButton("■ Parar áudio");
      setStatus("Preparando áudio…");
      startWhenReady(runId);
    }, true);


    // Clicar no texto de um versículo lê somente aquele versículo.
    content.addEventListener("click", (event) => {
      if (event.target.closest(".verse-actions, .verse-action")) return;
      const verseEl = event.target.closest(".bible-verse");
      if (!verseEl) return;
      if (!( "speechSynthesis" in window) || !( "SpeechSynthesisUtterance" in window)) {
        setStatus("A leitura em voz alta não está disponível neste navegador.");
        return;
      }
      const number = verseEl.querySelector(".verse-num")?.textContent?.trim();
      const text = verseEl.querySelector(".verse-text")?.textContent?.trim();
      if (!number || !text) return;
      event.preventDefault();
      runId++;
      const token = runId;
      playing = true;
      singleVerseMode = true;
      index = 0;
      verses = [{number, text: "Versículo " + number + ". " + text}];
      window.speechSynthesis.cancel();
      setButton("■ Parar áudio");
      setStatus("Lendo somente o versículo " + number + "…");
      speakNext(token);
    });

    setStatus(status?.textContent || "Selecione um capítulo para ouvir.");
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();