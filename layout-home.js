(()=>{"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").replace(/[.]/g,"").replace(/\s+/g," ").trim();
const bookSelect=$("#bookSelect"),chapterSelect=$("#chapterSelect"),readButton=$("#readButton");
const testamentList=$("#sidebarBookList");
if(bookSelect&&testamentList){
 const books=[...bookSelect.options].map(o=>({value:o.value,name:o.textContent.trim()})).filter(x=>x.value!=="");
 const oldNames=new Set(["genesis","exodo","levitico","numeros","deuteronomio","josue","juizes","rute","1 samuel","2 samuel","1 reis","2 reis","1 cronicas","2 cronicas","esdras","neemias","ester","jo","salmos","proverbios","eclesiastes","canticos","isaias","jeremias","lamentacoes","ezequiel","daniel","oseias","joel","amos","obadias","jonas","miqueias","naum","habacuque","sofonias","ageu","zacarias","malaquias"]);
 let testament="old";
 const renderBooks=()=>{
  testamentList.replaceChildren();
  books.filter(b=>testament==="old"?oldNames.has(normalize(b.name)):!oldNames.has(normalize(b.name))).forEach(book=>{
   const button=document.createElement("button");button.type="button";button.textContent=book.name;
   button.classList.toggle("active",book.value===bookSelect.value);
   button.addEventListener("click",()=>{
    bookSelect.value=book.value;bookSelect.dispatchEvent(new Event("change",{bubbles:true}));
    readButton?.click();testamentList.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b===button));
   });
   testamentList.append(button);
  });
 };
 $$("[data-testament]").forEach(button=>button.addEventListener("click",()=>{
  testament=button.dataset.testament;
  $$("[data-testament]").forEach(b=>{const active=b===button;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
  renderBooks();
 }));
 bookSelect.addEventListener("change",renderBooks);renderBooks();
}
const readerPanel=$("#ler .reader-panel");
if(readerPanel&&bookSelect&&!readerPanel.querySelector(".reader-heading")){
 const head=document.createElement("div");head.className="reader-heading";
 head.innerHTML='<div class="reader-crumb"><span id="readerCrumbTestament">Antigo Testamento</span>　›　<span id="readerCrumbBook">Gênesis</span></div><div class="reader-heading-row"><div><h2 id="readerBookTitle">Gênesis</h2><p id="readerBookSubtitle">O início de todas as coisas</p></div><div class="reader-version-slot"></div></div><nav class="chapter-pager" id="chapterPager" aria-label="Escolher capítulo"></nav>';
 readerPanel.insertBefore(head,readerPanel.firstChild);
 const version=readerPanel.querySelector(".version-label"),slot=head.querySelector(".reader-version-slot");if(version&&slot)slot.append(version);
 const update=()=>{
  const selected=bookSelect.options[bookSelect.selectedIndex],name=selected?.textContent.trim()||"Gênesis",isOld=Number(bookSelect.value)<39;
  $("#readerCrumbTestament").textContent=isOld?"Antigo Testamento":"Novo Testamento";
  $("#readerCrumbBook").textContent=name;$("#readerBookTitle").textContent=name;
  $("#readerBookSubtitle").textContent=name==="Gênesis"?"O início de todas as coisas":"Leia e medite na Palavra";
  const pager=$("#chapterPager");if(!pager||!chapterSelect)return;
  pager.replaceChildren();
  const current=Number(chapterSelect.value),total=chapterSelect.options.length;
  const start=Math.max(1,Math.min(current-5,total-12)),end=Math.min(total,start+12);
  for(let n=start;n<=end;n++){
   const b=document.createElement("button");b.type="button";b.textContent=String(n);b.classList.toggle("active",n===current);
   b.setAttribute("aria-current",n===current?"page":"false");
   b.addEventListener("click",()=>{chapterSelect.value=String(n);chapterSelect.dispatchEvent(new Event("change",{bubbles:true}));update()});pager.append(b);
  }
  if(total>13){
   const info=document.createElement("span");info.className="chapter-pager-info";info.textContent=current+" / "+total;pager.append(info);
  }
 };
 bookSelect.addEventListener("change",()=>setTimeout(update,0));chapterSelect?.addEventListener("change",update);update();
}
const topSearch=$("#topBibleSearch");
const findBook=name=>{
 const wanted=normalize(name);
 return [...(bookSelect?.options||[])].find(o=>normalize(o.textContent)===wanted||normalize(o.value.replace(/-/g," "))===wanted);
};
if(topSearch&&!topSearch.dataset.searchBound){
 topSearch.dataset.searchBound="true";
 topSearch.addEventListener("submit",async event=>{
  event.preventDefault();const input=$("#topSearchInput"),term=input?.value.trim()||"";if(!term)return;
  const match=term.match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3}))?$/);
  if(match&&bookSelect&&chapterSelect){
   const option=findBook(match[1]);
   if(!option){alert("Não reconheci esse livro. Experimente escrever o nome completo, como João 3:16.");return;}
   const chapter=Number(match[2]),verse=match[3]?Number(match[3]):null;
   if(chapter<1||chapter>Number(option.dataset.chapters||0)&&chapterSelect.options.length===0){alert("Capítulo inválido.");return;}
   bookSelect.value=option.value;bookSelect.dispatchEvent(new Event("change",{bubbles:true}));
   const setChapter=()=>{if([...chapterSelect.options].some(o=>Number(o.value)===chapter)){chapterSelect.value=String(chapter);chapterSelect.dispatchEvent(new Event("change",{bubbles:true}));readButton?.click();if(verse){setTimeout(()=>{const el=$("#verse-"+verse);if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.add("search-highlight")}else alert("O capítulo foi aberto, mas esse versículo não foi encontrado.");},500);}$("#ler")?.scrollIntoView({behavior:"smooth",block:"start"});}else alert("Esse capítulo não está disponível para o livro selecionado.");};
   setTimeout(setChapter,30);return;
  }
  const tab=$('[data-reader-tab="search"]');tab?.click();
  const field=$("#chapterSearchTerm");
  if(field){field.value=term;$("#chapterSearchForm")?.requestSubmit();$("#ler")?.scrollIntoView({behavior:"smooth",block:"start"});}
  else {$("#ler")?.scrollIntoView({behavior:"smooth",block:"start"});alert("Para pesquisar palavras, abra a aba Busca Avançada depois de carregar um capítulo.");}
 });
}
const menu=$("#menuToggle"),nav=$("#mainNav");
if(menu&&nav&&!menu.dataset.menuBound){
 menu.dataset.menuBound="true";
 const close=()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-label","Abrir menu")};
 menu.addEventListener("click",()=>{
  const open=!nav.classList.contains("open");nav.classList.toggle("open",open);
  menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Fechar menu":"Abrir menu");
  menu.textContent=open?"×":"☰";
 });
 nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
 document.addEventListener("click",e=>{if(nav.classList.contains("open")&&!nav.contains(e.target)&&!menu.contains(e.target))close()});
}
const audio=$("#rightAudioPlay");if(audio)audio.addEventListener("click",()=>$("#audioRead")?.click());
$$("[data-speed]").forEach(button=>button.addEventListener("click",()=>{
 const select=$("#audioSpeed");if(!select)return;const value=String(button.dataset.speed);
 let option=[...select.options].find(o=>Number(o.value)===Number(value));
 if(!option){option=document.createElement("option");option.value=value;option.textContent=value+"x";select.append(option)}
 select.value=value;select.dispatchEvent(new Event("change",{bubbles:true}));
 $$("[data-speed]").forEach(b=>b.classList.toggle("active",b===button));
}));
$("#heroListen")?.addEventListener("click",()=>setTimeout(()=>$("#audioRead")?.click(),200));
})();