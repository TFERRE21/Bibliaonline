#!/usr/bin/env node
/**
 * Biblia Online editorial engine.
 * Daily: publishes reviewed seed materials, then creates a structured draft from a free,
 * local editorial bank. No paid API or external package dependency is required.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'content-library.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CONTENT_DIR = path.join(PUBLIC_DIR, 'conteudo');
const STATE_FILE = path.join(ROOT, 'data', 'publication-state.json');
const BASE_URL = (process.env.SITE_URL || 'https://conectabiblia.com.br').replace(/\/$/, '');
const BASE_PATH = (() => { try { return new URL(BASE_URL).pathname.replace(/\/$/, ''); } catch { return ''; } })();
const TYPES = ['estudo', 'esboco', 'historia', 'quadrinho', 'colorir', 'devocional', 'atividade', 'quiz'];
const LABELS = { estudo: 'Estudo bíblico', esboco: 'Esboço bíblico', historia: 'Historinha bíblica', quadrinho: 'Quadrinhos bíblicos', colorir: 'Desenho para colorir', devocional: 'Devocional diário', atividade: 'Atividade bíblica', quiz: 'Quiz bíblico' };
const ESCAPE = value => String(value ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slugify = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const writeJson = (file, data) => { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); };
const wrap = (title, description, canonical, body) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QMF0KH9DBK"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-QMF0KH9DBK');</script>
<meta name="description" content="${ESCAPE(description)}"><meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${ESCAPE(canonical)}"><meta name="theme-color" content="#203b5b">
<link rel="stylesheet" href="/styles.css"><title>${ESCAPE(title)} | Conecta Bíblia</title>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":${JSON.stringify(title)},"description":${JSON.stringify(description)},"inLanguage":"pt-BR","mainEntityOfPage":${JSON.stringify(canonical)},"publisher":{"@type":"Organization","name":"Conecta Bíblia"}}</script>
</head><body><header class="site-header"><div class="container header-inner"><a class="brand" href="/"><span class="brand-mark"><svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#203b5b"/><path d="M12 17c8-3 15-2 20 2 5-4 12-5 20-2v31c-8-3-15-2-20 2-5-4-12-5-20-2z" fill="#fffaf1"/><path d="M32 19v29" stroke="#c49b58" stroke-width="2"/></svg></span><span>Conecta<span class="brand-light">Bíblia</span><small>PALAVRA • FÉ • CONHECIMENTO</small></span></a><a class="section-link" href="/conteudo/">Biblioteca ↗</a></div></header><main class="container section"><nav aria-label="Você está aqui"><a href="/">Início</a> / <a href="/conteudo/">Biblioteca</a></nav><span class="eyebrow">${ESCAPE(title.split(':')[0].toUpperCase())}</span><h1 style="color:var(--green);font-size:clamp(34px,5vw,52px)">${ESCAPE(title)}</h1><p>${ESCAPE(description)}</p>${body}<p class="source-note">Referência para leitura: ${ESCAPE('Consulte a passagem bíblica indicada e leia o contexto integral.')} O conteúdo é material de apoio e não substitui a leitura das Escrituras.</p><div class="ad-slot" aria-label="Espaço reservado para publicidade"><span>PUBLICIDADE</span><div>Espaço reservado para anúncio</div></div><p><a class="btn btn-primary" href="/conteudo/">Voltar à biblioteca ↗</a></p></main><footer class="site-footer"><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Conecta Bíblia</span><span><a href="/privacidade.html">Privacidade</a> · <a href="/contato.html">Contato</a></span></div></footer></body></html>`;
function artSvg(item) {
  const type = item.type;
  const title = ESCAPE(item.title);
  const common = '<rect width="800" height="480" fill="#fffdf5"/><path d="M0 370 Q150 320 300 375 T600 360 T800 350 V480 H0Z" fill="white" stroke="#1f2c26" stroke-width="4"/>';
  let drawing = '';
  if (type === 'quadrinho') {
    const panels = item.sections.map((s,i) => {
      const x=25+(i%3)*255, y=25+Math.floor(i/3)*215;
      return `<g><rect x="${x}" y="${y}" width="240" height="195" rx="9" fill="white" stroke="#1f2c26" stroke-width="4"/><circle cx="${x+120}" cy="${y+70}" r="28" fill="white" stroke="#1f2c26" stroke-width="3"/><path d="M${x+120} ${y+98} v48 m-22 -28 l22 10 22 -10 m-22 28 l-18 25 m18 -25 l18 25" fill="none" stroke="#1f2c26" stroke-width="4" stroke-linecap="round"/><text x="${x+120}" y="${y+180}" text-anchor="middle" font-size="12" fill="#1f2c26" font-family="sans-serif">${ESCAPE(s.heading).slice(0,30)}</text></g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${item.sections.length>3?480:250}" role="img" aria-label="${title}"><rect width="800" height="${item.sections.length>3?480:250}" fill="#fffdf5"/>${panels}</svg>`;
  }
  if (type === 'colorir' || type === 'atividade') {
    drawing = '<circle cx="660" cy="90" r="42" fill="white" stroke="#1f2c26" stroke-width="4"/><path d="M0 330 L170 160 310 300 450 170 620 325 730 220 800 285 V480 H0Z" fill="white" stroke="#1f2c26" stroke-width="4"/><path d="M140 385 V290 M140 310 l-40 -28 M140 330 l42 -30 M140 275 l-28 42 h56Z" fill="white" stroke="#1f2c26" stroke-width="4" stroke-linejoin="round"/><path d="M540 385 V280 M540 300 l-40 -30 M540 325 l42 -30 M540 263 l-28 42 h56Z" fill="white" stroke="#1f2c26" stroke-width="4" stroke-linejoin="round"/><path d="M60 100 q-8 -35 30 -38 q20 -36 48 -3 q36 -3 37 33Z" fill="white" stroke="#1f2c26" stroke-width="4"/>';
    if (/jonas|peixe/i.test(item.title)) drawing += '<ellipse cx="380" cy="270" rx="105" ry="58" fill="white" stroke="#1f2c26" stroke-width="4"/><path d="M475 270 l65 -45 v90Z" fill="white" stroke="#1f2c26" stroke-width="4"/><circle cx="325" cy="255" r="6" fill="#1f2c26"/><path d="M365 245 q30 25 0 50" fill="none" stroke="#1f2c26" stroke-width="4"/>';
    else drawing += '<circle cx="385" cy="260" r="45" fill="white" stroke="#1f2c26" stroke-width="4"/><path d="M385 305 v80 m-35 -45 l35 15 35 -15 m-35 45 l-28 40 m28 -40 l28 40" fill="none" stroke="#1f2c26" stroke-width="4" stroke-linecap="round"/>';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" role="img" aria-label="Desenho em preto e branco para colorir: ${title}"><rect width="800" height="480" fill="white"/>${drawing}<text x="400" y="455" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#1f2c26">${title}</text></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" role="img" aria-label="Ilustração original para ${title}">${common}<circle cx="650" cy="95" r="43" fill="#fffdf5" stroke="#1f2c26" stroke-width="4"/><path d="M70 375 L230 185 350 330 470 205 650 375" fill="white" stroke="#1f2c26" stroke-width="4"/><text x="400" y="70" text-anchor="middle" font-family="serif" font-size="26" fill="#1f2c26">${title.slice(0,65)}</text></svg>`;
}
function renderItem(item) {
  const chunks = (item.sections || []).map(section => `<section class="feature-card" style="margin:20px 0"><h2>${ESCAPE(section.heading)}</h2><p>${ESCAPE(section.body)}</p></section>`).join('');
  const questions = (item.questions || []).map(q=>`<li>${ESCAPE(q)}</li>`).join('');
  const imageExt = 'svg';
  const art = ['quadrinho','colorir','atividade'].includes(item.type) ? `<figure class="feature-card"><img src="/assets/arte/${ESCAPE(item.id)}.${imageExt}" alt="Ilustração original de ${ESCAPE(item.title)}" style="width:100%;height:auto"><figcaption>${item.type==='colorir'?'Ilustração original para imprimir e colorir':item.type==='atividade'?'Atividade ilustrada para imprimir':'Roteiro ilustrado em quadros'} · ${ESCAPE(item.reference)}</figcaption>${['colorir','atividade'].includes(item.type)?'<button class="btn btn-primary" onclick="window.print()">Imprimir atividade</button>':''}</figure>` : '';
  return wrap(item.title, item.description, BASE_URL+'/conteudo/'+item.id+'/', `<p><strong>Referência bíblica:</strong> ${ESCAPE(item.reference)} · ${Number(item.readingMinutes)||5} min de leitura</p><p>${ESCAPE(item.intro)}</p>${art}${chunks}<section class="feature-card" style="margin:20px 0"><h2>Para refletir e conversar</h2><ul>${questions}</ul></section><section class="feature-card" style="margin:20px 0"><h2>Oração sugerida</h2><p>${ESCAPE(item.prayer || 'Reserve um momento para refletir sobre a passagem e orar com suas próprias palavras.')}</p></section>`);
}
function renderHub(items) {
  const cards = items.slice().sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||'')).map(item=>`<a class="feature-card content-card" data-type="${ESCAPE(item.type)}" data-search="${ESCAPE((item.title+' '+item.description+' '+item.reference+' '+LABELS[item.type]).toLowerCase())}" href="/conteudo/${ESCAPE(item.id)}/"><span class="card-kicker">${ESCAPE(LABELS[item.type]||'Conteúdo bíblico')} · ${ESCAPE(item.reference)}</span><h2>${ESCAPE(item.title)}</h2><p>${ESCAPE(item.description)}</p><span class="card-arrow">Ler conteúdo ↗</span></a>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QMF0KH9DBK"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-QMF0KH9DBK');</script><meta name="description" content="Biblioteca de estudos bíblicos, esboços, histórias para crianças, quadrinhos e desenhos para colorir."><meta name="robots" content="index,follow"><link rel="canonical" href="${BASE_URL}/conteudo/"><link rel="stylesheet" href="/styles.css"><title>Biblioteca de conteúdo bíblico | Conecta Bíblia</title></head><body><header class="site-header"><div class="container header-inner"><a class="brand" href="/"><span class="brand-mark">✦</span><span>Conecta<span class="brand-light">Bíblia</span><small>PALAVRA • FÉ • CONHECIMENTO</small></span></a><a href="/" class="section-link">Página inicial ↗</a></div></header><main class="container section"><span class="eyebrow">BIBLIOTECA EM CRESCIMENTO</span><h1 style="color:var(--green);font-size:clamp(35px,5vw,52px)">Conteúdo para estudar, ensinar e criar.</h1><p>Materiais com referências para leitura bíblica, perguntas de reflexão e atividades originais. Novos conteúdos são preparados pelo mecanismo editorial conforme a biblioteca disponível.</p><div class="library-tools"><label for="contentSearch">Buscar conteúdo<input id="contentSearch" type="search" placeholder="Ex.: oração, perdão, crianças..."></label><label for="contentType">Categoria<select id="contentType"><option value="all">Todas as categorias</option>${TYPES.map(type=>`<option value="${type}">${LABELS[type]}</option>`).join('')}</select></label><p id="contentCount" aria-live="polite"></p></div><div class="feature-grid library-grid" style="margin:30px 0">${cards}</div><p>Quantidade de materiais publicados: <strong>${items.length}</strong>.</p></main><footer class="site-footer"><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Conecta Bíblia</span><span><a href="/privacidade.html">Privacidade</a> · <a href="/contato.html">Contato</a></span></div></footer><script>const q=document.getElementById("contentSearch"),t=document.getElementById("contentType"),cards=[...document.querySelectorAll(".content-card")],count=document.getElementById("contentCount");function filter(){let n=0;cards.forEach(c=>{const ok=(t.value==="all"||c.dataset.type===t.value)&&c.dataset.search.includes(q.value.toLowerCase().trim());c.hidden=!ok;if(ok)n++});count.textContent=n+" material(is) encontrado(s)."}q.addEventListener("input",filter);t.addEventListener("change",filter);filter();</script></body></html>`;
}

const LOCAL_TOPICS = [
['amizade-e-lealdade','Amizade e lealdade','Provérbios 17:17; João 15:12–15','A Bíblia apresenta a amizade como presença, lealdade e amor que se expressa em atitudes. As passagens convidam a refletir sobre cuidado mútuo, honestidade e limites saudáveis.','Pratique uma atitude concreta de amizade: escute sem interromper, cumpra uma promessa possível ou ofereça ajuda respeitosa.'],
['perdao-e-reconciliacao','Perdão e reconciliação','Mateus 18:21–35; Efésios 4:31–32','O ensino bíblico sobre perdão chama à misericórdia, mas não exige negar o dano sofrido nem permanecer em situações perigosas. Reconciliação também envolve verdade, responsabilidade e mudança.','Reflita sobre um passo seguro e realista: nomear o que aconteceu, buscar conselho confiável ou estabelecer limites necessários.'],
['sabedoria-nas-escolhas','Sabedoria nas escolhas','Tiago 1:5; Provérbios 3:5–6','As Escrituras valorizam a busca de sabedoria, o discernimento e a disposição para ouvir bons conselhos. Decisões responsáveis consideram princípios, consequências e as pessoas afetadas.','Antes de uma decisão, escreva as opções, procure informação confiável e converse com alguém experiente e de confiança.'],
['gratidao-diaria','Gratidão no cotidiano','Salmo 100; Colossenses 3:15–17','A gratidão bíblica é uma prática de reconhecimento, não uma obrigação de fingir que tudo está bem. Ela pode coexistir com lamento, dúvidas e a procura por ajuda.','Anote três coisas pelas quais sente gratidão e uma dificuldade sobre a qual precisa conversar ou buscar apoio.'],
['servico-ao-proximo','Servir ao próximo','Marcos 10:42–45; Gálatas 5:13','Jesus relaciona grandeza ao serviço e desafia o uso do poder para dominar. Servir significa respeitar a dignidade do outro, sem manipulação e sem abandonar limites saudáveis.','Escolha uma ação útil que respeite a necessidade real da pessoa: oferecer escuta, compartilhar uma tarefa ou apoiar uma iniciativa comunitária.'],
['coragem-e-medo','Coragem em tempos difíceis','Josué 1:7–9; Salmo 56:3–4','Os textos bíblicos falam de coragem sem afirmar que pessoas de fé nunca sentem medo. Coragem pode incluir pedir ajuda, agir com prudência e continuar um passo de cada vez.','Identifique o que está sob seu controle hoje e escolha um passo seguro. Se o problema for grave, procure ajuda adequada.'],
['justica-e-misericordia','Praticar justiça e misericórdia','Miqueias 6:8; Lucas 10:25–37','A justiça bíblica aparece ligada à misericórdia, à humildade e ao cuidado com o próximo. A parábola do samaritano desafia barreiras sociais e pergunta quem age como próximo.','Observe uma necessidade na sua comunidade e pense em uma forma concreta, respeitosa e sustentável de contribuir.'],
['familia-e-dialogo','Diálogo e respeito na família','Efésios 4:25–32; Colossenses 3:12–14','A comunicação respeitosa exige verdade, paciência e disposição para ouvir. Nenhum texto deve ser usado para justificar violência ou impedir alguém de procurar proteção.','Pratique ouvir até o fim, falar sobre fatos sem insultos e combinar um momento tranquilo para conversar.'],
['ansiedade-e-cuidado','Preocupações e cuidado integral','Filipenses 4:6–9; Salmo 46','A oração pode oferecer espaço para expressar preocupações e buscar paz, mas não substitui cuidados médicos, psicológicos ou ajuda prática quando necessários.','Compartilhe uma preocupação com pessoa confiável, divida tarefas em etapas e procure apoio profissional se precisar.'],
['integridade-no-dia-a-dia','Integridade nas pequenas atitudes','Provérbios 10:9; Lucas 16:10','Integridade é coerência entre valores e ações, inclusive quando ninguém está observando. A honestidade fortalece a confiança e exige reconhecer erros e reparar danos.','Escolha uma situação cotidiana em que possa ser mais transparente e corrija com responsabilidade algum erro pendente.'],
['generosidade-com-equilibrio','Generosidade com responsabilidade','2 Coríntios 9:6–8; Provérbios 19:17','A generosidade bíblica é voluntária e consciente. Não deve ser usada para constranger pessoas, prometer recompensas garantidas ou pressionar quem não tem condições de contribuir.','Planeje uma forma de compartilhar tempo, conhecimento ou recursos sem comprometer necessidades essenciais suas ou de sua família.'],
['esperanca-e-paciencia','Esperança e paciência','Romanos 12:12; Salmo 27:13–14','A esperança bíblica não apaga a realidade da espera nem oferece uma data garantida para a solução dos problemas. Ela pode sustentar perseverança e solidariedade durante processos longos.','Defina um próximo passo possível e identifique quem pode caminhar ao seu lado enquanto você espera.'],
['palavras-que-edificam','Palavras que edificam','Efésios 4:29; Provérbios 15:1','A Bíblia trata a fala como responsabilidade. Palavras podem esclarecer, consolar e corrigir com respeito, ou ferir e espalhar conflitos quando usadas sem cuidado.','Antes de enviar uma mensagem difícil, releia-a e pergunte se é verdadeira, necessária e respeitosa.'],
['humildade-para-aprender','Humildade para aprender','Provérbios 9:9; Filipenses 2:3–4','Humildade não significa desprezar a própria dignidade; significa reconhecer limites, aprender com outras pessoas e considerar necessidades alheias sem buscar superioridade.','Peça feedback específico a alguém confiável e escolha uma sugestão que possa colocar em prática.'],
['descanso-e-equilibrio','Descanso e equilíbrio','Marcos 6:30–32; Êxodo 20:8–10','As narrativas bíblicas reconhecem a importância de interromper atividades e recuperar forças. O descanso pode ser parte de uma vida responsável, não sinal de preguiça.','Revise sua rotina e reserve um período realista para descansar, dormir e estar presente com pessoas queridas.'],
['cuidado-com-a-criacao','Cuidar da criação','Gênesis 2:15; Salmo 24:1','A Bíblia apresenta a criação como algo que merece cuidado. Essa responsabilidade pode ser expressa em hábitos cotidianos e em ações comunitárias que respeitam pessoas, animais e ambiente.','Escolha uma ação ambiental possível nesta semana, como reduzir desperdício ou cuidar de um espaço compartilhado.'],
['lideranca-serva','Liderança que serve','João 13:1–17; 1 Pedro 5:2–3','O gesto de Jesus ao lavar os pés dos discípulos oferece uma imagem de liderança que serve em vez de explorar. Liderar também exige responsabilidade, escuta e prestação de contas.','Como líder ou participante, pergunte de que apoio o grupo precisa e divida tarefas de forma justa.'],
['fé-e-atitudes','Fé demonstrada em atitudes','Tiago 2:14–18; Mateus 7:24–27','Tiago relaciona fé e obras ao cuidado concreto, enquanto Jesus compara ouvir e praticar a construir sobre fundamento firme. A prática não é exibicionismo, mas coerência.','Transforme uma convicção em ação observável e avalie com humildade se ela realmente ajudou alguém.'],
['recomecar-com-responsabilidade','Recomeçar com responsabilidade','Lamentações 3:22–24; Lucas 15:11–24','Textos bíblicos sobre misericórdia e retorno podem ajudar a pensar em recomeços. Recomeçar não apaga consequências: pode incluir reconhecer erros, reparar danos e aceitar apoio.','Escolha uma pequena mudança sustentável e, se prejudicou alguém, considere como assumir responsabilidade de maneira segura.'],
['comunidade-e-pertencimento','Comunidade e pertencimento','1 Coríntios 12:12–27; Hebreus 10:24–25','A imagem do corpo em 1 Coríntios destaca diversidade de dons e interdependência. Uma comunidade saudável valoriza cada pessoa e evita tratar diferenças como motivo de exclusão.','Convide alguém a participar, reconheça uma contribuição pouco notada ou ofereça ajuda para que todos possam participar.'],
['discernimento-e-verdade','Discernimento diante das informações','Atos 17:11; Provérbios 18:13','A sabedoria bíblica incentiva escuta atenta e exame cuidadoso. Compartilhar uma informação sem verificar pode causar dano; discernimento inclui conferir contexto e fontes confiáveis.','Antes de repassar uma notícia, confira a origem, a data e se outras fontes confiáveis confirmam a informação.'],
['contentamento-e-simplicidade','Contentamento e simplicidade','Filipenses 4:11–13; 1 Timóteo 6:6–8','O contentamento descrito por Paulo não significa passividade diante da injustiça ou ausência de necessidades. É uma reflexão sobre valores que não dependem apenas de possuir mais.','Revise um hábito de consumo e escolha uma prioridade alinhada com seus valores e necessidades reais.'],
['ensinar-com-paciencia','Ensinar com paciência','Deuteronômio 6:6–7; 2 Timóteo 3:14–15','O ensino da fé acontece por palavras, exemplo e repetição cuidadosa. Com crianças, é importante adaptar a linguagem, acolher perguntas e respeitar o desenvolvimento de cada uma.','Leia uma pequena passagem com uma criança, pergunte o que ela entendeu e escute sem exigir respostas decoradas.'],
['consolo-no-luto','Consolo em tempos de luto','Salmo 34:18; João 11:32–36','A Bíblia não trata o choro como falta de fé. A cena de Jesus chorando diante da morte de Lázaro mostra espaço para tristeza, presença e compaixão.','Apoie quem sofre com presença e escuta, sem pressionar a pessoa a superar a dor rapidamente nem oferecer explicações fáceis.'],
['responsabilidade-com-o-dinheiro','Responsabilidade com recursos','Provérbios 21:5; Lucas 14:28','A prudência bíblica valoriza planejamento e consideração dos custos. O texto não promete riqueza automática; ele pode inspirar orçamento realista, prioridades e decisões responsáveis.','Anote receitas, despesas essenciais e compromissos. Se houver dívidas difíceis, procure orientação financeira confiável e evite promessas milagrosas.'],
['hospitalidade-e-acolhimento','Hospitalidade e acolhimento','Romanos 12:13; Hebreus 13:1–2','A hospitalidade bíblica convida a acolher e compartilhar. O acolhimento respeitoso também considera segurança, consentimento, diferenças culturais e os limites de quem oferece ajuda.','Pense em uma forma de fazer alguém se sentir incluído, como convidar para uma conversa ou orientar quem está chegando a um grupo.'],
['perseveranca-no-aprendizado','Perseverança no aprendizado','Provérbios 4:5–7; 2 Pedro 1:5–8','Aprender exige tempo, prática e disposição para corrigir erros. A formação espiritual e intelectual cresce com leitura cuidadosa, perguntas e aplicação responsável.','Escolha um tema para estudar durante a semana, anote dúvidas e procure fontes confiáveis para aprofundar.'],
['paz-e-resolucao-de-conflitos','Buscar paz sem ignorar a verdade','Romanos 12:18; Mateus 5:9','A Bíblia valoriza a paz, reconhecendo que nem todo conflito depende de uma única pessoa. Buscar paz não significa tolerar abuso, esconder injustiças ou abrir mão de proteção.','Se for seguro, tente uma conversa objetiva sobre o problema. Quando houver ameaça ou violência, priorize segurança e ajuda especializada.'],
['vocacao-e-dons','Reconhecer dons e servir','Romanos 12:4–8; 1 Coríntios 12:4–7','As passagens sobre dons descrevem diversidade de capacidades para o bem comum. Elas não precisam ser usadas para comparar pessoas ou pressioná-las a assumir tarefas além de seus limites.','Liste algo que você faz bem e pergunte como pode usar essa habilidade para contribuir de forma equilibrada com outras pessoas.'],
['leitura-biblica-com-contexto','Ler a Bíblia considerando o contexto','Neemias 8:8; Lucas 24:27','Compreender uma passagem envolve observar quem fala, a quem, em que situação e como ela se conecta ao restante do livro. Uma frase isolada pode ser interpretada de maneira equivocada.','Leia o parágrafo completo, observe o gênero do texto e consulte referências cruzadas ou comentários de fontes confiáveis.'],
['gratidao-em-familia','Prática de gratidão em família','Salmo 145:4–7; Deuteronômio 6:6–7','Conversas simples sobre gratidão podem ajudar famílias a recordar histórias, valores e cuidados recebidos. É importante permitir que cada pessoa fale com sinceridade, inclusive sobre dificuldades.','Reserve alguns minutos para cada pessoa mencionar algo bom e uma necessidade pela qual gostaria de receber apoio.'],
['amizade-com-limites','Amizade, respeito e limites','Provérbios 13:20; 1 Coríntios 15:33','Relacionamentos influenciam escolhas, mas limites saudáveis também são importantes. Uma amizade não deve exigir segredo perigoso, controle, humilhação ou abandono de convicções pessoais.','Reflita se seus relacionamentos respeitam sua segurança e dignidade. Converse com alguém confiável se sentir pressão ou medo.']
];
function createLocalItem(existing) {
  const used = new Set(existing.map(x => x.topicKey || x.id));
  const topic = LOCAL_TOPICS.find(t => !used.has(t[0]) && !existing.some(x => x.id === 'guia-' + t[0]));
  if (!topic) return null;
  const [key,title,reference,core,practice] = topic;
  const typeCycle = ['estudo','devocional','esboco','atividade','historia','quiz','quadrinho','colorir'];
  const type = typeCycle[existing.length % typeCycle.length];
  const typeTitles = {
    estudo: 'Estudo bíblico: ', devocional: 'Devocional: ', esboco: 'Esboço: ',
    atividade: 'Atividade bíblica: ', historia: 'História e conversa bíblica: ',
    quiz: 'Quiz bíblico: ', quadrinho: 'Roteiro de quadrinhos: ', colorir: 'Desenho para colorir: '
  };
  const sectionsByType = {
    estudo: [
      {heading:'1. Contexto da passagem',body:core+' Leia as referências completas na sua Bíblia. Observe quem participa da cena, o que acontece antes e depois e qual era a situação original. Anote o que o texto diz explicitamente, sem confundir observação com opinião.'},
      {heading:'2. Ideia central e interpretação',body:'Ao estudar '+title.toLowerCase()+', compare as passagens indicadas e procure o tema que elas realmente compartilham. Considere o gênero literário e o contexto histórico. Evite transformar uma frase isolada em promessa universal ou regra que o texto não apresenta.'},
      {heading:'3. Aplicação responsável',body:practice+' Escreva uma aplicação específica, realista e segura para esta semana. Explique como ela se relaciona com o texto e quais limites precisam ser respeitados.'},
      {heading:'4. Revisão pessoal',body:'Resuma em duas ou três frases o que aprendeu, o que ainda não compreendeu e qual fonte confiável pode ajudar no aprofundamento. Uma boa interpretação permanece aberta a perguntas e à correção.'}
    ],
    devocional: [
      {heading:'Leia e observe',body:core+' Separe alguns minutos para ler integralmente as referências. Respire com calma e escolha uma frase ou ideia do texto que mereça atenção hoje.'},
      {heading:'Medite com sinceridade',body:'A reflexão sobre '+title.toLowerCase()+' não exige esconder sentimentos ou fingir que todas as dificuldades desapareceram. Pergunte o que a passagem revela sobre sabedoria, cuidado, responsabilidade ou esperança, levando em conta o contexto.'},
      {heading:'Uma prática para hoje',body:practice+' Escolha apenas um passo que seja possível cumprir e reveja no fim do dia o que aprendeu com a experiência.'},
      {heading:'Oração e encerramento',body:'Fale com Deus com sinceridade, agradecendo, apresentando suas dúvidas e pedindo discernimento. A oração sugerida é um ponto de partida; você pode usar suas próprias palavras.'}
    ],
    esboco: [
      {heading:'Tema e texto-base',body:'Tema: '+title+'. Texto-base: '+reference+'. Leia cada referência por inteiro e explique à congregação o contexto antes de apresentar aplicações. A ideia central deve nascer do texto, não ser imposta a ele.'},
      {heading:'Ponto 1 — Compreender a Palavra',body:core+' Desenvolva este ponto mostrando o que a passagem diz, a quem se dirige e como se conecta ao argumento do livro bíblico. Use exemplos claros sem apresentar interpretações pessoais como se fossem citações bíblicas.'},
      {heading:'Ponto 2 — Viver o ensinamento',body:practice+' Convide o público a pensar em atitudes concretas. Reconheça que as circunstâncias variam e evite culpar pessoas por situações que exigem proteção, assistência ou apoio especializado.'},
      {heading:'Conclusão e perguntas',body:'Retome a ideia central em uma frase, proponha uma ação prática e abra espaço para perguntas. Confirme todas as referências antes de ensinar e adapte o tempo ao público.'}
    ],
    atividade: [
      {heading:'Objetivo da atividade',body:'Objetivo: conversar sobre '+title.toLowerCase()+' a partir da referência '+reference+'. Um adulto deve ler a passagem, explicar palavras difíceis e adaptar a proposta à idade e às necessidades de cada participante.'},
      {heading:'Mãos à obra',body:'Materiais opcionais: papel, lápis e lápis de cor. Desenhe uma situação que represente o tema e escreva uma palavra que resuma o aprendizado. Não é necessário comprar materiais nem concluir tudo de uma vez.'},
      {heading:'Converse sobre o que aprendeu',body:core+' Pergunte o que a pessoa percebeu no texto, sem exigir uma resposta decorada. Valorize perguntas e permita que cada participante explique o desenho à sua maneira.'},
      {heading:'Desafio para a semana',body:practice+' Combine uma ação simples e segura para praticar em casa ou na comunidade. A participação deve ser voluntária e respeitosa.'}
    ],
    historia: [
      {heading:'Uma conversa para começar',body:'Hoje vamos conversar sobre '+title.toLowerCase()+'. Um adulto pode ler '+reference+' na Bíblia e perguntar à criança o que chamou sua atenção. Não é preciso saber todas as respostas; aprender também envolve fazer perguntas.'},
      {heading:'O que a passagem nos ensina',body:core+' Explique a ideia usando palavras adequadas à idade. Diferencie o relato bíblico de detalhes imaginados para tornar a conversa mais fácil, deixando claro quando um exemplo é apenas ilustrativo.'},
      {heading:'Como viver isso',body:practice+' Convide a criança a sugerir uma atitude que seja segura e possível. Nunca pressione a criança a contar experiências pessoais que a deixem desconfortável.'},
      {heading:'Pergunta final e oração',body:'Pergunte: “O que você gostaria de lembrar desta conversa?” Termine com uma oração breve, caso a criança queira participar, e agradeça sua curiosidade.'}
    ],
    quiz: [
      {heading:'Pergunta 1 — Observe o texto',body:'Leia '+reference+' e escolha a resposta mais fiel ao contexto: o que a passagem destaca principalmente sobre '+title.toLowerCase()+'? A) Uma atitude ou princípio presente no texto. B) Uma promessa de sucesso automático. C) Uma regra inventada sem apoio na passagem. Resposta esperada: A; explique usando o trecho lido.'},
      {heading:'Pergunta 2 — Aplique com cuidado',body:'Qual é uma forma responsável de colocar o ensinamento em prática? A) Agir sem considerar as consequências. B) '+practice+' C) Pressionar outras pessoas a concordar. Resposta esperada: B, considerando a realidade e a segurança de todos.'},
      {heading:'Pergunta 3 — Confira o contexto',body:'Por que é importante ler o capítulo ou parágrafo completo? Porque o contexto ajuda a entender quem fala, a situação e o sentido da passagem, evitando interpretações baseadas em frases isoladas.'},
      {heading:'Desafio de revisão',body:'Volte às referências bíblicas, confirme as respostas e escreva uma dúvida que gostaria de pesquisar. Este quiz é um recurso educativo e não substitui a leitura da Bíblia.'}
    ],
    quadrinho: [
      {heading:'Quadro 1 — A pergunta',body:'Cena: uma pessoa pergunta como compreender '+title.toLowerCase()+'. Narrador: “Vamos conferir o que a Bíblia realmente diz antes de tirar conclusões”. Leia '+reference+'.'},
      {heading:'Quadro 2 — A leitura',body:'Cena: o grupo abre a Bíblia e lê a passagem completa. Narrador: “O contexto nos ajuda a perceber a ideia central”. '+core},
      {heading:'Quadro 3 — A decisão',body:'Cena: o grupo conversa sobre uma atitude concreta. Personagem: “Qual é um passo respeitoso e possível?” Narrador: '+practice},
      {heading:'Quadro 4 — A prática',body:'Cena: os personagens escolhem uma pequena ação e combinam conversar novamente. Mensagem final: estudar, perguntar e praticar com responsabilidade faz parte do aprendizado.'}
    ],
    colorir: [
      {heading:'Desenhe e pinte',body:'Use a ilustração em preto e branco para criar sua própria cena inspirada no tema '+title.toLowerCase()+'. Acrescente cores, paisagens e detalhes que ajudem a contar a ideia. A imagem é uma atividade artística original, não uma reprodução literal de uma cena bíblica.'},
      {heading:'Leia, converse e lembre',body:'Referência para leitura: '+reference+'. '+core+' Depois de colorir, conte com suas palavras o que aprendeu e faça uma pergunta sobre a passagem.'},
      {heading:'Uma atitude para praticar',body:practice+' Se fizer a atividade em grupo, respeite as interpretações e os desenhos dos outros participantes.'}
    ]
  };
  const sections = sectionsByType[type];
  const questions = type === 'quiz' ? [
    'Qual é a ideia principal apresentada na primeira pergunta e como você a confirma lendo a referência?',
    'Qual atitude prática foi sugerida e que cuidado é necessário ao aplicá-la?',
    'Que dúvida você ainda tem sobre o contexto bíblico deste tema?'
  ] : type === 'historia' || type === 'atividade' || type === 'colorir' ? [
    'O que mais chamou sua atenção na passagem '+reference+'?',
    'Como você explicaria este aprendizado com suas próprias palavras?',
    'Que atitude simples e segura pode praticar nesta semana?'
  ] : [
    'O que o contexto da passagem ensina sobre '+title.toLowerCase()+'?',
    'Que atitude concreta pode colocar esse aprendizado em prática?',
    'Que dúvida ou ponto merece ser estudado com mais profundidade?'
  ];
  const item = {
    id:'guia-'+key, topicKey:key, type, title:typeTitles[type]+title,
    description:(type==='colorir'?'Atividade ilustrada para imprimir, colorir e conversar sobre ':type==='quadrinho'?'Roteiro original de quatro quadros sobre ':type==='atividade'?'Atividade prática com conversa e aplicação sobre ':type==='historia'?'Proposta de conversa bíblica infantil sobre ':type==='quiz'?'Quiz com perguntas explicadas sobre ':type==='esboco'?'Esboço para ensino e reflexão sobre ':type==='devocional'?'Leitura devocional com reflexão e prática sobre ':'Estudo bíblico guiado com contexto e aplicação sobre ')+title.toLowerCase()+'.',
    reference, readingMinutes:type==='esboco'?8:5,
    intro:core+' Este material é um guia editorial de apoio. Leia integralmente as referências bíblicas, confira o contexto e adapte as sugestões com responsabilidade.',
    sections, questions,
    prayer:'Deus, ajuda-nos a compreender a tua Palavra com humildade e a praticar o que aprendemos com amor, sabedoria e responsabilidade. Amém.',
    generatedBy:'local-editorial-bank-v2'
  };
  if (!validate(item)) throw new Error('Material do banco local não passou na validação: '+item.id);
  item.publishedAt = new Date().toISOString().slice(0,10);
  return item;
}

function validate(item, strict = true) {
  if (!item || !TYPES.includes(item.type) || !item.title || !item.description || !item.reference || !item.intro || !Array.isArray(item.sections)) return false;
  const minimumSections = item.type === 'colorir' ? 2 : item.type === 'quadrinho' ? 4 : 3;
  if (item.sections.length < minimumSections) return false;
  if (item.title.length > 100 || item.description.length > 180 || item.sections.some(s=>!s.heading || !s.body || (strict && s.body.length < 80))) return false;
  if (!item.questions || item.questions.length < 2) return false;
  item.id = slugify(item.id || item.title);
  return /^[a-z0-9-]+$/.test(item.id) && item.id.length > 3;
}
async function main() {
  fs.mkdirSync(CONTENT_DIR,{recursive:true});
  const library = readJson(DATA_FILE, []);
  const state = readJson(STATE_FILE, {publishedIds:[], lastPublishedAt:null});
  const publishedIds = new Set(state.publishedIds || []);
  if (process.argv.includes('--all')) {
    for (const entry of library) {
      if (!validate(entry, false)) { console.warn('[editorial] Item ignorado por campos ausentes:', entry.id); continue; }
      entry.publishedAt = entry.publishedAt || new Date().toISOString().slice(0,10);
      const target = path.join(CONTENT_DIR, entry.id, 'index.html');
      fs.mkdirSync(path.dirname(target), {recursive:true});
      if (!fs.existsSync(target)) fs.writeFileSync(target, renderItem(entry), 'utf8');
      if (['quadrinho','colorir','atividade'].includes(entry.type)) {
        const artPath=path.join(PUBLIC_DIR,'assets','arte',entry.id+'.svg');
        fs.mkdirSync(path.dirname(artPath),{recursive:true});
        if(!fs.existsSync(artPath)) fs.writeFileSync(artPath, artSvg(entry), 'utf8');
      }
      publishedIds.add(entry.id);
    }
    state.publishedIds=[...publishedIds];
    state.lastPublishedAt=new Date().toISOString();
    writeJson(STATE_FILE,state);
    writeJson(DATA_FILE,library);
    buildAll(library);
    console.log('[editorial] Biblioteca inicial publicada:', publishedIds.size, 'itens');
    return;
  }
  let item = library.find(x=>!publishedIds.has(x.id));
  let source = 'biblioteca editorial';
  if (!item) {
    item = createLocalItem(library);
    if (item) {
      library.push(item);
      writeJson(DATA_FILE, library);
      source = 'banco editorial local gratuito';
    }
  }
  if (!item) {
    console.log('[editorial] Banco editorial local esgotado. Nenhum conteúdo repetido foi publicado; páginas e sitemap foram atualizados.');
    buildAll(library);
    return;
  }
  if (!validate(item, source !== 'biblioteca editorial')) throw new Error('Item editorial inválido: '+item.id);
  item.publishedAt = item.publishedAt || new Date().toISOString().slice(0,10);
  const target = path.join(CONTENT_DIR,item.id,'index.html');
  if (!fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,renderItem(item),'utf8');
  } else {
    console.log('[editorial] Página já existe; evitando sobrescrita: '+item.id);
  }
  if (['quadrinho','colorir','atividade'].includes(item.type)) {
    const artPath=path.join(PUBLIC_DIR,'assets','arte',item.id+'.svg');
    fs.mkdirSync(path.dirname(artPath),{recursive:true});
    if(!fs.existsSync(artPath))fs.writeFileSync(artPath,artSvg(item),'utf8');
  }
  publishedIds.add(item.id);
  state.publishedIds=[...publishedIds];
  state.lastPublishedAt=new Date().toISOString();
  state.lastPublishedId=item.id;
  writeJson(STATE_FILE,state);
  writeJson(DATA_FILE,library);
  buildAll(library);
  console.log('[editorial] Publicado:',item.title,'| tipo:',item.type,'| origem:',source);
}
function buildAll(items) {
  fs.mkdirSync(CONTENT_DIR,{recursive:true});
  fs.mkdirSync(path.join(PUBLIC_DIR,'assets','arte'),{recursive:true});
  // Copia os arquivos estáticos existentes para que o VPS sirva o site completo.
  for (const name of ['index.html','404.html','styles.css','app.js','theme.js','account.js','account-client.js','conta.html','audio-fallback.js','layout-home.js','pwa.js','plano-365.html','service-worker.js','manifest.webmanifest','estudos.html','esbocos.html','infantil.html','ferramentas.html','sobre.html','privacidade.html','termos.html','contato.html','pregacoes.html','mensagens.html','devocionais.html']) {
    const source = path.join(ROOT, name);
    if (fs.existsSync(source)) {
      let content = fs.readFileSync(source, 'utf8').replaceAll('https://conectabiblia.com.br', BASE_URL);
      fs.writeFileSync(path.join(PUBLIC_DIR, name), content, 'utf8');
    }
  }
  for (const icon of ['pwa-icon-192.svg','pwa-icon-512.svg','logo-biblia-online.svg']) {
    const source = path.join(ROOT, 'assets', icon);
    if (fs.existsSync(source)) {
      fs.mkdirSync(path.join(PUBLIC_DIR, 'assets'), {recursive:true});
      fs.copyFileSync(source, path.join(PUBLIC_DIR, 'assets', icon));
    }
  }
  const favicon = path.join(ROOT, 'assets', 'favicon.svg');
  if (fs.existsSync(favicon)) {
    fs.mkdirSync(path.join(PUBLIC_DIR, 'assets'), {recursive:true});
    fs.copyFileSync(favicon, path.join(PUBLIC_DIR, 'assets', 'favicon.svg'));
  }
  require('./generate-devotional-plan').generate();
  fs.mkdirSync(path.join(PUBLIC_DIR,'data'),{recursive:true});
  fs.copyFileSync(path.join(ROOT,'data','devotional-plan-365.json'),path.join(PUBLIC_DIR,'data','devotional-plan-365.json'));
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: '+BASE_URL+'/sitemap.xml\n', 'utf8');
  fs.writeFileSync(path.join(CONTENT_DIR,'index.html'),renderHub(items.filter(x=>fs.existsSync(path.join(CONTENT_DIR,x.id,'index.html')))),'utf8');
  const sitemap = [];
  const add = (loc,priority) => sitemap.push(`  <url><loc>${ESCAPE(loc)}</loc><lastmod>${new Date().toISOString().slice(0,10)}</lastmod><priority>${priority}</priority></url>`);
  add(BASE_URL+'/', '1.0');
  for(const p of ['estudos.html','esbocos.html','pregacoes.html','mensagens.html','devocionais.html','plano-365.html','infantil.html','ferramentas.html','sobre.html','privacidade.html','termos.html','contato.html']) add(BASE_URL+'/'+p,p==='privacidade.html'||p==='termos.html'?'0.3':'0.6');
  add(BASE_URL+'/conteudo/','0.9');
  for(const item of items) if(fs.existsSync(path.join(CONTENT_DIR,item.id,'index.html'))) add(BASE_URL+'/conteudo/'+item.id+'/','0.7');
  // GitHub Pages project sites live under /<repo>/; VPS/custom domains use the root path.
  // Rewrite only root-relative HTML href/src attributes, leaving external URLs untouched.
  if (BASE_PATH) {
    const prefixRootPath = html => html.replace(/(href|src)=(["'])\/(?!\/)/g, (match, attr, quote) => attr+'='+quote+BASE_PATH+'/');
    for (const dir of [PUBLIC_DIR, CONTENT_DIR]) {
      const walk = current => {
        for (const entry of fs.readdirSync(current, {withFileTypes:true})) {
          const file = path.join(current, entry.name);
          if (entry.isDirectory()) walk(file);
          else if (entry.isFile() && entry.name.endsWith('.html')) {
            const html = fs.readFileSync(file, 'utf8');
            fs.writeFileSync(file, prefixRootPath(html), 'utf8');
          }
        }
      };
      walk(dir);
    }
  }
  // Publica páginas individuais de versículos; só comentários editoriais originais entram no sitemap.
  const verseUrls = require('./generate-verse-pages').generate({root:ROOT, publicDir:PUBLIC_DIR, baseUrl:BASE_URL});
  for (const url of verseUrls) add(url, '0.8');
  fs.writeFileSync(path.join(PUBLIC_DIR,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+sitemap.join('\n')+'\n</urlset>\n','utf8');
  console.log('[editorial] Sitemap atualizado:',sitemap.length,'URLs');
}
main().catch(error=>{console.error('[editorial] Falha:',error);process.exitCode=1;});
