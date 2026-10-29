const books = [
["Gênesis",50,"genesis","genesis"],["Êxodo",40,"exodo","exodus"],["Levítico",27,"levitico","leviticus"],["Números",36,"numeros","numbers"],["Deuteronômio",34,"deuteronomio","deuteronomy"],["Josué",24,"josue","joshua"],["Juízes",21,"juizes","judges"],["Rute",4,"rute","ruth"],["1 Samuel",31,"1-samuel","1-samuel"],["2 Samuel",24,"2-samuel","2-samuel"],["1 Reis",22,"1-reis","1-kings"],["2 Reis",25,"2-reis","2-kings"],["1 Crônicas",29,"1-cronicas","1-chronicles"],["2 Crônicas",36,"2-cronicas","2-chronicles"],["Esdras",10,"esdras","ezra"],["Neemias",13,"neemias","nehemiah"],["Ester",10,"ester","esther"],["Jó",42,"jo","job"],["Salmos",150,"salmos","psalms"],["Provérbios",31,"proverbios","proverbs"],["Eclesiastes",12,"eclesiastes","ecclesiastes"],["Cânticos",8,"canticos","song-of-solomon"],["Isaías",66,"isaias","isaiah"],["Jeremias",52,"jeremias","jeremiah"],["Lamentações",5,"lamentacoes","lamentations"],["Ezequiel",48,"ezequiel","ezekiel"],["Daniel",12,"daniel","daniel"],["Oséias",14,"oseias","hosea"],["Joel",3,"joel","joel"],["Amós",9,"amos","amos"],["Obadias",1,"obadias","obadiah"],["Jonas",4,"jonas","jonah"],["Miquéias",7,"miqueias","micah"],["Naum",3,"naum","nahum"],["Habacuque",3,"habacuque","habakkuk"],["Sofonias",3,"sofonias","zephaniah"],["Ageu",2,"ageu","haggai"],["Zacarias",14,"zacarias","zechariah"],["Malaquias",4,"malaquias","malachi"],["Mateus",28,"mateus","matthew"],["Marcos",16,"marcos","mark"],["Lucas",24,"lucas","luke"],["João",21,"joao","john"],["Atos",28,"atos","acts"],["Romanos",16,"romanos","romans"],["1 Coríntios",16,"1-corintios","1-corinthians"],["2 Coríntios",13,"2-corintios","2-corinthians"],["Gálatas",6,"galatas","galatians"],["Efésios",6,"efesios","ephesians"],["Filipenses",4,"filipenses","philippians"],["Colossenses",4,"colossenses","colossians"],["1 Tessalonicenses",5,"1-tessalonicenses","1-thessalonians"],["2 Tessalonicenses",3,"2-tessalonicenses","2-thessalonians"],["1 Timóteo",6,"1-timoteo","1-timothy"],["2 Timóteo",4,"2-timoteo","2-timothy"],["Tito",3,"tito","titus"],["Filemom",1,"filemom","philemon"],["Hebreus",13,"hebreus","hebrews"],["Tiago",5,"tiago","james"],["1 Pedro",5,"1-pedro","1-peter"],["2 Pedro",3,"2-pedro","2-peter"],["1 João",5,"1-joao","1-john"],["2 João",1,"2-joao","2-john"],["3 João",1,"3-joao","3-john"],["Judas",1,"judas","jude"],["Apocalipse",22,"apocalipse","revelation"]
];
const $ = (id) => document.getElementById(id);
const bookSelect = $("bookSelect"), chapterSelect = $("chapterSelect"), content = $("chapterContent"), status = $("readerStatus");
let fontSize = Number(localStorage.getItem("bibleFontSize")) || 18;
function fillChapters() {
  const book = books[Number(bookSelect.value)];
  chapterSelect.innerHTML = "";
  for (let i=1;i<=book[1];i++) { const o=document.createElement("option"); o.value=String(i); o.textContent="Capítulo "+i; chapterSelect.append(o); }
}
books.forEach((book,i)=>{const o=document.createElement("option");o.value=String(i);o.textContent=book[0];bookSelect.append(o)});
bookSelect.value="0"; fillChapters();
bookSelect.addEventListener("change",fillChapters);
async function loadChapter() {
  const book=books[Number(bookSelect.value)], chapter=Number(chapterSelect.value);
  const versionSelect=$("versionSelect");
  const version=versionSelect ? versionSelect.value : "BPM";
  status.textContent="Carregando "+book[0]+" "+chapter+"…";
  content.innerHTML='<div class="reader-empty"><span>◌</span><h3>Carregando leitura</h3><p>Estamos buscando o capítulo da versão selecionada.</p></div>';
  try {
    let verses=[], credit="";
    if(version==="BPM") {
      try {
        const res=await fetch("biblia/pt/"+book[3]+"/"+chapter+".json");
        if(!res.ok) throw new Error("Arquivo local indisponível");
        const data=await res.json();
        if(!Array.isArray(data.verses)||!data.verses.length) throw new Error("Arquivo local vazio");
        verses=data.verses.map(v=>({v:Number(v.v),t:String(v.t||"")}));
        credit="Bíblia Portuguesa Mundial (BPM) — domínio público; tradução em revisão. Fonte: eBible.org.";
      } catch {
        const cacheKey="bibleChapter:BPM:"+book[3]+":"+chapter;
        let payload=null;
        try { const cached=localStorage.getItem(cacheKey); if(cached) payload=JSON.parse(cached); } catch {}
        if(!payload) {
          const res=await fetch("https://api.midvash.com/v1/bpm/"+encodeURIComponent(book[3])+"/"+chapter);
          if(!res.ok) throw new Error("Biblioteca local ausente e fonte BPM indisponível (HTTP "+res.status+").");
          payload=await res.json();
          if(!payload.data||!Array.isArray(payload.data.verses)) throw new Error("A fonte BPM devolveu um formato inesperado.");
          try { localStorage.setItem(cacheKey,JSON.stringify(payload)); } catch {}
        }
        verses=payload.data.verses.map((v,i)=>({v:i+1,t:typeof v==="string"?v:String(v.text||v.t||"")}));
        credit=(payload.meta&&payload.meta.copyright)||"Bíblia Portuguesa Mundial (BPM) — domínio público; tradução em revisão. Fonte: eBible.org.";
      }
    } else {
      const slug=version==="ALM1911"?"alm1911":"almeida-livre";
      const url="https://api.midvash.com/v1/"+slug+"/"+encodeURIComponent(book[3])+"/"+chapter;
      const cacheKey="bibleChapter:"+version+":"+book[3]+":"+chapter;
      let payload=null;
      try { const cached=localStorage.getItem(cacheKey); if(cached) payload=JSON.parse(cached); } catch {}
      if(!payload) {
        const res=await fetch(url);
        if(!res.ok) throw new Error("A versão selecionada não conseguiu carregar este capítulo (HTTP "+res.status+").");
        payload=await res.json();
        if(!payload.data || !Array.isArray(payload.data.verses)) throw new Error("A fonte devolveu um formato inesperado.");
        try { localStorage.setItem(cacheKey,JSON.stringify(payload)); } catch {}
      }
      verses=payload.data.verses.map((v,i)=>({v:i+1,t:typeof v==="string"?v:String(v.text||v.t||"")}));
      credit=(payload.meta && payload.meta.copyright) || (version==="ALM1911"?"Almeida 1911 — domínio público.":"Bíblia Livre (Almeida 1819) — consulte os termos da licença.");
    }
    if(!verses.length) throw new Error("Não há versículos disponíveis neste capítulo.");
    loadedVerses=verses;
    localStorage.setItem("bibleLastBook",bookSelect.value);
    localStorage.setItem("bibleLastChapter",String(chapter));
    localStorage.setItem("bibleLastVersion",version);
    status.textContent=book[0]+" "+chapter+" · "+verses.length+" versículos · "+(version==="BPM"?"Bíblia Portuguesa Mundial (BPM)":version==="ALM1911"?"Almeida 1911":"Bíblia Livre (Almeida 1819)");
    content.innerHTML="";
    verses.forEach(v=>{
      const p=document.createElement("p"), n=document.createElement("sup");
      n.className="verse-num";n.textContent=v.v;n.setAttribute("aria-label","Versículo "+v.v);
      p.append(n,document.createTextNode(String(v.t||"").trim()));content.append(p);
    });
    content.style.fontSize=fontSize+"px";
    let creditLine=$("bibleVersionCredit");
    if(!creditLine){creditLine=document.createElement("p");creditLine.id="bibleVersionCredit";creditLine.className="source-note";content.after(creditLine);}
    creditLine.textContent=credit;
  } catch(e) {
    status.textContent="Não foi possível carregar a versão selecionada.";
    content.innerHTML='<div class="reader-empty"><span>!</span><h3>Capítulo indisponível</h3><p></p><button class="btn btn-primary" id="retryChapter" type="button">Tentar novamente</button></div>';
    content.querySelector("p").textContent=e.message+" Verifique a conexão e tente novamente.";
    $("retryChapter").addEventListener("click",loadChapter);
    loadedVerses=[];
  }
}
$("readButton").addEventListener("click",loadChapter);
$("fontUp").addEventListener("click",()=>{fontSize=Math.min(30,fontSize+2);content.style.fontSize=fontSize+"px";localStorage.setItem("bibleFontSize",fontSize)});
$("fontDown").addEventListener("click",()=>{fontSize=Math.max(14,fontSize-2);content.style.fontSize=fontSize+"px";localStorage.setItem("bibleFontSize",fontSize)});
$("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("bibleTheme",document.body.classList.contains("dark")?"dark":"light")});
if(localStorage.getItem("bibleTheme")==="dark")document.body.classList.add("dark");
$("menuToggle").addEventListener("click",()=>{const open=$("mainNav").classList.toggle("open");$("menuToggle").setAttribute("aria-expanded",String(open))});
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>{$("mainNav").classList.remove("open");$("menuToggle").setAttribute("aria-expanded","false")}));
$("copyVerse").addEventListener("click",async()=>{const text="O Senhor é o meu pastor; nada me faltará. — Salmos 23:1";try{await navigator.clipboard.writeText(text);$("copyVerse").textContent="Versículo copiado ✓"}catch{$("copyVerse").textContent=text}});
$("year").textContent=new Date().getFullYear();


