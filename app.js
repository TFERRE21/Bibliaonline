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
bookSelect.value="18"; fillChapters();
bookSelect.addEventListener("change",fillChapters);
async function loadChapter() {
  const book=books[Number(bookSelect.value)], chapter=chapterSelect.value;
  status.textContent="Carregando "+book[0]+" "+chapter+"…";
  content.innerHTML='<div class="reader-empty"><span>◌</span><h3>Preparando a leitura</h3><p>Aguarde enquanto carregamos o capítulo da biblioteca local.</p></div>';
  try {
    const res=await fetch("/biblia/pt/"+book[3]+"/"+chapter+".json");
    if(!res.ok) throw new Error("Capítulo ainda não importado");
    const data=await res.json();
    if(!Array.isArray(data.verses)||!data.verses.length) throw new Error("Conteúdo inválido");
    status.textContent=book[0]+" "+chapter+" · "+data.verses.length+" versículos · Bíblia Portuguesa Mundial (BPM)";
    content.innerHTML="";
    data.verses.forEach(v=>{
      const p=document.createElement("p"), n=document.createElement("sup");
      n.className="verse-num";n.textContent=v.v;n.setAttribute("aria-label","Versículo "+v.v);
      p.append(n,document.createTextNode(String(v.t||"").trim()));content.append(p);
    });
    content.style.fontSize=fontSize+"px";
  } catch(e) {
    status.textContent="Biblioteca bíblica local ainda não importada.";
    content.innerHTML='<div class="reader-empty"><span>⌁</span><h3>Texto bíblico em preparação</h3><p>A biblioteca completa será carregada na etapa de instalação. Esta página não consulta APIs em tempo real.</p></div>';
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
