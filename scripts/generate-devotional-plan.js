#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const match=app.match(/const books = (\[[\s\S]*?\n\]);/);
if(!match)throw new Error("Não foi possível ler a lista dos 66 livros em app.js");
const books=JSON.parse(match[1]);
const old=books.slice(0,39),fresh=books.slice(39);
const chapters=(list)=>list.flatMap(book=>Array.from({length:book[1]},(_,i)=>({book:book[0],chapter:i+1})));
const ot=chapters(old),nt=chapters(fresh);
const themes=[
 ["Conhecer a Deus","Leia com atenção e observe o que a passagem revela sobre o caráter e as ações de Deus."],
 ["Confiança","Identifique o que o texto ensina sobre confiar em Deus sem ignorar as responsabilidades do cotidiano."],
 ["Sabedoria","Observe os conselhos do texto e pense em uma decisão que exige discernimento."],
 ["Oração","Repare como a passagem se relaciona com oração, sinceridade e comunhão."],
 ["Família e relacionamentos","Considere como o texto orienta o cuidado, o respeito e os limites nos relacionamentos."],
 ["Perseverança","Observe como a passagem trata dificuldades, esperança e continuidade."],
 ["Justiça e misericórdia","Identifique como justiça, compaixão e responsabilidade aparecem no texto."],
 ["Vida de Jesus","Acompanhe as palavras e atitudes de Jesus no contexto da narrativa."],
 ["Fé e atitudes","Pense em como a fé se relaciona com escolhas e ações concretas."],
 ["Gratidão","Observe motivos de gratidão sem ignorar as dificuldades mencionadas no texto."],
 ["Serviço ao próximo","Identifique uma forma respeitosa e possível de servir outras pessoas."],
 ["Esperança","Leia o contexto e observe como a esperança é apresentada na passagem."]
];
const questions=[
 "O que o texto diz explicitamente? Leia também os versículos anteriores e posteriores.",
 "Quem está falando, para quem e em qual situação?",
 "Qual palavra ou ideia merece ser pesquisada com mais cuidado?",
 "O que esta leitura ensina e o que ela não está prometendo?",
 "Que atitude pequena, concreta e responsável pode nascer desta leitura?",
 "Como esta passagem se conecta com o capítulo e com o livro bíblico?",
 "Que dúvida ficou e qual fonte confiável pode ajudar a esclarecê-la?"
];
let otIndex=0,ntIndex=0,extra=0;
const plan=[];
for(let day=1;day<=365;day++){
 extra+=199/365;
 const count=extra>=1?3:2;
 if(extra>=1)extra-=1;
 const oldReading=ot.slice(otIndex,otIndex+count);otIndex+=count;
 let newReading=null;
 if(day<=260){newReading=nt[ntIndex++];}
 const theme=themes[Math.floor((day-1)/365*themes.length)];
 plan.push({
  day,theme:theme[0],
  oldTestament:oldReading.map(x=>x.book+" "+x.chapter),
  newTestament:newReading?newReading.book+" "+newReading.chapter:null,
  reflection:theme[1],
  question:questions[(day-1)%questions.length],
  practice:"Anote uma atitude possível para hoje. Se envolver outra pessoa, respeite a segurança, os limites e a realidade de todos.",
  prayer:"Ore com suas próprias palavras, agradecendo, apresentando suas dúvidas e pedindo sabedoria para viver o que compreendeu."
 });
}
if(otIndex!==929||ntIndex!==260)throw new Error("A distribuição anual não cobriu todos os capítulos planejados.");
const target=path.join(root,"data","devotional-plan-365.json");
fs.writeFileSync(target,JSON.stringify({title:"Plano de leitura e reflexão bíblica em 365 dias",description:"Leitura sequencial de todos os capítulos da Bíblia, com reflexão diária e prática responsável.",totalDays:365,createdFrom:"catalogo de livros em app.js",days:plan},null,2)+"\n");
console.log("[plano-365] 365 dias gerados; 929 capítulos do Antigo Testamento e 260 do Novo Testamento.");
