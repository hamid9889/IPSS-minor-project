# ⚙️ IPSS — Intelligent Product Scheduling System

> **Full-stack manufacturing floor scheduling, real-time machine monitoring, and production analytics platform built with vanilla HTML5/CSS3/JavaScript frontend, Python (FastAPI) backend, and Supabase (PostgreSQL) database.**

---

## 📁 Project Architecture

```text
IPSS-minor-project/
│
├── backend/
│   ├── main.py              # 🚀 FastAPI application entry point & static file hosting
│   ├── database.py          # 🔌 Direct Supabase client setup (clean & dependency-free)
│   ├── models.py            # 📊 Schema documentation & data definitions
│   ├── schemas.py           # 🛡️ Pydantic validation & response schemas
│   ├── auth.py              # 🔐 JWT authentication, bcrypt password hashing & RBAC
│   ├── seed.py              # 🌱 Initial database seeder for demo accounts & starter data
│   │
│   ├── routes/
│   │   ├── auth.py          # /api/auth: Login, profile, and current user
│   │   ├── products.py      # /api/products: CRUD for products catalog
│   │   ├── machines.py      # /api/machines: CRUD for machines registry
│   │   ├── orders.py        # /api/orders: CRUD, filtering, and bulk import
│   │   ├── schedules.py     # /api/schedules: Gantt timeline & auto-scheduler
│   │   └── reports.py       # /api/reports & /api/dashboard: Real-time Supabase metrics
│   │
│   ├── requirements.txt     # 📦 Python dependencies
│   ├── .env                 # 🔑 Database URL, Supabase key & JWT secret configuration
│   └── .env.example         # 📝 Example environment configuration
│
├── index.html               # 🌐 Landing page & system introduction
├── login.html               # 🔐 Dual-role authentication portal (Admin / Operator)
├── dashboard.html           # 📊 Master operational dashboard (KPIs, active workloads)
├── products.html            # 📦 Products catalog & unit processing configurations
├── machines.html            # 🏭 Factory machines registry & status allocations
├── orders.html              # 📋 Production orders, bulk drag-and-drop & live simulation
├── schedule.html            # 📅 Automated priority-deadline scheduler & visual Gantt chart
├── reports.html             # 📈 Real-time production analytics & utilization reports
├── profile.html             # 👤 User profile & account management
│
├── css/
│   ├── style.css            # 🎨 Core design system, theme variables & Dark Mode
│   └── login.css            # 🔒 Authentication & role switcher styles
│
├── js/
│   └── script.js            # ⚡ Dynamic REST API integration, RBAC guards & reactive UI
│
├── .env.example             # 📝 Root environment example template
└── README.md                # 📖 System documentation & setup guide
```

---

## 🗄️ Relational Database Structure (Supabase PostgreSQL)

All application data is securely persisted in Supabase PostgreSQL. The relational design uses clean foreign keys without duplicate columns:

* **users → orders**: `orders.user_id` references `users.id` (tracks which user created the order)
* **products → orders**: `orders.product_id` references `products.id` (`ON DELETE CASCADE`)
* **orders → schedules**: `schedules.order_id` references `orders.id` (`ON DELETE CASCADE`)
* **machines → schedules**: `schedules.machine_id` references `machines.id` (`ON DELETE CASCADE`)

### Tables Overview:
1. `users` — User credentials (bcrypt hashed), roles (`ADMIN`, `OPERATOR`), and profile details.
2. `products` — Master manufactured catalog items, unit processing time, preferred production lines.
3. `machines` — Factory equipment, capacity (units/day), and status (`Available`, `Working`, `Maintenance`).
4. `orders` — Production batch requests, quantities, deadlines, priorities (`High`, `Medium`, `Low`), and status.
5. `schedules` — Optimized timeline allocations with `start_time`, `end_time`, `priority`, and status.
6. `activities` — Real-time event and audit log entries.

---

## 🔑 Demo Credentials

| Role | Username / Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` or `admin@ipss.com` | `admin123` | Full plant management, CRUD & scheduling |
| **Floor Operator** | `user` or `user@ipss.com` | `user123` | Dashboard, Products (View Only), Reports, Profile |

---

## 🚀 Setup & Run Instructions

### 1. Configure Environment Variables
Ensure `.env` in the root project folder contains your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-role-key
SECRET_KEY=ipss_jwt_production_secret_key_9889_floor_system
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 2. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. (Optional) Seed Starter Data
If your Supabase tables are fresh and empty, run the automatic seeder to insert default demo users, products, machines, and orders:
```bash
python -m backend.seed
```

### 4. Start the FastAPI Backend
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

### 5. Open the Application
- **Application Portal:** [http://localhost:8000/index.html](http://localhost:8000/index.html) or [http://localhost:8000/login.html](http://localhost:8000/login.html)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔍 How to View Data in Supabase

1. Open your **Supabase Dashboard** at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to the **Table Editor** on the left menu.
3. Select any table to inspect live records:
   - `users`
   - `products`
   - `machines`
   - `orders`
   - `schedules`
   - `activities`
4. Any operation executed on the frontend UI will immediately reflect in the Supabase Table Editor.
