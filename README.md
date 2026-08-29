# ProcessSafe MOC

Management of change, HAZOP, pre-startup review, and corrective-action control.

Full React, Node/Express, PostgreSQL, and OpenRouter implementation with 5 native business capabilities, 10 stateful domain decisions, 8 specialized AI workflows, 12 physical domain tables, 300 seeded records, reports, clickable audit history, integration controls, three local roles, and three full-field scenario fillers per AI feature.

## Configure and run

```bash
./start.sh
```

Open <http://127.0.0.1:4532>. `start.sh` automatically loads the protected portfolio-level `../.openrouter.env` file, then an optional app-local `.env` override. It creates the local PostgreSQL database when needed, runs migrations, preserves existing seeded data, starts the Node API on `5532`, and starts Vite on `4532`.

## Validate

```bash
node scripts/validate_app.mjs
node scripts/smoke_test.mjs
```

Both `.env` files are ignored. OpenRouter is called only from the backend; the API key is never sent to React.
