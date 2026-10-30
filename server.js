const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 8080);
const host = '0.0.0.0';
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  if(pathname.includes('..') || pathname.includes('\\')) { res.writeHead(400); return res.end('Bad request'); }
  let file=path.join(root,pathname);
  if(pathname.endsWith('/')) file=path.join(file,'index.html');
  try {
    if(!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      const notFound=path.join(root,'404.html');
      res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
      if(fs.existsSync(notFound)) return res.end(fs.readFileSync(notFound));
      return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Não encontrado | Conecta Bíblia</title><h1>Página não encontrada</h1><p><a href="/">Voltar ao início</a></p></html>');
    }
    const body=fs.readFileSync(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Cache-Control':path.extname(file)==='.html'?'public, max-age=300':'public, max-age=86400'});
    res.end(body);
  } catch {res.writeHead(500);res.end('Erro interno');}
}).listen(port,host,()=>{
  console.log('Conecta Bíblia ouvindo em '+host+':'+port);
  // Importa o corpus bíblico em segundo plano para não atrasar a abertura do site.
  // O importador preserva os capítulos já baixados e pode ser executado novamente.
  const corpusRoot = path.join(root, 'biblia', 'pt');
  const sourceFile = path.join(corpusRoot, 'source.json');
  let needsImport = !fs.existsSync(sourceFile);
  if (!needsImport) {
    try {
      const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
      needsImport = Number(source.downloadedChapters) < Number(source.expectedChapters) ||
        (Array.isArray(source.failedChapters) && source.failedChapters.length > 0);
    } catch { needsImport = true; }
  }
  if (needsImport) {
    console.log('[bible-import] Corpus ausente ou incompleto; iniciando importação em segundo plano.');
    const importer = spawn(process.execPath, [path.join(__dirname, 'scripts', 'import-bible.js')], {
      cwd: __dirname, stdio: 'inherit', env: process.env
    });
    importer.on('error', error => console.error('[bible-import] Não foi possível iniciar:', error.message));
    importer.on('exit', code => console.log('[bible-import] Processo finalizado com código', code));
  } else {
    console.log('[bible-import] Corpus local completo:', sourceFile);
  }
});
