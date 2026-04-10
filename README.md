# Uptime Monitor

Sistema de monitoreo de URLs de alto rendimiento con Node.js y TypeScript.

## Estructura

```
uptime-monitor/
├── src/
│   ├── config/index.ts      # Configuración centralizada
│   ├── models/types.ts      # Tipos TypeScript
│   ├── routes/api.ts        # API REST
│   ├── services/
│   │   ├── database.ts      # SQLite (sql.js)
│   │   ├── monitor.ts      # HTTP checks
│   │   ├── notifications.ts # Telegram + Discord
│   │   └── scheduler.ts    # Cron jobs
│   └── index.ts            # Entry point
├── data/                   # SQLite database (auto-generada)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
cd uptime-monitor
npm install
```

## Configuración

1. Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

2. Edita `.env` con tus credenciales:

```env
# Telegram (opcional)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
TELEGRAM_CHAT_ID=987654321

# Discord Webhook (opcional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Intervalo de checks en minutos
CHECK_INTERVAL_MINUTES=5
REQUEST_TIMEOUT_MS=10000
PORT=3000
```

## Uso

```bash
# Desarrollo
npm run dev

# Producción
npm run build && npm start
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/urls` | Lista de URLs monitoreadas |
| POST | `/api/urls` | Agregar URL `{"url": "https://ejemplo.com", "name": "Mi sitio"}` |
| GET | `/api/stats?days=7` | Porcentaje de uptime (últimos 7 días) |
| GET | `/api/urls/:id/checks` | Historial de checks |
| POST | `/api/check/:id` | Forzar check manual |

## Ejemplos con curl

```bash
# Agregar URL
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com", "name": "Google"}'

# Ver stats
curl http://localhost:3000/api/stats

# Ver URLs
curl http://localhost:3000/api/urls
```

## Notificaciones

### Telegram Bot

1. Crea un bot vía [@BotFather](https://t.me/BotFather)
2. Obtén tu Chat ID de [@userinfobot](https://t.me/userinfobot)
3. Agrega `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` a `.env`

### Discord Webhook

1. En Discord: Server Settings > Integrations > Webhooks
2. Crea un webhook y copia la URL
3. Agrega `DISCORD_WEBHOOK_URL` a `.env`

## Servicio Systemd (Linux)

```bash
sudo nano /etc/systemd/system/uptime-monitor.service
```

```ini
[Unit]
Description=Uptime Monitor
After=network.target

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/home/tu_usuario/uptime-monitor
ExecStart=/home/tu_usuario/uptime-monitor/node_modules/.bin/ts-node src/index.ts
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable uptime-monitor
sudo systemctl start uptime-monitor
sudo systemctl status uptime-monitor
```

## Ver logs

```bash
journalctl -u uptime-monitor -f
```
