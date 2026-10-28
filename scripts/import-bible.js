#!/usr/bin/env node
/**
 * Importa a Bíblia Portuguesa Mundial (BPM) para arquivos JSON locais.
 * Fonte: Free.Bible, que espelha textos de domínio público do eBible.org.
 * Execute uma vez durante a preparação/deploy: npm run bible:import
 * Não é uma API com chave: são arquivos JSON públicos baixados e espelhados localmente.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const APP_FILE = path.join(ROOT, 'app.js');
const OUTPUT = path.join(ROOT, 'public', 'biblia', 'pt');
const BASE = 'https://free.bible/bible/pt';
const CONCURRENCY = 6;
const RETRIES = 3;

function getBooks() {
  const source = fs.readFileSync(APP_FILE, 'utf8');
  const match = source.match(/const books = (\[[\s\S]*?\n\]);/);
  if (!match) throw new Error('Não foi possível ler a lista de livros de app.js');
  const books = JSON.parse(match[1]);
  if (books.length !== 66 || books.some(book => !book[3])) {
    throw new Error('A lista deve conter os 66 livros com slug em inglês na quarta posição.');
  }
  return books;
}

async function fetchChapter(bookSlug, chapter) {
  const url = BASE + '/' + encodeURIComponent(bookSlug) + '/' + chapter + '.json';
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(url, {headers:{'User-Agent':'BibliaOnline-local-corpus-import/1.0'}});
      if (!response.ok) throw new Error('HTTP ' + response.status + ' em ' + url);
      const data = await response.json();
      if (!Array.isArray(data.verses) || !data.verses.length ||
          data.verses.some(v => !Number.isInteger(Number(v.v)) || typeof v.t !== 'string')) {
        throw new Error('Estrutura de capítulo inesperada: ' + url);
      }
      return {translation:'pt', book:bookSlug, chapter:Number(chapter), verses:data.verses};
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

async function main() {
  const books = getBooks();
  const jobs = [];
  for (const [name, chapterCount, , slug] of books) {
    for (let chapter = 1; chapter <= chapterCount; chapter++) {
      jobs.push({name, slug, chapter, target:path.join(OUTPUT, slug, chapter + '.json')});
    }
  }
  fs.mkdirSync(OUTPUT, {recursive:true});
  const pending = jobs.filter(job => !fs.existsSync(job.target));
  let completed = jobs.length - pending.length;
  let next = 0;
  let failed = [];
  console.log('[bible-import] Total:', jobs.length, 'capítulos; já locais:', completed, '; pendentes:', pending.length);
  async function worker() {
    while (next < pending.length) {
      const job = pending[next++];
      try {
        const data = await fetchChapter(job.slug, job.chapter);
        fs.mkdirSync(path.dirname(job.target), {recursive:true});
        fs.writeFileSync(job.target, JSON.stringify(data) + '\n', 'utf8');
        completed++;
        if (completed % 25 === 0 || completed === jobs.length) {
          console.log('[bible-import] ' + completed + '/' + jobs.length + ' capítulos');
        }
      } catch (error) {
        failed.push({book:job.name, chapter:job.chapter, error:String(error.message || error)});
        console.error('[bible-import] Falhou:', job.name, job.chapter, String(error.message || error));
      }
    }
  }
  await Promise.all(Array.from({length:CONCURRENCY}, worker));
  const metadata = {
    name:'Bíblia Portuguesa Mundial',
    abbreviation:'BPM',
    language:'pt-BR',
    status:'Tradução em revisão',
    license:'Domínio público',
    source:'https://ebible.org/porbrbsl/',
    copyright:'https://ebible.org/porbrbsl/copyright.htm',
    importedAt:new Date().toISOString(),
    expectedChapters:jobs.length,
    downloadedChapters:completed,
    failedChapters:failed
  };
  fs.writeFileSync(path.join(OUTPUT, 'source.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
  if (failed.length) {
    console.error('[bible-import] Concluído com falhas:', failed.length, 'capítulos. Execute novamente para tentar baixar os faltantes.');
    process.exitCode = 1;
  } else {
    console.log('[bible-import] Importação concluída. Todos os capítulos estão locais; não há chamadas externas durante a leitura.');
  }
}
main().catch(error => { console.error('[bible-import] Erro:', error); process.exitCode = 1; });
