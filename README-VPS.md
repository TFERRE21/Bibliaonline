# Bíblia Online — preparação para VPS

## O que está incluído
- Site responsivo e páginas institucionais
- Biblioteca inicial com 15 materiais originais: estudos, esboços, histórias bíblicas infantis, quadrinhos, desenhos para colorir, devocional, atividade e quiz
- Gerador de páginas estáticas, biblioteca com busca/filtros, página de ferramentas com quiz interativo e plano de leitura de 7 dias, ilustrações SVG originais e sitemap
- Servidor Node.js sem dependências externas
- Serviço e timer systemd para execução diária
- Geração assistida por IA opcional, com validação básica e detecção de duplicidade

## Requisitos
- Ubuntu/Debian com Node.js 20 ou superior
- Nginx ou proxy reverso com HTTPS
- Domínio apontado para o VPS
- Opcional: chave da API para ampliar a biblioteca depois de publicar os materiais iniciais

## Instalação
1. Clone o repositório para `/opt/bibliaonline`.
2. Crie a configuração local: `cp .env.example .env`.
3. Edite `.env`: configure `SITE_URL` com o domínio real. Nunca publique o arquivo `.env` nem uma chave de API no GitHub.
4. Para geração assistida por IA, configure `OPENAI_API_KEY` no VPS. A API pode gerar custos conforme uso e modelo.
5. Gere a primeira biblioteca completa: `npm run content:build`.
6. Verifique se `public/index.html`, `public/conteudo/`, `public/assets/arte/`, `public/robots.txt` e `public/sitemap.xml` foram criados.
7. Teste localmente: `npm start`. O servidor escuta em `127.0.0.1:8080`; configure Nginx e HTTPS para encaminhar o domínio a essa porta.

## Atualização diária
O timer chama `node scripts/content-engine.js` uma vez por dia e tenta publicar um item novo, atualizar o índice e reconstruir o sitemap.

Para instalar o servidor web persistente e o agendamento diário:
```bash
sudo cp deploy/bibliaonline-web.service /etc/systemd/system/
sudo cp deploy/bibliaonline-content.service /etc/systemd/system/
sudo cp deploy/bibliaonline-content.timer /etc/systemd/system/
sudo chown -R www-data:www-data /opt/bibliaonline/data /opt/bibliaonline/public
sudo systemctl daemon-reload
sudo systemctl enable --now bibliaonline-web.service
sudo systemctl enable --now bibliaonline-content.timer
systemctl status bibliaonline-web.service --no-pager
systemctl list-timers bibliaonline-content.timer
journalctl -u bibliaonline-content.service -n 100 --no-pager
```

O exemplo de Nginx está em `deploy/nginx-bibliaonline.conf.example`. Copie-o para `/etc/nginx/sites-available/bibliaonline`, substitua `SEU-DOMINIO.com.br`, habilite o site, teste com `sudo nginx -t` e recarregue o Nginx. Depois configure HTTPS com Certbot para o domínio real. Não habilite o domínio de exemplo.

O arquivo de serviço usa `/opt/bibliaonline` e o usuário `www-data`. Ajuste o caminho e garanta que esse usuário possa escrever em `data/` e `public/`. Exemplo, após conferir o caminho correto:
```bash
sudo chown -R www-data:www-data /opt/bibliaonline/data /opt/bibliaonline/public
```

## Como funciona a automação
- Na primeira instalação, `npm run content:build` publica os 12 materiais iniciais.
- A rotina diária publica o próximo item da biblioteca que ainda não foi publicado. A biblioteca inclui estudos, esboços, histórias infantis, quadrinhos, desenhos, devocional, atividades e quiz; a página `ferramentas.html` oferece quiz interativo e plano de leitura de 7 dias.
- Quando os itens iniciais acabam, o sistema tenta criar um novo rascunho com a API se `OPENAI_API_KEY` estiver configurada. Para ilustrações PNG geradas por IA em novos quadrinhos/atividades, configure `GENERATE_AI_IMAGES=true`; isso pode gerar custos adicionais. Sem essa opção, o sistema usa SVGs originais como alternativa.
- Se não houver chave ou a geração falhar na validação, o sistema registra o problema e não publica uma página nova de baixa qualidade só para aumentar a quantidade.
- A geração de quadrinhos e desenhos usa SVGs originais simples como alternativa; com `GENERATE_AI_IMAGES=true`, novos quadrinhos/atividades podem receber também ilustrações PNG geradas por IA.

## Revisão editorial e AdSense
A validação automática confere campos, estrutura mínima e duplicidade, mas não substitui revisão humana de precisão bíblica, teologia, linguagem, direitos autorais ou segurança infantil. Os textos bíblicos são indicados por referência; não são reproduzidos extensamente de traduções protegidas. Confirme a licença de qualquer tradução usada no leitor bíblico.

Os espaços de publicidade são apenas marcadores visuais, não anúncios ativos. Configure os códigos oficiais apenas conforme a conta e as políticas aplicáveis. A geração de sitemap ajuda os buscadores a descobrir URLs, mas não garante indexação nem aprovação para monetização.
