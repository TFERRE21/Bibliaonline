(() => {
  const button = document.getElementById("audioRead");
  const status = document.getElementById("readerStatus");
  const content = document.getElementById("chapterContent");
  if (!button || !content) return;

  let playing = false;
  let run = 0;
  let verses = [];
  let index = 0;

  function stop(message = "Áudio pausado.") {
    run++;
    playing = false;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    content.querySelectorAll(".bible-verse.is-speaking").forEach(el => el.classList.remove("is-speaking"));
    button.textContent = "▶ Ouvir capítulo";
    if (status) status.textContent = message;
  }

  function speakNext(token) {
    if (!playing || token !== run) return;
    if (index >= verses.length) {
      stop("Leitura em áudio concluída.");
      return;
    }
    const item = verses[index++];
    const text = item.text;
    if (!text.trim()) return speakNext(token);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => /^pt[-_]BR$/i.test(v.lang)) || voices.find(v => /^pt[-_]/i.test(v.lang));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => {
      if (token !== run) return;
      if (status) status.textContent = "Lendo versículo " + item.number + "…";
      const el = document.getElementById("verse-" + item.number);
      content.querySelectorAll(".bible-verse.is-speaking").forEach(n => n.classList.remove("is-speaking"));
      if (el) {
        el.classList.add("is-speaking");
        el.scrollIntoView({behavior:"smooth", block:"nearest"});
      }
    };
    utterance.onend = () => { if (token === run && playing) speakNext(token); };
    utterance.onerror = event => {
      if (token !== run) return;
      stop("Falha na voz do navegador (" + (event.error || "erro desconhecido") + "). Verifique a saída de som e as vozes instaladas.");
    };
    window.speechSynthesis.speak(utterance);
  }

  button.addEventListener("click", (event) => {
    event.stopImmediatePropagation();
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      if (status) status.textContent = "Este navegador não oferece leitura em voz alta. Use o Chrome ou Edge atualizado.";
      return;
    }
    if (playing || window.speechSynthesis.speaking) {
      stop();
      return;
    }
    verses = [...content.querySelectorAll(".bible-verse")].map(el => ({
      number: el.querySelector(".verse-num")?.textContent?.trim() || "",
      text: "Versículo " + (el.querySelector(".verse-num")?.textContent?.trim() || "") + ". " + (el.querySelector(".verse-text")?.textContent?.trim() || "")
    })).filter(v => v.number && v.text.trim().length > 15);
    if (!verses.length) {
      if (status) status.textContent = "Primeiro selecione livro e capítulo e clique em “Ler Capítulo”. Depois tente o áudio novamente.";
      return;
    }
    run++;
    playing = true;
    index = 0;
    button.textContent = "■ Parar áudio";
    if (status) status.textContent = "Iniciando leitura em voz alta…";
    window.speechSynthesis.cancel();
    speakNext(run);
  });

  // A versão independente mantém o botão operacional mesmo se o script principal falhar.
})();