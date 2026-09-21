# ⚙️ IPSS — Intelligent Product Scheduling System

> **Full-stack manufacturing floor scheduling, real-time machine monitoring, and predictive analytics platform built with vanilla HTML5/CSS3/JavaScript frontend, Python (FastAPI + SQLAlchemy) backend, and MySQL database.**

---

## 📁 Project Architecture

```text
monir/
│
├── database/
│   └── schema.sql           # 🗄️ MySQL database schema & table definitions
│
├── backend/
│   ├── main.py              # 🚀 FastAPI application entry point & static file hosting
│   ├── database.py          # 🔌 SQLAlchemy database connection & session maker
│   ├── models.py            # 📊 Relational models (Users, Products, Machines, Orders, Schedules, Activities)
│   ├── schemas.py           # 🛡️ Pydantic validation & response schemas
│   ├── auth.py              # 🔐 JWT authentication, bcrypt password hashing & RBAC
│   ├── seed.py              # 🌱 Initial database seeder for demo accounts & master data
│   │
│   ├── routes/
│   │   ├── auth.py          # /api/auth: Login, profile, and current user
│   │   ├── products.py      # /api/products: CRUD for products catalog
│   │   ├── machines.py      # /api/machines: CRUD for machines registry
│   │   ├── orders.py        # /api/orders: CRUD, filtering, and bulk import
│   │   ├── schedules.py     # /api/schedules: Gantt timeline & auto-scheduler
│   │   └── reports.py       # /api/reports & /api/dashboard: Real-time MySQL metrics
│   │
│   ├── requirements.txt     # 📦 Python dependencies
│   ├── .env                 # 🔑 Database URL & JWT secret configuration
│   └── .env.example         # 📝 Example environment configuration
│
├── index.html               # 🌐 Landing page & system introduction
├── login.html               # 🔐 Dual-role authentication portal (Admin / Operator)
├── dashboard.html           # 📊 Master operational dashboard (KPIs, active workloads)
├── products.html            # 📦 Products catalog & unit processing configurations
├── machines.html            # 🏭 Factory machines registry & status allocations
├── orders.html              # 📋 Production orders, bulk drag-and-drop & live simulation
├── schedule.html            # 📅 Automated priority-deadline scheduler & visual Gantt chart
├── reports.html             # 📈 Real-time MySQL production analytics & utilization reports
├── profile.html             # 👤 User profile & account management
│
├── css/
│   ├── style.css            # 🎨 Core design system, theme variables & Dark Mode
│   └── login.css            # 🔒 Authentication & role switcher styles
│
├── js/
│   └── script.js            # ⚡ Dynamic REST API integration, RBAC guards & reactive UI
│
├── .env.example             # 📝 Root environment example
└── README.md                # 📖 System documentation & setup guide
```

---

## 🗄️ Relational Database Structure (MySQL)

All application data is stored in MySQL (`ipss_db`). The relational design uses clean foreign keys without duplicate columns:

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

### 1. Start MySQL Server
Make sure your local MySQL server is running:
- **Windows (Services):** Open **Services**, locate `MySQL80`, and ensure status is **Running**.
- **Or via Command Prompt / PowerShell:**
  ```powershell
  Start-Service MySQL80
  ```

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env` (and `.env` in the root folder):
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/ipss_db
SECRET_KEY=ipss_jwt_production_secret_key_9889_floor_system
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
Replace `YOUR_PASSWORD` with your actual MySQL `root` password.

### 3. Initialize the Database
You can create the tables and seed default data using either method:

**Option A — Automated Seeder (Recommended):**
```bash
python -m backend.seed
```

**Option B — MySQL Schema Import:**
```bash
mysql -u root -p ipss_db < database/schema.sql
python -m backend.seed
```

### 4. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### 5. Start the FastAPI Backend
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

### 6. Open the Application
- **Application Portal:** [http://localhost:8000/index.html](http://localhost:8000/index.html) or [http://localhost:8000/login.html](http://localhost:8000/login.html)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔍 How to View Data in MySQL Workbench

1. Open **MySQL Workbench**.
2. Connect to your local MySQL instance (port `3306`, user `root`).
3. Open a new SQL tab and run:
   ```sql
   USE ipss_db;

   SELECT * FROM users;
   SELECT * FROM products;
   SELECT * FROM machines;
   SELECT * FROM orders;
   SELECT * FROM schedules;
   SELECT * FROM activities;
   ```
4. Execute the query to view the live records persisted by the application.
