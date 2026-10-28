#!/usr/bin/env node
/**
 * Biblia Online editorial engine.
 * Daily: publishes one reviewed seed from data/content-library.json, then optionally
 * drafts a new original item with the OpenAI API when OPENAI_API_KEY is configured.
 * No external package dependencies.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'content-library.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CONTENT_DIR = path.join(PUBLIC_DIR, 'conteudo');
const STATE_FILE = path.join(ROOT, 'data', 'publication-state.json');
const BASE_URL = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');
const API_KEY = process.env.OPENAI_API_KEY || '';
const GENERATE_AI_IMAGES = process.env.GENERATE_AI_IMAGES === 'true';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const TYPES = ['estudo', 'esboco', 'historia', 'quadrinho', 'colorir', 'devocional', 'atividade', 'quiz'];
const LABELS = { estudo: 'Estudo bíblico', esboco: 'Esboço bíblico', historia: 'Historinha bíblica', quadrinho: 'Quadrinhos bíblicos', colorir: 'Desenho para colorir', devocional: 'Devocional diário', atividade: 'Atividade bíblica', quiz: 'Quiz bíblico' };
const ESCAPE = value => String(value ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slugify = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const writeJson = (file, data) => { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); };
const wrap = (title, description, canonical, body) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${ESCAPE(description)}"><meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${ESCAPE(canonical)}"><meta name="theme-color" content="#173d32">
<link rel="stylesheet" href="/styles.css"><title>${ESCAPE(title)} | Bíblia Online</title>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":${JSON.stringify(title)},"description":${JSON.stringify(description)},"inLanguage":"pt-BR","mainEntityOfPage":${JSON.stringify(canonical)},"publisher":{"@type":"Organization","name":"Bíblia Online"}}</script>
</head><body><header class="site-header"><div class="container header-inner"><a class="brand" href="/"><span class="brand-mark">✦</span><span>Bíblia<span class="brand-light">Online</span><small>PALAVRA • ESTUDO • FÉ</small></span></a><a class="section-link" href="/conteudo/">Biblioteca ↗</a></div></header><main class="container section"><nav aria-label="Você está aqui"><a href="/">Início</a> / <a href="/conteudo/">Biblioteca</a></nav><span class="eyebrow">${ESCAPE(title.split(':')[0].toUpperCase())}</span><h1 style="color:var(--green);font-size:clamp(34px,5vw,52px)">${ESCAPE(title)}</h1><p>${ESCAPE(description)}</p>${body}<p class="source-note">Referência para leitura: ${ESCAPE('Consulte a passagem bíblica indicada e leia o contexto integral.')} O conteúdo é material de apoio e não substitui a leitura das Escrituras.</p><div class="ad-slot" aria-label="Espaço reservado para publicidade"><span>PUBLICIDADE</span><div>Espaço reservado para anúncio</div></div><p><a class="btn btn-primary" href="/conteudo/">Voltar à biblioteca ↗</a></p></main><footer class="site-footer"><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Bíblia Online</span><span><a href="/privacidade.html">Privacidade</a> · <a href="/contato.html">Contato</a></span></div></footer></body></html>`;
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
  const imageExt = fs.existsSync(path.join(PUBLIC_DIR,'assets','arte',item.id+'.png')) ? 'png' : 'svg';
  const art = ['quadrinho','colorir','atividade'].includes(item.type) ? `<figure class="feature-card"><img src="/assets/arte/${ESCAPE(item.id)}.${imageExt}" alt="Ilustração original de ${ESCAPE(item.title)}" style="width:100%;height:auto"><figcaption>${item.type==='colorir'?'Ilustração original para imprimir e colorir':'Roteiro ilustrado em quadros'} · ${ESCAPE(item.reference)}</figcaption>${item.type==='colorir'?'<button class="btn btn-primary" onclick="window.print()">Imprimir desenho</button>':''}</figure>` : '';
  return wrap(item.title, item.description, BASE_URL+'/conteudo/'+item.id+'/', `<p><strong>Referência bíblica:</strong> ${ESCAPE(item.reference)} · ${Number(item.readingMinutes)||5} min de leitura</p><p>${ESCAPE(item.intro)}</p>${art}${chunks}<section class="feature-card" style="margin:20px 0"><h2>Para refletir e conversar</h2><ul>${questions}</ul></section><section class="feature-card" style="margin:20px 0"><h2>Oração sugerida</h2><p>${ESCAPE(item.prayer || 'Reserve um momento para refletir sobre a passagem e orar com suas próprias palavras.')}</p></section>`);
}
function renderHub(items) {
  const cards = items.slice().sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||'')).map(item=>`<a class="feature-card" href="/conteudo/${ESCAPE(item.id)}/"><span class="card-kicker">${ESCAPE(LABELS[item.type]||'Conteúdo bíblico')} · ${ESCAPE(item.reference)}</span><h2>${ESCAPE(item.title)}</h2><p>${ESCAPE(item.description)}</p><span class="card-arrow">Ler conteúdo ↗</span></a>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Biblioteca de estudos bíblicos, esboços, histórias para crianças, quadrinhos e desenhos para colorir."><meta name="robots" content="index,follow"><link rel="canonical" href="${BASE_URL}/conteudo/"><link rel="stylesheet" href="/styles.css"><title>Biblioteca de conteúdo bíblico | Bíblia Online</title></head><body><header class="site-header"><div class="container header-inner"><a class="brand" href="/"><span class="brand-mark">✦</span><span>Bíblia<span class="brand-light">Online</span><small>PALAVRA • ESTUDO • FÉ</small></span></a><a href="/" class="section-link">Página inicial ↗</a></div></header><main class="container section"><span class="eyebrow">BIBLIOTECA EM CRESCIMENTO</span><h1 style="color:var(--green);font-size:clamp(35px,5vw,52px)">Conteúdo para estudar, ensinar e criar.</h1><p>Materiais com referências para leitura bíblica, perguntas de reflexão e atividades originais. Novos conteúdos são preparados pelo mecanismo editorial conforme a biblioteca disponível.</p><div class="feature-grid" style="margin:30px 0">${cards}</div><p>Quantidade de materiais publicados: <strong>${items.length}</strong>.</p></main><footer class="site-footer"><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Bíblia Online</span><span><a href="/privacidade.html">Privacidade</a> · <a href="/contato.html">Contato</a></span></div></footer></body></html>`;
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
async function createAiItem(existing) {
  if (!API_KEY) return null;
  const wanted = TYPES[Math.floor(Date.now() / 86400000) % TYPES.length];
  const avoid = existing.map(x=>x.title).slice(-100);
  const prompt = `Crie um conteúdo bíblico ORIGINAL em português brasileiro para um site de leitura e estudo. Tipo obrigatório: ${wanted}. Evite estes títulos já usados: ${JSON.stringify(avoid)}. Use paráfrase própria, não reproduza versículos ou traduções bíblicas protegidas por direitos autorais. Não invente referências: escolha uma passagem bíblica conhecida e indique apenas a referência. Conteúdo respeitoso, claro e útil, sem promessas de cura/riqueza nem alegações históricas duvidosas. Para histórias infantis, linguagem adequada e inclua orientação para ler a passagem com um adulto. Para desenhos/quadrinhos/atividades, descreva cenas e instruções originais. Para devocional, inclua aplicação prática do dia; para quiz, crie perguntas educativas com respostas explicadas dentro de sections; para atividade, inclua instruções adequadas à idade. Responda SOMENTE JSON com chaves id,type,title,description,reference,readingMinutes,intro,sections (array de {heading,body}, pelo menos 3 itens e cada body com 80+ caracteres),questions (3 strings),prayer. Para tipo quadrinho, sections devem ser seis quadros. Para colorir, inclua instruções de atividade em sections. Não crie texto genérico repetitivo.`;
  const response = await fetch('https://api.openai.com/v1/responses', {method:'POST',headers:{'Authorization':'Bearer '+API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,input:prompt})});
  if (!response.ok) throw new Error('A API de geração retornou HTTP '+response.status);
  const data = await response.json();
  let output = data.output_text;
  if (!output && Array.isArray(data.output)) output = data.output.flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n');
  if (!output) throw new Error('Resposta de geração vazia');
  const clean = output.replace(/^\s*```(?:json)?/i,'').replace(/```\s*$/,'').trim();
  const item = JSON.parse(clean);
  if (!validate(item)) throw new Error('Conteúdo gerado não passou na validação editorial mínima');
  if (existing.some(x=>x.id===item.id || x.title.toLowerCase()===item.title.toLowerCase())) throw new Error('Conteúdo duplicado detectado');
  item.publishedAt = new Date().toISOString().slice(0,10);
  item.generatedBy = 'ai-draft-validated';
  return item;
}
async function generateAiIllustration(item) {
  if (!API_KEY || !GENERATE_AI_IMAGES || !['quadrinho','colorir','atividade'].includes(item.type)) return false;
  const out = path.join(PUBLIC_DIR,'assets','arte',item.id+'.png');
  if (fs.existsSync(out)) return true;
  const prompt = item.type === 'colorir' || item.type === 'atividade'
    ? 'Crie uma página de atividade infantil bíblica original para impressão, preto e branco, contornos grossos e limpos, sem texto legível, sem marcas. Tema: '+item.title+'. Adequada para crianças, sem violência, composição simples com bastante espaço em branco, página vertical.'
    : 'Crie uma ilustração original em estilo de quadrinhos infantis bíblicos, amigável e educativa, personagens genéricos originais, sem texto, sem marcas. Tema: '+item.title+'.';
  const response = await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{'Authorization':'Bearer '+API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-image-1',prompt,size:'1024x1024',quality:'low',output_format:'png'})});
  if (!response.ok) throw new Error('A geração de imagem retornou HTTP '+response.status);
  const data = await response.json();
  const b64 = data.data && data.data[0] && data.data[0].b64_json;
  if (!b64) throw new Error('A geração de imagem não retornou arquivo PNG');
  fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,Buffer.from(b64,'base64'));
  return true;
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
  if (!item && API_KEY) {
    try { item = await createAiItem(library); if(item){library.push(item);writeJson(DATA_FILE,library);source='geração assistida por IA';} }
    catch(error) { console.error('[editorial] IA indisponível ou conteúdo rejeitado:',error.message); }
  }
  if (!item) {
    console.log('[editorial] Nenhum novo item seguro disponível. Adicione materiais revisados à biblioteca ou configure OPENAI_API_KEY.');
    buildAll(library);
    return;
  }
  if (!validate(item, source !== 'biblioteca editorial')) throw new Error('Item editorial inválido: '+item.id);
  try { await generateAiIllustration(item); } catch(error) { console.warn('[editorial] Ilustração IA não criada; usando SVG de reserva:',error.message); }
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
  // Copia os arquivos estáticos existentes para que o VPS sirva o site completo.
  for (const name of ['index.html','styles.css','app.js','estudos.html','esbocos.html','infantil.html','sobre.html','privacidade.html','termos.html','contato.html']) {
    const source = path.join(ROOT, name);
    if (fs.existsSync(source)) {
      let content = fs.readFileSync(source, 'utf8').replaceAll('https://tferre21.github.io/Bibliaonline', BASE_URL);
      fs.writeFileSync(path.join(PUBLIC_DIR, name), content, 'utf8');
    }
  }
  const favicon = path.join(ROOT, 'assets', 'favicon.svg');
  if (fs.existsSync(favicon)) {
    fs.mkdirSync(path.join(PUBLIC_DIR, 'assets'), {recursive:true});
    fs.copyFileSync(favicon, path.join(PUBLIC_DIR, 'assets', 'favicon.svg'));
  }
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: '+BASE_URL+'/sitemap.xml\n', 'utf8');
  fs.writeFileSync(path.join(CONTENT_DIR,'index.html'),renderHub(items.filter(x=>fs.existsSync(path.join(CONTENT_DIR,x.id,'index.html')))),'utf8');
  const sitemap = [];
  const add = (loc,priority) => sitemap.push(`  <url><loc>${ESCAPE(loc)}</loc><lastmod>${new Date().toISOString().slice(0,10)}</lastmod><priority>${priority}</priority></url>`);
  add(BASE_URL+'/', '1.0');
  for(const p of ['estudos.html','esbocos.html','infantil.html','sobre.html','privacidade.html','termos.html','contato.html']) add(BASE_URL+'/'+p,p==='privacidade.html'||p==='termos.html'?'0.3':'0.6');
  add(BASE_URL+'/conteudo/','0.9');
  for(const item of items) if(fs.existsSync(path.join(CONTENT_DIR,item.id,'index.html'))) add(BASE_URL+'/conteudo/'+item.id+'/','0.7');
  fs.writeFileSync(path.join(PUBLIC_DIR,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+sitemap.join('\n')+'\n</urlset>\n','utf8');
  console.log('[editorial] Sitemap atualizado:',sitemap.length,'URLs');
}
main().catch(error=>{console.error('[editorial] Falha:',error);process.exitCode=1;});
