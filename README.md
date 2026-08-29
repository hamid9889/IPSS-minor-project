# ⚙️ IPSS — Intelligent Product Scheduling System

> **A professional, AI-driven manufacturing floor scheduling, real-time machine monitoring, and predictive analytics platform built with vanilla HTML5, CSS3, and modern JavaScript (ES6+).**

---

## 📁 Project Architecture & File Organization

```text
monir/
│
├── index.html              # 🌐 Public Landing Page & Feature Overview
├── login.html              # 🔐 Dual-Role Authentication Portal (Admin / Operator Switcher)
├── dashboard.html          # 📊 Master Dashboard (KPIs, Active Workloads, System Health)
├── products.html           # 📦 Products Catalog & Master Unit Processing Configurations
├── machines.html           # 🏭 Factory Machines Registry, Status & Capacity Allocations
├── orders.html             # 📋 Production Orders Management, CSV Import & Live Analysis Engine
├── schedule.html           # 📅 Automated Scheduling Engine & Visual Gantt Timeline
├── reports.html            # 📈 Production Reports, Utilization Analytics & PDF/Print Summary
├── profile.html            # 👤 User Profile Management (Admin & Floor Operator Sync)
│
├── css/
│   ├── style.css           # 🎨 Core Design System, Glassmorphism, Theme Variables & Dark Mode
│   └── login.css           # 🔒 Authentication & Role Switcher Styles
│
├── js/
│   └── script.js           # ⚡ Application Logic, RBAC Guards, Scheduling Engine & LocalStorage CRUD
│
├── images/
│   ├── favicon.svg         # 🏷️ IPSS SVG Brand Logo & Favicon
│   └── .gitkeep            # 📁 Static Asset Directory
│
└── README.md               # 📖 System Documentation & Architecture Guide
```

---

## 🛡️ Role-Based Access Control (RBAC)

The application supports **Role-Based Access Control** with dynamic sidebar rendering and route guards:

| Feature / Module | 🛡️ Administrator Role | 👤 Floor Operator Role |
| :--- | :---: | :---: |
| **Landing & Login Switcher** | ✅ Full Access | ✅ Full Access |
| **Dashboard Overview** | ✅ Full Access | ✅ View Only |
| **Products Catalog** | ✅ Add / Edit / Delete Master Products | 👁️ View Only Mode |
| **Machines Registry** | ✅ Full Machine Config & Status | ⛔ Restricted (Blocked) |
| **Orders & CSV Engine** | ✅ Create / Edit / Delete / Analyze Orders | ⛔ Restricted (Blocked) |
| **Automated Scheduler & Gantt** | ✅ Full Engine & Gantt Controls | ⛔ Restricted (Blocked) |
| **Production Reports** | ✅ Full Reports & Metrics View | ✅ Full Reports View |
| **Profile Management** | ✅ Edit Admin Profile | ✅ Edit Operator Profile |

---

## 🔑 Demo Credentials

| Role | Username / Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` or `admin@ipss.com` | `admin123` | Full plant management & configuration |
| **Floor Operator** | `user` or `user@ipss.com` | `user123` | View Dashboard, Products, Reports & Profile |

---

## 🚀 How to Run Locally

1. Open your terminal in the project directory:
   ```bash
   cd c:\Users\Dell\OneDrive\Desktop\monir
   ```

2. Start a lightweight local HTTP server (Python or Node.js):
   ```bash
   # Using Python 3:
   python -m http.server 3000

   # Or using Node.js npx:
   npx serve . -p 3000
   ```

3. Open your browser and navigate to:
   - **Landing Page:** `http://localhost:3000/index.html`
   - **Login Portal:** `http://localhost:3000/login.html`

---

## 🌟 Key Technical Highlights

- **Zero External Dependencies:** Built with pure Vanilla HTML5, CSS3, and ES6+ JavaScript for maximum performance, portability, and zero build overhead.
- **Dark Mode Engine:** Theme state persisted across sessions with smooth CSS transitions.
- **Client-Side Storage Engine:** Full multi-table relational persistence using `localStorage` with fallback migration support.
- **Reactive UI & Dynamic Route Guards:** Unauthorized URL access is automatically intercepted and redirected with toast notifications.
