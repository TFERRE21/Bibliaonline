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
const practices=[
"Reserve alguns minutos sem distrações para ler o trecho completo e anotar uma frase que chamou sua atenção.",
"Converse com alguém de confiança sobre o que aprendeu, ouvindo com respeito e sem impor sua interpretação.",
"Transforme a leitura em uma atitude concreta de cuidado, serviço ou reconciliação, respeitando os limites envolvidos.",
"Escreva uma preocupação e separe o que você pode fazer hoje daquilo que precisa entregar a Deus e buscar apoio.",
"Leia novamente o texto e observe o que ele diz antes de decidir como aplicá-lo à sua realidade.",
"Pratique gratidão por algo específico e, ao mesmo tempo, reconheça com honestidade aquilo que ainda precisa mudar.",
"Escolha uma decisão da semana e avalie se ela expressa sabedoria, justiça, misericórdia e responsabilidade.",
"Faça uma pausa para ouvir alguém sem interromper, julgar ou tentar resolver tudo imediatamente.",
"Retome uma tarefa importante com paciência, dividindo-a em um passo pequeno e possível.",
"Procure uma oportunidade simples de servir sem esperar reconhecimento ou recompensa.",
"Anote uma pergunta que surgiu na leitura e pesquise o contexto antes de tirar uma conclusão.",
"Peça perdão quando necessário e pense em uma mudança prática que demonstre responsabilidade.",
"Estabeleça um limite saudável onde for necessário, buscando segurança e orientação confiável.",
"Compartilhe uma palavra de encorajamento que seja verdadeira, respeitosa e adequada à situação.",
"Revise suas prioridades e escolha uma ação que aproxime sua rotina dos valores que você professa."
];
const prayers=[
"Senhor, dá-me atenção para compreender tua Palavra e humildade para colocá-la em prática com amor e responsabilidade. Amém.",
"Deus, recebe minhas preocupações e guia meus próximos passos com sabedoria, coragem e serenidade. Amém.",
"Pai, ensina-me a tratar as pessoas com justiça, paciência e misericórdia, sem deixar de respeitar limites. Amém.",
"Senhor, ajuda-me a reconhecer o que preciso mudar e a agir com sinceridade, constância e esperança. Amém.",
"Deus, fortalece minha fé nos dias tranquilos e nos difíceis; que eu não confunda confiança com ausência de responsabilidade. Amém.",
"Pai, obrigado pelo cuidado recebido. Ajuda-me a enxergar também as necessidades ao meu redor e a responder com generosidade. Amém.",
"Senhor, dá-me discernimento para ouvir bons conselhos, avaliar consequências e escolher o que é correto. Amém.",
"Deus, acolhe minhas dúvidas e ensina-me a buscar respostas com paciência, oração e estudo cuidadoso. Amém.",
"Pai, que minha palavra seja verdadeira e construtiva, e que minhas atitudes promovam paz e dignidade. Amém.",
"Senhor, renova minhas forças para continuar aprendendo e fazendo o bem, um passo de cada vez. Amém.",
"Deus, ajuda-me a lembrar que posso pedir ajuda e caminhar acompanhado quando o peso parecer grande. Amém.",
"Pai, orienta minha família e meus relacionamentos com respeito, diálogo, proteção e amor responsável. Amém."
];
const titles=["Caminhando com confiança","Aprendendo a ouvir","Uma fé que amadurece","Sabedoria para hoje","Cuidado que transforma","Esperança na jornada","A força da perseverança","O valor da gratidão","Amor em atitudes","Paz em meio às perguntas","Servir com humildade","A Palavra no cotidiano"];
let otIndex=0,ntIndex=0;
const plan=[];
for(let day=1;day<=365;day++){
 const count=2+(Math.floor(day*199/365)-Math.floor((day-1)*199/365));
 const oldReading=ot.slice(otIndex,otIndex+count);otIndex+=count;
 let newReading=null;
 if(day<=260){newReading=nt[ntIndex++];}
 const theme=themes[Math.floor((day-1)/365*themes.length)];
 plan.push({
  day,theme:theme[0],title:titles[(day-1)%titles.length]+" · Dia "+day,
  oldTestament:oldReading.map(x=>x.book+" "+x.chapter),
  newTestament:newReading?newReading.book+" "+newReading.chapter:null,
  reflection:theme[1]+" Na leitura de hoje ("+oldReading.map(x=>x.book+" "+x.chapter).join(", ")+(newReading?"; "+newReading.book+" "+newReading.chapter:"") + "), leia o capítulo inteiro, observe seu contexto e identifique uma ideia que merece atenção. Não transforme uma frase isolada em promessa automática: procure compreender a mensagem no conjunto das Escrituras.",
  question:questions[(day-1)%questions.length],
  practice:practices[(day-1)%practices.length],
  prayer:prayers[(day-1)%prayers.length]
 });
}
if(otIndex!==929||ntIndex!==260)throw new Error("A distribuição anual não cobriu todos os capítulos planejados.");
const target=path.join(root,"data","devotional-plan-365.json");
fs.writeFileSync(target,JSON.stringify({title:"Plano de leitura e reflexão bíblica em 365 dias",description:"Leitura sequencial de todos os capítulos da Bíblia, com reflexão diária e prática responsável.",totalDays:365,createdFrom:"catalogo de livros em app.js",days:plan},null,2)+"\n");
console.log("[plano-365] 365 dias gerados; 929 capítulos do Antigo Testamento e 260 do Novo Testamento.");
