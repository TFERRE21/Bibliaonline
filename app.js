const books = [
["Gênesis",50,"genesis"],["Êxodo",40,"exodo"],["Levítico",27,"levitico"],["Números",36,"numeros"],["Deuteronômio",34,"deuteronomio"],["Josué",24,"josue"],["Juízes",21,"juizes"],["Rute",4,"rute"],["1 Samuel",31,"1-samuel"],["2 Samuel",24,"2-samuel"],["1 Reis",22,"1-reis"],["2 Reis",25,"2-reis"],["1 Crônicas",29,"1-cronicas"],["2 Crônicas",36,"2-cronicas"],["Esdras",10,"esdras"],["Neemias",13,"neemias"],["Ester",10,"ester"],["Jó",42,"jo"],["Salmos",150,"salmos"],["Provérbios",31,"proverbios"],["Eclesiastes",12,"eclesiastes"],["Cânticos",8,"canticos"],["Isaías",66,"isaias"],["Jeremias",52,"jeremias"],["Lamentações",5,"lamentacoes"],["Ezequiel",48,"ezequiel"],["Daniel",12,"daniel"],["Oséias",14,"oseias"],["Joel",3,"joel"],["Amós",9,"amos"],["Obadias",1,"obadias"],["Jonas",4,"jonas"],["Miquéias",7,"miqueias"],["Naum",3,"naum"],["Habacuque",3,"habacuque"],["Sofonias",3,"sofonias"],["Ageu",2,"ageu"],["Zacarias",14,"zacarias"],["Malaquias",4,"malaquias"],["Mateus",28,"mateus"],["Marcos",16,"marcos"],["Lucas",24,"lucas"],["João",21,"joao"],["Atos",28,"atos"],["Romanos",16,"romanos"],["1 Coríntios",16,"1-corintios"],["2 Coríntios",13,"2-corintios"],["Gálatas",6,"galatas"],["Efésios",6,"efesios"],["Filipenses",4,"filipenses"],["Colossenses",4,"colossenses"],["1 Tessalonicenses",5,"1-tessalonicenses"],["2 Tessalonicenses",3,"2-tessalonicenses"],["1 Timóteo",6,"1-timoteo"],["2 Timóteo",4,"2-timoteo"],["Tito",3,"tito"],["Filemom",1,"filemom"],["Hebreus",13,"hebreus"],["Tiago",5,"tiago"],["1 Pedro",5,"1-pedro"],["2 Pedro",3,"2-pedro"],["1 João",5,"1-joao"],["2 João",1,"2-joao"],["3 João",1,"3-joao"],["Judas",1,"judas"],["Apocalipse",22,"apocalipse"]
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
  content.innerHTML='<div class="reader-empty"><span>◌</span><h3>Preparando a leitura</h3><p>Aguarde enquanto buscamos o capítulo.</p></div>';
  const queries=[encodeURIComponent(book[0]+" "+chapter),encodeURIComponent(book[2]+" "+chapter)];
  let result=null, error=null;
  for (const q of queries) {
    try {
      const res=await fetch("https://bible-api.com/"+q+"?translation=almeida");
      if(!res.ok) throw new Error("Serviço indisponível");
      const data=await res.json();
      if(data.verses && data.verses.length){result=data;break}
      error=new Error("Capítulo não encontrado");
    } catch(e){error=e}
  }
  if(!result) {
    status.textContent="Não foi possível carregar o capítulo agora.";
    content.innerHTML='<div class="reader-empty"><span>⌁</span><h3>Leitura temporariamente indisponível</h3><p>Verifique sua conexão e tente novamente. O serviço de texto bíblico pode estar indisponível.</p></div>';
    return;
  }
  status.textContent=(result.reference||book[0]+" "+chapter)+" · "+result.verses.length+" versículos";
  content.innerHTML="";
  result.verses.forEach(v=>{const p=document.createElement("p");const n=document.createElement("sup");n.className="verse-num";n.textContent=v.verse;n.setAttribute("aria-label","Versículo "+v.verse);p.append(n,document.createTextNode(String(v.text||"").trim()));content.append(p)});
  content.style.fontSize=fontSize+"px";
  content.scrollIntoView({behavior:"smooth",block:"nearest"});
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
