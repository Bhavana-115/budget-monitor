# AI-Based Budget Utilization Monitoring System

A centralized platform for tracking budget allocation, expenditure, and real-time utilization across government departments, with rule-based anomaly detection for under-utilization, overspending, and abnormal transaction spikes.

Backend built with **Node.js, Express, and MongoDB** (the "MEN" of the MEAN stack). Designed to pair with an Angular frontend.

## Features

- JWT authentication with role-based access control (Admin, Finance Officer, Department Head)
- Budget allocation CRUD, scoped by department for Department Heads
- Expenditure tracking with file-upload support for supporting documents
- Real-time utilization percentage calculation (spend vs. allocation vs. time elapsed)
- Rule-based anomaly detection:
  - **Under-utilization** — e.g. under 40% spent with over 70% of the period elapsed
  - **Overspending** — spend exceeds the allocated amount
  - **Spike detection** — a single transaction disproportionately larger than the budget's typical spend
- Configurable detection thresholds (Admin API)
- Alerts dashboard with resolve/acknowledge workflow
- Aggregated dashboard endpoint for charts (department breakdown, category breakdown, monthly trend)
- CSV report export (utilization summary, raw expenditures)
- Full audit log of create/update actions across the system

## Tech Stack

- Node.js / Express.js
- MongoDB / Mongoose
- JSON Web Tokens (jsonwebtoken) + bcryptjs
- multer (file uploads), json2csv (report export), helmet + cors (security)

## Project Structure

```
budget-monitor/
├── config/           # DB connection, constants (roles, alert types, thresholds)
├── controllers/      # Route handlers / business logic
├── middleware/        # auth, role checks, error handling, uploads
├── models/            # Mongoose schemas
├── routes/             # Express routers
├── services/           # monitoringService.js — utilization & anomaly detection engine
├── utils/               # token generation, audit logging, DB seed script
├── uploads/               # uploaded supporting documents (gitignored)
├── server.js
└── package.json
```

## Getting Started

### 1. Prerequisites
- Node.js 18+
- A running MongoDB instance (local or Atlas)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# then edit .env with your MongoDB URI and a strong JWT_SECRET
```

### 4. Seed an initial admin user
```bash
npm run seed
```
This creates 3 sample departments and one Admin account:
- email: `admin@budgetmonitor.gov`
- password: `ChangeMe123!` (change immediately after first login)

### 5. Run the server
```bash
npm run dev     # with nodemon, auto-restart
# or
npm start
```
Server starts on `http://localhost:5000` by default. Health check: `GET /api/health`.

## API Overview

| Area | Endpoint | Access |
|---|---|---|
| Auth | `POST /api/auth/login` | Public |
| Auth | `POST /api/auth/register` | Admin |
| Auth | `GET /api/auth/profile` | Authenticated |
| Departments | `GET/POST /api/departments`, `PUT /api/departments/:id` | Authenticated / Admin |
| Budgets | `GET/POST /api/budgets`, `GET/PUT /api/budgets/:id` | Authenticated / Admin, Finance |
| Budgets | `GET /api/budgets/utilization/summary` | Authenticated |
| Expenditures | `GET/POST /api/expenditures`, `PUT /api/expenditures/:id` | Authenticated |
| Alerts | `GET /api/alerts`, `PATCH /api/alerts/:id/resolve`, `POST /api/alerts/scan` | Authenticated / Admin, Finance |
| Dashboard | `GET /api/dashboard/summary` | Authenticated |
| Reports | `GET /api/reports/utilization.csv`, `GET /api/reports/expenditures.csv` | Authenticated |
| Admin | `GET /api/admin/users`, `PATCH /api/admin/users/:id/status` | Admin |
| Admin | `GET/PUT /api/admin/thresholds` | Admin |
| Admin | `GET /api/admin/audit-logs` | Admin |

All authenticated routes require an `Authorization: Bearer <token>` header, obtained from `/api/auth/login`.

## Anomaly Detection Logic

Implemented in `services/monitoringService.js`:

- **Under-utilization**: flagged when `timeElapsedPercent >= threshold` (default 70%) while `utilizationPercent < threshold` (default 40%).
- **Overspending**: flagged when `utilizationPercent > 100`.
- **Spike**: flagged when a single expenditure transaction is `>= spikeMultiplier x` (default 3x) the average of prior transactions on the same budget.

Thresholds are stored in MongoDB (`ThresholdConfig`) and editable via `PUT /api/admin/thresholds`, so they can be tuned without redeploying.

## License
MIT
