# ⚙️ IPSS — Intelligent Product Scheduling System

> **A professional, full-stack manufacturing floor scheduling, real-time machine monitoring, and predictive analytics platform built with vanilla HTML5/CSS3/JavaScript frontend and a human-written Python (FastAPI + SQLAlchemy + MySQL) backend.**

---

## 📁 System Architecture & Project Organization

```text
monir/
│
├── backend/
│   ├── main.py              # 🚀 FastAPI application, CORS & static frontend hosting
│   ├── database.py          # 🗄️ SQLAlchemy MySQL engine & session provider
│   ├── models.py            # 📊 Relational database models (Users, Products, Machines, Orders, Schedules, Activities)
│   ├── schemas.py           # 🛡️ Pydantic validation schemas
│   ├── auth.py              # 🔐 JWT creation, bcrypt password hashing & RBAC dependencies
│   ├── seed.py              # 🌱 Initial database seeder for demo accounts & master data
│   │
│   ├── routes/
│   │   ├── auth.py          # /api/auth: login, register, me, profile
│   │   ├── products.py      # /api/products: CRUD operations + RBAC checks
│   │   ├── machines.py      # /api/machines: CRUD operations + RBAC checks
│   │   ├── orders.py        # /api/orders: CRUD operations, bulk import & filtering
│   │   ├── schedules.py     # /api/schedule: generation engine & timeline
│   │   └── reports.py       # /api/reports & /api/dashboard: real MySQL aggregated metrics
│   │
│   ├── requirements.txt     # 📦 Minimal, reliable Python dependencies
│   ├── .env                 # 🔑 Database connection & JWT Secret configuration
│   └── .gitignore           # 🚫 Ignore virtual environments and .env
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
├── images/                  # 📁 Static assets & favicon
├── .gitignore               # 🚫 Git ignore rules
└── README.md                # 📖 System documentation & setup guide
```

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, Modern CSS3 (Glassmorphism, Dark/Light mode), Modern JavaScript (ES6+ `async/await` and `fetch`).
- **Backend**: Python 3, FastAPI, Pydantic, PyJWT, Bcrypt.
- **Database**: MySQL 8.0 with SQLAlchemy ORM and PyMySQL.
- **Interactive Documentation**: Swagger UI automatically available at `http://localhost:8000/docs`.

---

## 🛡️ Role-Based Access Control (RBAC)

The system strictly enforces permissions on both the client (UI routing and element hiding) and the server (FastAPI dependencies):

| Module / API | 🛡️ Administrator (`ADMIN`) | 👤 Floor Operator (`OPERATOR`) |
| :--- | :---: | :---: |
| **Landing & Login** | ✅ Full Access | ✅ Full Access |
| **Dashboard** | ✅ Full Access | ✅ View Only |
| **Products Catalog** | ✅ Add / Edit / Delete Products | 👁️ View Only Mode (Form Hidden) |
| **Machines Registry** | ✅ Full Access | ⛔ 403 Forbidden (Blocked) |
| **Production Orders** | ✅ Create / Edit / Delete / Bulk Upload | ⛔ 403 Forbidden (Blocked) |
| **Automated Scheduler** | ✅ Generate Schedule / Edit Gantt | ⛔ 403 Forbidden (Blocked) |
| **Production Reports** | ✅ View Live Metrics | ✅ View Live Metrics |
| **User Profile** | ✅ View & Edit Own Profile | ✅ View & Edit Own Profile |

---

## 🔑 Demo Credentials

| Role | Username / Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` or `admin@ipss.com` | `admin123` | Full plant management & configuration |
| **Floor Operator** | `user` or `user@ipss.com` | `user123` | Dashboard, Products (View Only), Reports, Profile |

---

## 🚀 How to Run the Application

### 1. Database Configuration
Ensure MySQL Server is running.
Create the database and configure credentials in `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/ipss_db
SECRET_KEY=ipss_jwt_production_secret_key_9889_floor_system
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 2. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Initialize & Seed Database
Run the seed script once to automatically create all tables and populate default demo users and data:
```bash
python -m backend.seed
```

### 4. Start the Application
Run the FastAPI development server:
```bash
python -m uvicorn backend.main.py:app --reload --port 8000
# Or:
python -m uvicorn backend.main:app --port 8000
```

### 5. Access the Platform
- **Application Portal:** [http://localhost:8000/index.html](http://localhost:8000/index.html) or [http://localhost:8000/login.html](http://localhost:8000/login.html)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
