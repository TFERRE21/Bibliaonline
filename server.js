const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 8080);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  if(pathname.includes('..') || pathname.includes('\\')) { res.writeHead(400); return res.end('Bad request'); }
  let file=path.join(root,pathname);
  if(pathname.endsWith('/')) file=path.join(file,'index.html');
  try {
    if(!fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Não encontrado</title><h1>Página não encontrada</h1><p><a href="/">Voltar ao início</a></p></html>');}
    const body=fs.readFileSync(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Cache-Control':path.extname(file)==='.html'?'public, max-age=300':'public, max-age=86400'});
    res.end(body);
  } catch {res.writeHead(500);res.end('Erro interno');}
}).listen(port,'127.0.0.1',()=>console.log('Bíblia Online ouvindo em 127.0.0.1:'+port));
