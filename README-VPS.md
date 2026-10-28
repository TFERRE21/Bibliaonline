# Bíblia Online — preparação para VPS

## Requisitos
- Ubuntu/Debian com Node.js 20 ou superior
- Nginx ou outro proxy reverso com HTTPS
- Domínio apontado para o VPS
- Opcional: chave da API de geração de conteúdo para ampliar a biblioteca após esgotar os itens iniciais

## Instalação
1. Copie o projeto para o VPS e entre na pasta.
2. Copie `.env.example` para `.env` e preencha `SITE_URL` com o domínio real.
3. Se usar geração assistida por IA, configure `OPENAI_API_KEY` somente no VPS. Nunca comite a chave no Git.
4. Execute `npm run content:publish` para publicar o primeiro item e construir o sitemap.
5. Execute `npm start` para servir os arquivos de `public/` localmente em 127.0.0.1:8080.
6. Configure Nginx + HTTPS para encaminhar o domínio para 127.0.0.1:8080.

## Atualização automática diária
Instale o arquivo `deploy/bibliaonline-content.service` e o timer correspondente em `deploy/` em `/etc/systemd/system/`, ajuste o caminho do projeto no serviço e execute:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bibliaonline-content.timer
systemctl list-timers bibliaonline-content.timer
```
O timer publica um item por execução, atualiza a biblioteca e reconstrói o sitemap. Sem chave de IA, ele usa apenas a biblioteca editorial existente e para de criar itens quando ela se esgota. Com chave, tenta redigir um novo item, valida campos e duplicidade e só então publica. Isso não substitui revisão humana, verificação teológica, direitos autorais ou políticas de publicidade.

## Estrutura
- `data/content-library.json`: materiais originais iniciais
- `scripts/content-engine.js`: gerador de páginas, arte SVG, índice e sitemap
- `public/conteudo/`: páginas estáticas geradas
- `public/assets/arte/`: ilustrações originais SVG
- `server.js`: servidor HTTP simples para uso atrás de Nginx
- `deploy/`: unidades systemd para execução agendada

## Publicidade e indexação
Os espaços de publicidade são marcadores visuais, não anúncios ativos. Insira o código oficial do AdSense apenas após aprovação/configuração da conta, seguindo as políticas. O sitemap informa URLs ao buscador, mas não garante indexação. Confirme os dados estruturados e URLs canônicas no domínio real antes da publicação.