/* Navegação rápida pelos 66 livros e atalhos do cabeçalho */
function renderBookChips(targetId, start, end) {
  const target = $(targetId);
  if (!target) return;
  books.slice(start, end).forEach((book, offset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = book[0];
    button.addEventListener("click", () => {
      bookSelect.value = String(start + offset);
      fillChapters();
      $("ler").scrollIntoView({ behavior: "smooth", block: "start" });
      loadChapter();
    });
    target.append(button);
  });
}
renderBookChips("oldTestamentBooks", 0, 39);
renderBookChips("newTestamentBooks", 39, 66);
const searchToggle = $("searchToggle");
if (searchToggle) searchToggle.addEventListener("click", () => {
  $("ler").scrollIntoView({ behavior: "smooth", block: "start" });
  bookSelect.focus({ preventScroll: true });
});
const advancedSearchTab = $("advancedSearchTab");
if (advancedSearchTab) advancedSearchTab.addEventListener("click", (event) => {
  event.preventDefault();
  status.textContent = "Busca por livro e capítulo: selecione o livro e o capítulo abaixo para abrir a leitura.";
  bookSelect.focus({ preventScroll: true });
});

/* Funcionalidades interativas das abas do leitor */
const featurePanel = $("readerFeaturePanel");
const readerTabButtons = [...document.querySelectorAll("[data-reader-tab]")];
let loadedVerses = [];
let currentSpeech = null;
function setReaderTab(name) {
  readerTabButtons.forEach(button => {
    const active = button.dataset.readerTab === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  featurePanel.hidden = name === "read";
  if (name === "read") { featurePanel.innerHTML = ""; return; }
  if (name === "search") {
    featurePanel.innerHTML = '<h3>Busca avançada na leitura</h3><p>Pesquise uma palavra ou expressão no capítulo aberto. Para pesquisar, carregue primeiro o capítulo desejado.</p><form id="chapterSearchForm" class="reader-feature-form"><label>Palavra ou expressão<input id="chapterSearchTerm" type="search" placeholder="Ex.: esperança, oração, amor" required></label><button class="btn btn-primary" type="submit">Pesquisar no capítulo</button></form><div id="chapterSearchResults" aria-live="polite"></div>';
    $("chapterSearchForm").addEventListener("submit", event => {
      event.preventDefault();
      const term = $("chapterSearchTerm").value.trim().toLocaleLowerCase("pt-BR");
      const results = loadedVerses.filter(v => String(v.t).toLocaleLowerCase("pt-BR").includes(term));
      const target = $("chapterSearchResults");
      if (!loadedVerses.length) { target.textContent = "Carregue um capítulo antes de pesquisar."; return; }
      if (!results.length) { target.textContent = "Nenhuma ocorrência encontrada neste capítulo."; return; }
      target.innerHTML = "";
      const heading = document.createElement("p"); heading.textContent = results.length + " versículo(s) encontrado(s):"; target.append(heading);
      results.forEach(v => { const p=document.createElement("p"); p.textContent=v.v+". "+v.t; target.append(p); });
    });
  } else if (name === "plans") {
    const plan = [
      ["Dia 1","Salmos",23],["Dia 2","Provérbios",3],["Dia 3","Mateus",5],
      ["Dia 4","Lucas",15],["Dia 5","João",15],["Dia 6","Romanos",8],["Dia 7","Filipenses",4]
    ];
    featurePanel.innerHTML = '<h3>Plano de leitura de 7 dias</h3><p>Uma semana de leituras para reflexão. Marque os dias concluídos; seu progresso fica salvo neste dispositivo.</p><div class="reading-plan-list" id="readingPlanList"></div>';
    const list=$("readingPlanList");
    plan.forEach(([day,bookName,chapter],i)=>{
      const idx=books.findIndex(b=>b[0]===bookName);
      const label=document.createElement("label");label.className="reading-plan-day";
      const check=document.createElement("input");check.type="checkbox";check.checked=localStorage.getItem("biblePlanDay"+i)==="done";
      check.addEventListener("change",()=>localStorage.setItem("biblePlanDay"+i,check.checked?"done":"todo"));
      const link=document.createElement("button");link.type="button";link.textContent=day+" · "+bookName+" "+chapter+" — Abrir leitura";
      link.addEventListener("click",()=>{bookSelect.value=String(idx);fillChapters();chapterSelect.value=String(chapter);setReaderTab("read");loadChapter();$("ler").scrollIntoView({behavior:"smooth",block:"start"});});
      label.append(check,link);list.append(label);
    });
  } else if (name === "daily") {
    featurePanel.innerHTML = '<h3>Versículo do dia</h3><p id="dailyVerseText">Carregando o texto bíblico local…</p><button class="btn btn-primary" id="openDailyVerse" type="button">Abrir capítulo</button>';
    const dailyBooks=[18,19,42,42,42,42,50];
    const dayIndex=Math.floor(Date.now()/86400000)%dailyBooks.length;
    const bookIdx=dailyBooks[dayIndex], chapter=bookIdx===18?23:bookIdx===19?3:bookIdx===42?15:4;
    const slug=books[bookIdx][3];
    fetch("biblia/pt/"+slug+"/"+chapter+".json").then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
      const verses=data.verses||[];const v=verses[(new Date().getDate()-1)%Math.max(verses.length,1)];
      $("dailyVerseText").textContent=v? v.t+" — "+books[bookIdx][0]+" "+chapter+":"+v.v:"O capítulo está disponível, mas não foi possível selecionar um versículo.";
      $("openDailyVerse").addEventListener("click",()=>{bookSelect.value=String(bookIdx);fillChapters();chapterSelect.value=String(chapter);setReaderTab("read");loadChapter();});
    }).catch(()=>{$("dailyVerseText").textContent="O versículo do dia aparecerá assim que a biblioteca bíblica local estiver importada."; $("openDailyVerse").disabled=true;});
  } else if (name === "compare") {
    featurePanel.innerHTML = '<h3>Comparar traduções</h3><p>Agora há três versões disponíveis no leitor: Bíblia Portuguesa Mundial (BPM), Almeida 1911 (domínio público) e Bíblia Livre — Almeida 1819 (uso livre). Selecione uma versão no painel e carregue o capítulo para ler. A comparação lado a lado ficará para a próxima etapa.</p><a href="https://ebible.org/porbrbsl/copyright.htm" target="_blank" rel="noopener noreferrer">Consultar fonte e licença da BPM ↗</a>';
  }
}
readerTabButtons.forEach(button=>button.addEventListener("click",()=>setReaderTab(button.dataset.readerTab)));
const audioReadButton=$("audioRead");
let speechQueue=[];
let speechBusy=false;
function stopBibleAudio(){
  if("speechSynthesis" in window) window.speechSynthesis.cancel();
  speechQueue=[];speechBusy=false;
  if(audioReadButton) audioReadButton.textContent="▶ Ouvir capítulo";
}
function speakNextChunk(){
  if(!speechQueue.length){speechBusy=false;if(audioReadButton)audioReadButton.textContent="▶ Ouvir capítulo";return;}
  const chunk=speechQueue.shift();
  const utterance=new SpeechSynthesisUtterance(chunk);
  utterance.lang="pt-BR";utterance.rate=0.88;utterance.pitch=1;
  const voices=window.speechSynthesis.getVoices();
  const voice=voices.find(v=>/^pt-BR$/i.test(v.lang))||voices.find(v=>/^pt/i.test(v.lang));
  if(voice) utterance.voice=voice;
  utterance.onend=()=>{if(speechBusy)speakNextChunk();};
  utterance.onerror=()=>{speechBusy=false;if(audioReadButton)audioReadButton.textContent="▶ Ouvir capítulo";status.textContent="O navegador interrompeu a leitura em voz alta. Tente novamente.";};
  window.speechSynthesis.speak(utterance);
}
async function playBibleAudio(){
  if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){status.textContent="Este navegador não oferece leitura em voz alta. Tente Chrome ou Edge atualizado.";return;}
  if(window.speechSynthesis.speaking||speechBusy){stopBibleAudio();return;}
  if(!loadedVerses.length){await loadChapter();if(!loadedVerses.length){status.textContent="O áudio depende de o capítulo ter sido carregado com sucesso.";return;}}
  const chunks=[];let current="";
  loadedVerses.forEach(v=>{
    const sentence="Versículo "+v.v+". "+v.t+". ";
    if((current+sentence).length>900&&current){chunks.push(current);current="";}
    current+=sentence;
  });
  if(current)chunks.push(current);
  if(!chunks.length){status.textContent="Não há texto disponível para ouvir.";return;}
  speechQueue=chunks;speechBusy=true;audioReadButton.textContent="■ Parar áudio";
  window.speechSynthesis.cancel();
  // Deixa o cancelamento terminar antes de enfileirar a primeira fala.
  setTimeout(()=>{if(speechBusy)speakNextChunk();},120);
}
if(audioReadButton) audioReadButton.addEventListener("click",playBibleAudio);
const audioShortcut=$("audioBibleShortcut");
if(audioShortcut) audioShortcut.addEventListener("click",async()=>{
  setReaderTab("read");
  $("ler").scrollIntoView({behavior:"smooth",block:"start"});
  if(!loadedVerses.length) await loadChapter();
  if(loadedVerses.length) playBibleAudio();
});
const lastBook=localStorage.getItem("bibleLastBook"),lastChapter=localStorage.getItem("bibleLastChapter"),lastVersion=localStorage.getItem("bibleLastVersion");
if(lastVersion && $("versionSelect")) $("versionSelect").value=lastVersion;
if(lastBook!==null && books[Number(lastBook)]) {bookSelect.value=lastBook;fillChapters();if(lastChapter)chapterSelect.value=lastChapter;}
if($("versionSelect")) $("versionSelect").addEventListener("change",()=>{if(loadedVerses.length)loadChapter();});
