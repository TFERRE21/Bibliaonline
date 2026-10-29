const books = [
["Gênesis",50,"genesis","genesis"],["Êxodo",40,"exodo","exodus"],["Levítico",27,"levitico","leviticus"],["Números",36,"numeros","numbers"],["Deuteronômio",34,"deuteronomio","deuteronomy"],["Josué",24,"josue","joshua"],["Juízes",21,"juizes","judges"],["Rute",4,"rute","ruth"],["1 Samuel",31,"1-samuel","1-samuel"],["2 Samuel",24,"2-samuel","2-samuel"],["1 Reis",22,"1-reis","1-kings"],["2 Reis",25,"2-reis","2-kings"],["1 Crônicas",29,"1-cronicas","1-chronicles"],["2 Crônicas",36,"2-cronicas","2-chronicles"],["Esdras",10,"esdras","ezra"],["Neemias",13,"neemias","nehemiah"],["Ester",10,"ester","esther"],["Jó",42,"jo","job"],["Salmos",150,"salmos","psalms"],["Provérbios",31,"proverbios","proverbs"],["Eclesiastes",12,"eclesiastes","ecclesiastes"],["Cânticos",8,"canticos","song-of-solomon"],["Isaías",66,"isaias","isaiah"],["Jeremias",52,"jeremias","jeremiah"],["Lamentações",5,"lamentacoes","lamentations"],["Ezequiel",48,"ezequiel","ezekiel"],["Daniel",12,"daniel","daniel"],["Oséias",14,"oseias","hosea"],["Joel",3,"joel","joel"],["Amós",9,"amos","amos"],["Obadias",1,"obadias","obadiah"],["Jonas",4,"jonas","jonah"],["Miquéias",7,"miqueias","micah"],["Naum",3,"naum","nahum"],["Habacuque",3,"habacuque","habakkuk"],["Sofonias",3,"sofonias","zephaniah"],["Ageu",2,"ageu","haggai"],["Zacarias",14,"zacarias","zechariah"],["Malaquias",4,"malaquias","malachi"],["Mateus",28,"mateus","matthew"],["Marcos",16,"marcos","mark"],["Lucas",24,"lucas","luke"],["João",21,"joao","john"],["Atos",28,"atos","acts"],["Romanos",16,"romanos","romans"],["1 Coríntios",16,"1-corintios","1-corinthians"],["2 Coríntios",13,"2-corintios","2-corinthians"],["Gálatas",6,"galatas","galatians"],["Efésios",6,"efesios","ephesians"],["Filipenses",4,"filipenses","philippians"],["Colossenses",4,"colossenses","colossians"],["1 Tessalonicenses",5,"1-tessalonicenses","1-thessalonians"],["2 Tessalonicenses",3,"2-tessalonicenses","2-thessalonians"],["1 Timóteo",6,"1-timoteo","1-timothy"],["2 Timóteo",4,"2-timoteo","2-timothy"],["Tito",3,"tito","titus"],["Filemom",1,"filemom","philemon"],["Hebreus",13,"hebreus","hebrews"],["Tiago",5,"tiago","james"],["1 Pedro",5,"1-pedro","1-peter"],["2 Pedro",3,"2-pedro","2-peter"],["1 João",5,"1-joao","1-john"],["2 João",1,"2-joao","2-john"],["3 João",1,"3-joao","3-john"],["Judas",1,"judas","jude"],["Apocalipse",22,"apocalipse","revelation"]
];
const $ = (id) => document.getElementById(id);
const bookSelect = $("bookSelect"), chapterSelect = $("chapterSelect"), content = $("chapterContent"), status = $("readerStatus");
// Deve ser inicializado antes de qualquer função de leitura poder ser chamada.
let loadedVerses = [];
let loadedChapterKey = "";
let fontSize = Number(localStorage.getItem("bibleFontSize")) || 18;
function fillChapters() {
  const book = books[Number(bookSelect.value)];
  chapterSelect.innerHTML = "";
  for (let i=1;i<=book[1];i++) { const o=document.createElement("option"); o.value=String(i); o.textContent="Capítulo "+i; chapterSelect.append(o); }
}
books.forEach((book,i)=>{const o=document.createElement("option");o.value=String(i);o.textContent=book[0];bookSelect.append(o)});
bookSelect.value="0"; fillChapters();
bookSelect.addEventListener("change",()=>{fillChapters();loadChapter();});
chapterSelect.addEventListener("change",loadChapter);
async function loadChapter() {
  const book=books[Number(bookSelect.value)], chapter=Number(chapterSelect.value);
  const versionSelect=$("versionSelect");
  const version=versionSelect ? versionSelect.value : "BPM";
  if((version==="BLPT"||version==="TFT") && Number(bookSelect.value)<39) {
    status.textContent="Esta tradução está disponível apenas no Novo Testamento.";
    content.innerHTML='<div class="reader-empty"><span>!</span><h3>Tradução disponível no Novo Testamento</h3><p>Selecione Mateus, Marcos, Lucas, João ou outro livro do Novo Testamento e tente novamente.</p></div>';
    loadedVerses=[];
    return;
  }
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
      const versionSlugs={ALM1911:"alm1911",ALMEIDA_LIVRE:"almeida-livre",NVA:"nva",ONBV:"onbv",BLPT:"blpt",TFT:"tft"};
      const slug=versionSlugs[version];
      if(!slug) throw new Error("Esta tradução ainda não está disponível para leitura neste site.");
      const url="https://api.midvash.com/v1/"+slug+"/"+encodeURIComponent(book[3])+"/"+chapter;
      const cacheKey="bibleChapter:"+version+":"+book[3]+":"+chapter;
      let payload=null;
      try { const cached=localStorage.getItem(cacheKey); if(cached) payload=JSON.parse(cached); } catch {}
      if(!payload) {
        const res=await fetch(url);
        if(!res.ok) throw new Error("A versão selecionada não conseguiu carregar este capítulo (HTTP "+res.status+").");
        payload=await res.json();
        if(!payload.data || !Array.isArray(payload.data.verses)) throw new Error("A fonte devolveu um formato inesperado.");
        if(payload.data.version && payload.data.version !== slug) throw new Error("A fonte devolveu outra tradução ("+payload.data.version+"). A leitura foi interrompida para não misturar versões.");
        try { localStorage.setItem(cacheKey,JSON.stringify(payload)); } catch {}
      }
      verses=payload.data.verses.map((v,i)=>({v:i+1,t:typeof v==="string"?v:String(v.text||v.t||"")}));
      credit=(payload.meta && (payload.meta.copyright || payload.meta.attribution)) || ({ALM1911:"Almeida 1911 — domínio público.",ALMEIDA_LIVRE:"Bíblia Livre (Almeida 1819) — consulte os termos da licença.",NVA:"Bíblia Nova Versão de Acesso Livre — licença CC BY-SA 4.0.",ONBV:"Open Nova Bíblia Viva — licença CC BY-SA 4.0.",BLPT:"Bíblia Livre Para Todos — Novo Testamento; licença CC BY-SA 4.0.",TFT:"Tradução para Tradutores — Novo Testamento; licença CC BY-SA 4.0."}[version]||"Consulte os créditos e a licença da tradução.");
    }
    if(!verses.length) throw new Error("Não há versículos disponíveis neste capítulo.");
    loadedVerses=verses;
    loadedChapterKey=bookSelect.value+":"+chapterSelect.value+":"+version;
    localStorage.setItem("bibleLastBook",bookSelect.value);
    localStorage.setItem("bibleLastChapter",String(chapter));
    localStorage.setItem("bibleLastVersion",version);
    status.textContent=book[0]+" "+chapter+" · "+verses.length+" versículos · "+({BPM:"Bíblia Portuguesa Mundial (BPM)",ALM1911:"Almeida 1911",ALMEIDA_LIVRE:"Bíblia Livre — Almeida 1819",NVA:"Bíblia Nova Versão de Acesso Livre",ONBV:"Open Nova Bíblia Viva",BLPT:"Bíblia Livre Para Todos",TFT:"Tradução para Tradutores"}[version]||version);
    content.innerHTML="";
    verses.forEach(v=>{
      const p=document.createElement("p");p.className="bible-verse";p.id="verse-"+v.v;
      const n=document.createElement("sup");n.className="verse-num";n.textContent=v.v;n.setAttribute("aria-label","Versículo "+v.v);
      const text=document.createElement("span");text.className="verse-text";text.textContent=String(v.t||"").trim();
      const actions=document.createElement("span");actions.className="verse-actions";
      const favorite=document.createElement("button");favorite.type="button";favorite.className="verse-action favorite-verse";favorite.setAttribute("aria-label","Salvar versículo "+v.v);
      const favoriteKey="bibleFavorite:"+book[2]+":"+chapter+":"+v.v+":"+version;
      const favorites=JSON.parse(localStorage.getItem("bibleFavorites")||"[]");
      const isFavorite=favorites.some(item=>item.key===favoriteKey);
      favorite.textContent=isFavorite?"♥":"♡";favorite.title=isFavorite?"Remover dos favoritos":"Salvar nos favoritos";
      favorite.addEventListener("click",()=>{
        const list=JSON.parse(localStorage.getItem("bibleFavorites")||"[]");
        const index=list.findIndex(item=>item.key===favoriteKey);
        if(index>=0)list.splice(index,1);
        else list.push({key:favoriteKey,book:book[0],chapter,verse:v.v,version,text:String(v.t||"").trim(),savedAt:new Date().toISOString()});
        localStorage.setItem("bibleFavorites",JSON.stringify(list));
        favorite.textContent=index>=0?"♡":"♥";favorite.title=index>=0?"Salvar nos favoritos":"Remover dos favoritos";
        status.textContent=index>=0?"Versículo removido dos favoritos.":"Versículo salvo nos favoritos deste dispositivo.";
      });
      const share=document.createElement("button");share.type="button";share.className="verse-action";share.textContent="↗";share.title="Compartilhar versículo";
      share.addEventListener("click",async()=>{
        const shareText=String(v.t||"").trim()+" — "+book[0]+" "+chapter+":"+v.v+" ("+version+")";
        try{
          if(navigator.share)await navigator.share({title:"Versículo bíblico",text:shareText});
          else if(navigator.clipboard){await navigator.clipboard.writeText(shareText);status.textContent="Versículo copiado para compartilhar.";}
          else {const area=document.createElement("textarea");area.value=shareText;document.body.append(area);area.select();document.execCommand("copy");area.remove();status.textContent="Versículo copiado para compartilhar.";}
        }catch(error){if(error.name!=="AbortError")status.textContent="Não foi possível compartilhar neste dispositivo.";}
      });
      actions.append(favorite,share);p.append(n,document.createTextNode(" "),text,actions);content.append(p);
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
    loadedChapterKey="";
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

async function fetchChapterVerses(version,book,chapter){
  if((version==="BLPT"||version==="TFT") && books.indexOf(book)<39) throw new Error("Esta tradução está disponível apenas no Novo Testamento.");
  if(version==="BPM"){
    const response=await fetch("biblia/pt/"+book[3]+"/"+chapter+".json");
    if(!response.ok)throw new Error("Capítulo local indisponível.");
    const data=await response.json();
    if(!Array.isArray(data.verses))throw new Error("Formato local inválido.");
    return data.verses.map(v=>({v:Number(v.v),t:String(v.t||"")}));
  }
  const slugs={ALM1911:"alm1911",ALMEIDA_LIVRE:"almeida-livre",NVA:"nva",ONBV:"onbv",BLPT:"blpt",TFT:"tft"};
  const slug=slugs[version];if(!slug)throw new Error("Tradução indisponível.");
  const response=await fetch("https://api.midvash.com/v1/"+slug+"/"+encodeURIComponent(book[3])+"/"+chapter);
  if(!response.ok)throw new Error("Fonte indisponível (HTTP "+response.status+").");
  const payload=await response.json();
  if(!payload.data||!Array.isArray(payload.data.verses))throw new Error("Formato da fonte inválido.");
  if(payload.data.version&&payload.data.version!==slug)throw new Error("A fonte retornou outra tradução; comparação interrompida.");
  return payload.data.verses.map((v,i)=>({v:i+1,t:typeof v==="string"?v:String(v.text||v.t||"")}));
}

/* Funcionalidades interativas das abas do leitor */
const featurePanel = $("readerFeaturePanel");
const readerTabButtons = [...document.querySelectorAll("[data-reader-tab]")];
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
    featurePanel.innerHTML = '<h3>Busca bíblica</h3><p>Pesquise uma referência (ex.: João 3:16) para abrir o capítulo, ou encontre uma palavra no capítulo carregado.</p><form id="chapterSearchForm" class="reader-feature-form"><label>Referência ou palavra<input id="chapterSearchTerm" type="search" placeholder="Ex.: João 3:16 ou esperança" required></label><button class="btn btn-primary" type="submit">Pesquisar</button></form><div id="chapterSearchResults" aria-live="polite"></div>';
    $("chapterSearchForm").addEventListener("submit", async event => {
      event.preventDefault();
      const raw=$("chapterSearchTerm").value.trim();
      const target=$("chapterSearchResults");target.textContent="";
      const reference=raw.match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3}))?$/);
      if(reference){
        const wanted=reference[1].toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\./g,"").trim();
        const idx=books.findIndex(b=>[b[0],b[2]].some(name=>String(name).toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/-/g," ").replace(/\./g,"").trim()===wanted));
        if(idx<0){target.textContent="Não reconheci o nome do livro. Tente o nome completo, como João 3:16.";return;}
        const chap=Number(reference[2]),verse=reference[3]?Number(reference[3]):null;
        if(chap<1||chap>books[idx][1]){target.textContent="Esse capítulo não existe nesse livro.";return;}
        bookSelect.value=String(idx);fillChapters();chapterSelect.value=String(chap);setReaderTab("read");await loadChapter();
        if(verse){const el=$("verse-"+verse);if(el){el.classList.add("is-speaking");el.scrollIntoView({behavior:"smooth",block:"center"});}else status.textContent="Capítulo carregado; esse versículo não foi encontrado na versão atual.";}
        return;
      }
      const term=raw.toLocaleLowerCase("pt-BR");
      if(!loadedVerses.length){target.textContent="Para buscar palavras, carregue primeiro um capítulo. Para abrir uma referência, digite por exemplo João 3:16.";return;}
      const results=loadedVerses.filter(v=>String(v.t).toLocaleLowerCase("pt-BR").includes(term));
      if(!results.length){target.textContent="Nenhuma ocorrência encontrada neste capítulo.";return;}
      const heading=document.createElement("p");heading.textContent=results.length+" versículo(s) encontrado(s) neste capítulo:";target.append(heading);
      results.forEach(v=>{const p=document.createElement("p");p.textContent=v.v+". "+v.t;const button=document.createElement("button");button.type="button";button.className="verse-action";button.textContent="Abrir";button.addEventListener("click",()=>{$("verse-"+v.v)?.scrollIntoView({behavior:"smooth",block:"center"});});p.append(" ",button);target.append(p);});
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
    const versionOptions = [...$("versionSelect").options].map(o => ({value:o.value,label:o.textContent}));
    featurePanel.innerHTML = '<h3>Comparar traduções</h3><p>Compare o mesmo capítulo em duas versões disponíveis neste site. Selecione uma segunda tradução e carregue a comparação.</p><form id="compareForm" class="reader-feature-form"><label>Segunda tradução<select id="compareVersion"></select></label><button class="btn btn-primary" type="submit">Comparar capítulo</button></form><div id="compareResults" class="compare-results" aria-live="polite"></div>';
    const compareSelect=$("compareVersion");
    versionOptions.forEach(option=>{const o=document.createElement("option");o.value=option.value;o.textContent=option.label;compareSelect.append(o);});
    compareSelect.value=versionOptions.find(o=>o.value!==$("versionSelect").value)?.value||versionOptions[0]?.value||"BPM";
    $("compareForm").addEventListener("submit",async event=>{
      event.preventDefault();
      const target=$("compareResults");
      const book=books[Number(bookSelect.value)],chapter=Number(chapterSelect.value),firstVersion=$("versionSelect").value,secondVersion=compareSelect.value;
      target.textContent="Carregando as duas versões…";
      try{
        const left=await fetchChapterVerses(firstVersion,book,chapter);
        const right=await fetchChapterVerses(secondVersion,book,chapter);
        target.innerHTML="";
        const grid=document.createElement("div");grid.className="compare-grid";
        [[firstVersion,left], [secondVersion,right]].forEach(([version,verses])=>{
          const col=document.createElement("section");col.className="compare-column";
          const title=document.createElement("h4");title.textContent=versionOptions.find(o=>o.value===version)?.label||version;col.append(title);
          verses.forEach(v=>{const p=document.createElement("p");const n=document.createElement("sup");n.textContent=v.v+". ";p.append(n,document.createTextNode(v.t));col.append(p);});
          grid.append(col);
        });
        target.append(grid);
      }catch(error){target.textContent="Não foi possível comparar: "+error.message;}
    });
  }
}
readerTabButtons.forEach(button=>button.addEventListener("click",()=>setReaderTab(button.dataset.readerTab)));
const audioReadButton=$("audioRead");
let speechBusy=false;
let speechRunId=0;
function stopBibleAudio(){
  speechRunId++;
  if("speechSynthesis" in window)window.speechSynthesis.cancel();
  speechBusy=false;
  document.querySelectorAll(".bible-verse.is-speaking").forEach(el=>el.classList.remove("is-speaking"));
  if(audioReadButton)audioReadButton.textContent="▶ Ouvir capítulo";
  status.textContent="Áudio pausado.";
}
function speakVerseAt(index,runId){
  if(runId!==speechRunId||!speechBusy)return;
  if(index>=loadedVerses.length){
    speechBusy=false;
    if(audioReadButton)audioReadButton.textContent="▶ Ouvir capítulo";
    status.textContent="Leitura em áudio concluída.";
    return;
  }
  const verse=loadedVerses[index];
  const element=$("verse-"+verse.v);
  document.querySelectorAll(".bible-verse.is-speaking").forEach(el=>el.classList.remove("is-speaking"));
  if(element){element.classList.add("is-speaking");element.scrollIntoView({behavior:"smooth",block:"nearest"});}
  const text=("Versículo "+verse.v+". "+String(verse.t||"")).trim();
  if(!text.replace(/[^\p{L}\p{N}]/gu,"")){
    speakVerseAt(index+1,runId);return;
  }
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang="pt-BR";utterance.rate=0.88;utterance.pitch=1;
  const voices=window.speechSynthesis.getVoices();
  const voice=voices.find(v=>/^pt[-_]BR$/i.test(v.lang))||voices.find(v=>/^pt[-_]/i.test(v.lang));
  if(voice)utterance.voice=voice;
  utterance.onstart=()=>{if(runId===speechRunId)status.textContent="Lendo versículo "+verse.v+"…";};
  utterance.onend=()=>{if(runId===speechRunId&&speechBusy)speakVerseAt(index+1,runId);};
  utterance.onerror=event=>{
    if(runId!==speechRunId)return;
    speechBusy=false;
    if(audioReadButton)audioReadButton.textContent="▶ Tentar áudio novamente";
    const error=event&&event.error;
    status.textContent=error==="not-allowed"
      ?"O navegador bloqueou a voz. Clique novamente no botão de áudio para autorizar a reprodução."
      :"A voz do navegador parou ( "+(error||"erro de áudio")+" ). Verifique o som e as vozes em português instaladas no Chrome/Edge.";
  };
  try{
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }catch(error){
    speechBusy=false;
    if(audioReadButton)audioReadButton.textContent="▶ Tentar áudio novamente";
    status.textContent="Não foi possível iniciar a voz do navegador.";
  }
}
function playBibleAudio(){
  if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){
    status.textContent="Este navegador não oferece leitura em voz alta. Abra no Chrome ou Edge atualizado.";
    return;
  }
  if(speechBusy||window.speechSynthesis.speaking){stopBibleAudio();return;}
  const selectedKey=bookSelect.value+":"+chapterSelect.value+":"+$("versionSelect").value;
  if(!loadedVerses.length||loadedChapterKey!==selectedKey){
    status.textContent="Carregando o capítulo. Quando terminar, toque em “Ouvir capítulo” novamente para iniciar o áudio.";
    loadChapter();
    return;
  }
  if(!loadedVerses.length){status.textContent="O capítulo não carregou; tente novamente antes de ouvir.";return;}
  speechBusy=true;
  const runId=++speechRunId;
  audioReadButton.textContent="■ Parar áudio";
  status.textContent="Preparando a leitura falada…";
  window.speechSynthesis.cancel();
  // A segunda interação do usuário inicia a fala sem aguardar uma requisição de rede.
  window.setTimeout(()=>{
    if(runId!==speechRunId||!speechBusy)return;
    speakVerseAt(0,runId);
  },100);
}
if(audioReadButton)audioReadButton.addEventListener("click",playBibleAudio);
const audioShortcut=$("audioBibleShortcut");
if(audioShortcut)audioShortcut.addEventListener("click",()=>{
  setReaderTab("read");
  $("ler").scrollIntoView({behavior:"smooth",block:"start"});
  status.textContent="Selecione um capítulo e toque em Ler Capítulo. Depois toque em Ouvir capítulo.";
  audioReadButton.focus({preventScroll:true});
});
const lastBook=localStorage.getItem("bibleLastBook"),lastChapter=localStorage.getItem("bibleLastChapter"),lastVersion=localStorage.getItem("bibleLastVersion");
if(lastVersion && $("versionSelect")) {
  const savedOption = [...$("versionSelect").options].find(option => option.value === lastVersion);
  if(savedOption) $("versionSelect").value=lastVersion;
  else localStorage.removeItem("bibleLastVersion");
}
if(lastBook!==null && books[Number(lastBook)]) {bookSelect.value=lastBook;fillChapters();if(lastChapter)chapterSelect.value=lastChapter;}
if($("versionSelect")) $("versionSelect").addEventListener("change",loadChapter);
// Deixa o capítulo selecionado pronto antes do clique no áudio, evitando perder a ativação do navegador.
loadChapter();
