
# Ugnay

A  full-stack multi-tenant organization and project management system built with a Modular Monolith
architecture, demonstrating a real-world Agile-inspired SDLC.


## Stack

- **Frontend:** React, Vite, Tailwind CSS, Shadcn/ui
- **Backend:** Node.js, TypeScript, Express, PostgreSQL, Prisma, JWT, Jest
- **Infra:** Docker, GitHub Actions

## Repository layout

```
Ugnay/
├── webapp/        # React + Vite frontend
├── server/        # Express + TypeScript backend
├── database/      # ERD, seed scripts, SQL exports
├── docs/          # Requirements, architecture, API, deployment docs
├── docker/        # Dockerfiles
├── postman/       # Exported Postman collection
├── scripts/       # Dev helper scripts
├── screenshots/   # README/demo images
├── .github/       # CI workflows
└── docker-compose.yml
```

## Getting started (local development)

### Prerequisites
- Node.js LTS
- Docker Desktop
- Git

### 1. Clone and configure environment

```bash
git clone <your-repo-url>
cd Ugnay
cp .env.example .env
cp server/.env.example server/.env
cp webapp/.env.example webapp/.env
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Install dependencies

```bash
cd server && npm install
cd ../webapp && npm install
```

### 4. Run the backend

```bash
cd server
npm run dev
```

Visit `http://localhost:4000/health` — should return `{"status":"ok"}`.

### 5. Run the frontend

```bash
cd webapp
npm run dev
```

Visit `http://localhost:5173`.

## Documentation

See `docs/`

## License

MIT License

Developed by: Rujonht Garrido
Copyright (c) 2026 Ugnay

