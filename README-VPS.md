# Bíblia Online — preparação para VPS

## O que está incluído
- Site responsivo e páginas institucionais
- Biblioteca inicial com 15 materiais originais: estudos, esboços, histórias bíblicas infantis, quadrinhos, desenhos para colorir, devocional, atividade e quiz
- Gerador de páginas estáticas, biblioteca com busca/filtros, página de ferramentas com quiz interativo e plano de leitura de 7 dias, ilustrações SVG originais e sitemap
- Servidor Node.js sem dependências externas
- Serviço e timer systemd para execução diária
- Banco editorial local gratuito com 31 temas adicionais, publicação diária e detecção de duplicidade

## Requisitos
- Ubuntu/Debian com Node.js 20 ou superior
- Nginx ou proxy reverso com HTTPS
- Domínio apontado para o VPS


## Instalação
1. Clone o repositório para `/opt/bibliaonline`.
2. Crie a configuração local: `cp .env.example .env`.
3. Edite `.env`: configure `SITE_URL` com o domínio real. Nunca publique o arquivo `.env` nem uma chave de API no GitHub.
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
- Na primeira instalação, `npm run content:build` publica os materiais presentes em `data/content-library.json`.
- A rotina diária publica o próximo item da biblioteca que ainda não foi publicado. A biblioteca inclui estudos, esboços, histórias infantis, quadrinhos, desenhos, devocional, atividades e quiz; a página `ferramentas.html` oferece quiz interativo e plano de leitura de 7 dias.
- Quando os materiais iniciais acabam, o sistema utiliza um banco local com 32 temas adicionais, em formatos variados. Não faz chamadas externas nem exige chave de API.
- As ilustrações são SVGs originais gerados por código. São recursos simples e gratuitos, não imagens realistas produzidas por IA.
- O banco local é finito: ao esgotar os temas únicos, o robô não republica cópias automaticamente. Para manter a qualidade, é necessário revisar e adicionar novos temas originais ao banco.

## Revisão editorial e AdSense
A validação automática confere campos, estrutura mínima e duplicidade, mas não substitui revisão humana de precisão bíblica, teologia, linguagem, direitos autorais ou segurança infantil. Os textos bíblicos são indicados por referência; não são reproduzidos extensamente de traduções protegidas. Confirme a licença de qualquer tradução usada no leitor bíblico.

Os espaços de publicidade são apenas marcadores visuais, não anúncios ativos. Configure os códigos oficiais apenas conforme a conta e as políticas aplicáveis. A geração de sitemap ajuda os buscadores a descobrir URLs, mas não garante indexação nem aprovação para monetização.
