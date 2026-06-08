# Casa Ribeiro Finanças Frontend

Frontend Vue 3 + Vite do sistema financeiro familiar Casa Ribeiro.

## Stack

- Vue 3 + TypeScript
- Vite
- Pinia
- Vue Router
- Vitest
- Playwright
- ESLint + Prettier

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

O servidor local usa `http://127.0.0.1:8181`, seguindo a porta definida no plano.
Configure `VITE_API_BASE_URL` a partir de `.env.example` quando a API não estiver em `http://127.0.0.1:8180`.

## Escopo Atual

- Dashboard migrado do template `Casa Ribeiro · Balanço.html`.
- Tema dark como padrão e light por toggle persistido em `localStorage`.
- Sidebar responsiva em drawer no mobile.
- Componentes base da fase 3: shell, topbar, seletor de mês, KPIs, donut, linha, avisos, parcelas, lançamentos e revisão de importação.
- Login por sessão HTTP-only e integração com a API NestJS.
- Dashboard, lançamentos e importação CSV consumindo backend real; dados de mock locais não são versionados.
