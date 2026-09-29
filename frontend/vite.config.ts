import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import https from 'node:https';

function gigachatDevPlugin(): Plugin {
  let cachedToken = '';
  let tokenExpires = 0;

  const post = (url: string, headers: Record<string, string>, body: string) => {
    return new Promise<any>((resolvePromise, reject) => {
      const req = https.request(url, { method: 'POST', headers, rejectUnauthorized: false }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolvePromise(JSON.parse(data));
          } catch (e) {
            resolvePromise({ raw: data });
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };

  const getToken = async () => {
    if (Date.now() < tokenExpires && cachedToken) return cachedToken;
    const authData = process.env.GIGACHAT_AUTH_DATA || 'MDFhMGRkOGQtYzhiYS03ZDRlLThjYzctYWU1NDYwMzgwNmJlOmMxY2IzNWVlLTdjMzItNGNlZC05YWRmLWNiMWE2OWFhYWE2MQ==';
    const oauth = await post('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'RqUID': '6f0b1291-c7f3-4cb4-971e-a61622243e1f',
      'Authorization': 'Basic ' + authData
    }, 'scope=GIGACHAT_API_PERS');

    if (oauth && oauth.access_token) {
      cachedToken = oauth.access_token;
      tokenExpires = Date.now() + 25 * 60 * 1000;
      return cachedToken;
    }
    throw new Error('Failed to get GigaChat token');
  };

  const askGigaChat = async (systemPrompt: string, userText: string) => {
    const token = await getToken();
    const comp = await post('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }, JSON.stringify({
      model: 'GigaChat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ]
    }));
    return comp?.choices?.[0]?.message?.content || 'Не удалось получить ответ от GigaChat.';
  };

  return {
    name: 'gigachat-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        // Handle chat with AI
        if (req.url.match(/\/api\/bills\/[^/]+\/chat/)) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const reply = await askGigaChat(
                'Ты умный помощник ЖКХ в мобильном приложении "СмартХаус". Квитанция за ноябрь 2024 на сумму 5100 руб (отопление 2805, вода 1275, свет 1020). Отвечай дружелюбно, полезно и по факту на любые вопросы жильца.',
                parsed.message || ''
              );
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reply }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reply: 'Ошибка связи с GigaChat: ' + err.message }));
            }
          });
          return;
        }

        // Handle AI analysis
        if (req.url.match(/\/api\/bills\/[^/]+\/ai-analysis/)) {
          try {
            const summary = await askGigaChat(
              'Ты аналитик ЖКХ.',
              'Проанализируй квитанцию на 5100 руб (ноябрь 2024). Назови основные статьи и дай 1 совет по экономии. Объем 2-3 предложения.'
            );
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ summary }));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ summary: 'Счет за ноябрь — 5 100 ₽. Основная статья: отопление (55%) и вода (25%).' }));
          }
          return;
        }

        // Handle improve text for UK
        if (req.url === '/api/ai/improve-text') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            let parsedText = '';
            try {
              const parsed = JSON.parse(body || '{}');
              parsedText = parsed.text || '';
              const improved = await askGigaChat(
                'Ты редактор объявлений для управляющей компании ЖКХ. Сделай текст вежливым, четким и понятным жильцам.',
                parsedText
              );
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ improved }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ improved: parsedText }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), gigachatDevPlugin()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
});
