#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/bibliaonline}"
REPO_URL="${REPO_URL:-https://github.com/TFERRE21/Bibliaonline.git}"
SERVICE_USER="${SERVICE_USER:-www-data}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root: sudo bash deploy/install-vps.sh"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale Node.js 20+ antes de continuar."
  exit 1
fi
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( NODE_MAJOR < 20 )); then
  echo "Node.js 20+ é obrigatório. Versão atual: $(node --version)"
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo "Git não encontrado. Instale git antes de continuar."
  exit 1
fi

if [[ -d "$APP_DIR/.git" ]]; then
  echo "[1/6] Atualizando repositório existente em $APP_DIR"
  git -C "$APP_DIR" pull --ff-only
elif [[ -e "$APP_DIR" ]]; then
  echo "ERRO: $APP_DIR existe, mas não é um clone Git. Nada foi apagado."
  echo "Faça backup e ajuste APP_DIR para o caminho correto."
  exit 1
else
  echo "[1/6] Clonando repositório em $APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Arquivo .env criado. Edite SITE_URL para o domínio real antes de publicar."
fi

if ! grep -q '^SITE_URL=https\?://' .env || grep -q 'SEU-DOMINIO.com.br' .env; then
  echo "ATENÇÃO: configure SITE_URL no arquivo $APP_DIR/.env com o domínio real."
  echo "O site não deve ser publicado usando o domínio de exemplo."
fi

mkdir -p data public
echo "[2/6] Gerando páginas, ilustrações SVG, robots.txt e sitemap"
npm run content:build

echo "[3/6] Instalando unidades systemd"
install -m 0644 deploy/bibliaonline-web.service /etc/systemd/system/bibliaonline-web.service
install -m 0644 deploy/bibliaonline-content.service /etc/systemd/system/bibliaonline-content.service
install -m 0644 deploy/bibliaonline-content.timer /etc/systemd/system/bibliaonline-content.timer

echo "[4/6] Ajustando permissões de escrita do motor editorial"
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/data" "$APP_DIR/public"

echo "[5/6] Habilitando servidor e agendamento diário"
systemctl daemon-reload
systemctl enable --now bibliaonline-web.service
systemctl enable --now bibliaonline-content.timer

echo "[6/6] Verificando serviços"
systemctl --no-pager --full status bibliaonline-web.service || true
systemctl --no-pager list-timers bibliaonline-content.timer || true

echo
echo "Instalação local concluída. O agendamento foi habilitado; confira o domínio e configure Nginx/HTTPS."
echo "Teste o motor com: systemctl start bibliaonline-content.service"
echo "Veja logs com: journalctl -u bibliaonline-content.service -n 100 --no-pager"
echo "IMPORTANTE: este script não altera Nginx nem DNS e não confirma acesso público ao site."
