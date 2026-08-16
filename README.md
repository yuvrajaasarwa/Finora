# Finora

### Personal Finance • Financial Habits • Wealth Growth

![Node.js](https://img.shields.io/badge/Node.js-v20.0+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-v4.19-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

A modern full-stack personal finance platform designed to help users understand their money, build consistent financial habits, manage savings goals, monitor investment holdings, and track long-term net worth velocity.

Developed as part of the **Unified Mentor Project**, Finora pairs traditional financial accounting with streak-based behavioral psychology—empowering users to replace restrictive budgeting with lasting money management habits.

---

## 📌 Project Overview & Problem Statement

Traditional expense trackers log transactions passively after money is already spent, failing to encourage better financial decisions. Furthermore, over 80% of strict budgets fail within 90 days due to high friction and restrictive rules.

**Finora addresses this challenge by integrating four financial pillars into a single intuitive platform:**

- **Cash Flow Awareness**: Rapid logging of income inflows and categorized expense outflows.
- **Habit-First Discipline**: Transforming savings into daily/weekly micro-habits backed by visual streak tracking.
- **Milestone Sinking Funds**: Allocating dedicated capital toward specific targets like emergency reserves or major purchases.
- **Net Worth Velocity**: Aggregating bank balances and investment holdings into a single, unified wealth growth trajectory.

---

## 🔗 Project Navigation & Links

- **🚀 Live Demo**: https://finora-zvi3.onrender.com
- **📄 Legal Documentation**: [Privacy Policy](frontend/privacy.html) • [Terms of Service](frontend/terms.html)

---

## 🖼️ Screenshots

*Screenshots of the Finora interface modules will be displayed here.*

> **Dashboard & Financial Overview**  
> *(Placeholder for Dashboard layout showing Net Worth, Monthly Cash Flow, and Category Distribution)*

> **Habit Builder & Streaks**  
> *(Placeholder for Habit Builder showing daily toggle cards and streak indicators)*

> **3-Page Printable PDF Financial Report**  
> *(Placeholder for exported PDF report pages showing summaries and insights)*

---

## ⚡ Key Features

### 🔐 Authentication & Session Authorization
- **User Registration**: Quick registration specifying display name, email, password, and preferred currency.
- **JWT Authentication**: Stateless session management using signed JSON Web Tokens (`jsonwebtoken`).
- **Protected Routes**: Client-side and server-side authorization guards preventing unauthenticated access.
- **Data Isolation**: Database queries strictly isolated to the authenticated user (`{ user_id: req.user.id }`).

### 📊 Interactive Financial Dashboard
- **Executive Summary Cards**: Instant visibility into Net Worth, Monthly Income, Monthly Expenses, Total Savings, and Savings Rate %.
- **Monthly Cash Flow Chart**: Dynamic visual comparison of earnings, spending, and net savings across customizable timeframes.
- **Category Expense Breakdown**: Doughnut chart illustrating percentage distribution across spending categories.
- **Recent Activity Stream**: Live feed of recent inflows and outflows with category badges.

### 💳 Income & Expense Tracking
- **Income Logging**: Record earnings with source labels, dates, and optional notes.
- **Expense Categorization**: Track expenses across 10 structured categories (*Food, Transport, Rent, Bills, Shopping, Entertainment, Education, Healthcare, Investment, Other*).
- **Filtering & Recalculation**: Filter entries by date or category with automatic real-time dashboard total updates.

### ⚡ Financial Habit Builder
- **Custom Habit Rules**: Define habits with target monetary amounts and frequencies (*Daily, Weekly, Monthly*).
- **Streak Calculation Engine**: Real-time algorithm computing consecutive completion streaks and monthly performance percentages.
- **Interactive Completion**: One-click completion toggles (`POST /api/habits/:id/toggle`) for specific calendar dates.

### 🎯 Savings Goals & Sinking Funds
- **Sinking Fund Creation**: Create dedicated targets for emergency funds, vacations, or equipment.
- **Contribution Allocation**: Add deposits directly to goals (`PATCH /api/goals/:id/add-money`), automatically updating target progress and saved balances.

### 📈 Investment & Asset Portfolio
- **Multi-Asset Holdings**: Track investments across Mutual Funds, Equities, Fixed Deposits, Gold, Real Estate, and Cash.
- **Unrealized P&L**: Compare invested capital against current market valuations to measure total asset returns.
- **Net Worth Aggregation**: Combines liquid bank savings and investment valuations into total net worth.

### 📉 Consolidated Analytics
- **Analytics API**: Consolidated endpoint (`GET /api/analytics/summary`) returning summary figures.
- **Spending Warnings**: Rule-based detection of elevated category spending relative to total income.

---

## ✨ What's New in Finora

### 📄 Vector PDF Financial Report Exporter (`pdfReport.js` & `robotoFont.js`)
- **Native Indian Rupee (`₹`) Symbol**: High-resolution 16-bit CID Unicode font embedding (`Identity-H` encoding) delivering native Indian Rupee (`₹`) symbol rendering across all financial figures (e.g. `₹ 1,43,000.00`).
- **Dynamic Box Heights & Margin Alignment**: Rebuilt layout engine automatically calculating text block bounds to prevent mid-word cut-offs and line clipping.
- **Aspect-Ratio Preserved Charts**: Cash flow chart snapshots capture at 1:1 crisp resolution maintaining exact canvas dimensions without squashing or distortion.
- **Page 1 — Financial Overview**: Executive Header, Net Worth summary, Cash Flow metrics, Savings Rate %, Position Highlights table, and Summary narrative.
- **Page 2 — Detailed Breakdown**: Expense category breakdown, Top 10 recent transactions, Goals progress, Habit completion summary, and embedded Cash Flow chart image snapshot.
- **Page 3 — Insights & Recommendations**: Automated rule-based insights (spending concentration warnings, savings rate benchmarks, habit tips, 12-month net worth projection), and legal financial disclaimer.

### 🍃 MongoDB Database Architecture (`Mongoose` & `mongodb-memory-server`)
- **Document-Oriented Schemas**: Fully migrated database layer from SQLite to MongoDB utilizing Mongoose ODM schemas for User, Income, Expense, Habit, HabitLog, Goal, Investment, and Feedback entities.
- **Environment Connection Flexibility**: Connects seamlessly to local MongoDB or cloud instances (MongoDB Atlas) via `MONGODB_URI`.
- **Zero-Setup Memory Fallback**: Automatically spins up an in-memory MongoDB instance (`mongodb-memory-server`) if a local MongoDB daemon is not running, ensuring instant out-of-the-box local development and automated Playwright testing.

### ⚙️ Dedicated Account Settings (`/settings.html`)
- **Profile Management**: Edit full name, email address, and phone number.
- **Financial Preferences**: Set default currency (INR ₹, USD $, EUR €, GBP £, AED, SGD), monthly income targets, and savings targets.
- **Security Controls**: In-app password change form with current password verification.
- **Data Privacy & GDPR Controls**: Quick actions to export personal data (JSON) or request account deletion.

### 🔒 Privacy & Data Controls
- **Cookie Consent Banner** (`cookieConsent.js`): Non-intrusive floating cookie banner saving user preferences.
- **JSON Data Export** (`GET /api/auth/export-data`): Export complete user datasets in structured JSON format.
- **Account Deletion** (`DELETE /api/auth/delete-account`): Permanent account and record purge.
- **Privacy-First Architecture**: No requirement to connect real bank accounts or credentials.

### 🎨 Finora Design System (`styles.css`)
- **Light-First Fintech Aesthetic**: Warm neutral background (`#F8F8F6`), crisp white surfaces (`#FFFFFF`), charcoal text (`#171717`), and restrained forest green accent (`#176B4D`).
- **Dark Theme Switcher**: Top bar button toggling between Light Mode (`☀️ Light Mode`) and Slate Dark Mode (`🌙 Dark Mode`), persisted in `localStorage` (`wealthpulse_theme`).

### 🌐 Built-in SEO Infrastructure
- **Search Optimization**: Vector `favicon.svg`, XML `sitemap.xml`, and crawler `robots.txt`.
- **IndexNow API** (`POST /api/seo/indexnow`): URL submission endpoint for search crawlers.
- **Social Graph Metadata**: Open Graph tags, Twitter Cards, and canonical URLs across all HTML pages.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Vanilla JavaScript (ES6+) | User interface, client logic, and DOM rendering |
| **Styling** | CSS3 (Design System Tokens) | Responsive fintech design, light/dark themes, CSS Grid/Flexbox |
| **Backend** | Node.js (>=20.0.0), Express.js | REST API endpoints, routing, and static file delivery |
| **Database** | MongoDB & Mongoose ODM | Document-oriented database for persistence with memory fallback |
| **Authentication** | `jsonwebtoken`, `bcryptjs` | Signed JWT tokens and password hash comparison |
| **PDF Generation** | `jsPDF`, `jspdf-autotable` | Client-side 3-page printable PDF financial report exporter |
| **Charts** | HTML5 Canvas / Chart.js | Financial visualization charts |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────┐
│                      Browser Client                       │
│  (HTML5 / Vanilla JS / CSS Tokens / jsPDF Vector Engine)  │
└─────────────────────────────┬─────────────────────────────┘
                              │
                      HTTP REST API (JSON)
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                   Express.js Backend                      │
│  ├── Middleware: auth.js (JWT Verification & Role Guard)  │
│  ├── Static File Middleware (Serves Frontend Directory)   │
│  └── REST Routers:                                        │
│      /api/auth       /api/income       /api/expenses      │
│      /api/habits     /api/goals        /api/investments   │
│      /api/analytics  /api/admin        /api/feedback      │
└─────────────────────────────┬─────────────────────────────┘
                              │
                     Mongoose Queries / ODM
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                     MongoDB Database                      │
│     (Local / Atlas / In-Memory Fallback via Mongoose)     │
└───────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
y:\wealth pulse\wealthpulse-main/
├── backend/
│   ├── db/
│   │   └── index.js          # Mongoose connection manager, memory fallback & admin seeder
│   ├── middleware/
│   │   └── auth.js           # JWT authentication & admin authorization guards
│   ├── models/
│   │   ├── expense.js        # Mongoose Expense schema
│   │   ├── feedback.js       # Mongoose Feedback schema
│   │   ├── goal.js           # Mongoose Goal schema
│   │   ├── habit.js          # Mongoose Habit & HabitLog schemas
│   │   ├── income.js         # Mongoose Income schema
│   │   ├── investment.js     # Mongoose Investment schema
│   │   └── user.js           # Mongoose User schema
│   ├── routes/
│   │   ├── admin.js          # Admin stats, user management & feedback tickets
│   │   ├── analytics.js      # Consolidated net worth & cash flow analytics
│   │   ├── auth.js           # Login, register, profile, password & GDPR endpoints
│   │   ├── expenses.js       # Expense CRUD endpoints
│   │   ├── feedback.js       # Feedback ticket submission endpoints
│   │   ├── goals.js          # Savings goals & contribution endpoints
│   │   ├── habits.js         # Habit management & streak calculation logic
│   │   ├── income.js         # Income CRUD endpoints
│   │   ├── investments.js    # Asset portfolio endpoints
│   │   └── seo.js            # IndexNow URL submission endpoint
│   ├── .env.example          # Environment variables template
│   └── server.js             # Express server entry point
├── frontend/
│   ├── Css/
│   │   └── styles.css        # Design tokens, light/dark theme rules & component layout
│   ├── JS/
│   │   ├── api.js            # API fetch utility & Indian Rupee (₹) monetary formatter
│   │   ├── cookieConsent.js  # Floating GDPR cookie consent banner
│   │   ├── layout.js         # Sidebar navigation, top bar & theme toggle manager
│   │   ├── pdfReport.js      # 3-Page printable PDF report generator
│   │   └── robotoFont.js     # Base64 embedded Roboto font for native ₹ symbol support
│   ├── admin.html            # Admin Command Panel
│   ├── analytics.html        # Wealth Analytics & Net Worth Trajectory
│   ├── dashboard.html        # Financial Dashboard
│   ├── expenses.html         # Income & Expense Tracker
│   ├── favicon.svg           # Brand SVG Favicon
│   ├── goals.html            # Savings Goals & Sinking Funds
│   ├── habits.html           # Financial Habit Builder
│   ├── index.html            # Landing Page
│   ├── investments.html      # Investment & Asset Portfolio
│   ├── login.html            # Sign In Page
│   ├── privacy.html          # Privacy Policy Legal Page
│   ├── register.html         # User Registration Page
│   ├── robots.txt            # Search Crawler Directives
│   ├── settings.html         # Account Settings & Preferences Page
│   ├── sitemap.xml           # XML Sitemap
│   └── terms.html            # Terms of Service Legal Page
├── .gitignore
├── package.json
└── README.md
```

---

## ⚡ Installation & Setup

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB** *(Optional; automatic in-memory fallback runs if local Mongo is not installed)*
- **Git**

### Step-by-Step Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. **Install Application Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=8000
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@financetrack.com
   ADMIN_PASSWORD=Admin@12345
   MONGODB_URI=mongodb://127.0.0.1:27017/wealthpulse
   ```

4. **Start the Application**:
   ```bash
   # Production mode
   npm start

   # Development mode (requires nodemon)
   npm run dev
   ```

5. **Open Browser**:
   Navigate to [http://localhost:8000](http://localhost:8000)

---

## 🔑 Environment Variables

| Variable | Description | Required | Placeholder / Default |
| :--- | :--- | :---: | :--- |
| `PORT` | Server port | Yes | `8000` |
| `JWT_SECRET` | Secret key for JWT signing | Yes | `your_jwt_secret_key_here` |
| `JWT_EXPIRES_IN` | JWT token validity duration | No | `7d` |
| `ADMIN_EMAIL` | Admin account email for auto-seeding | No | `admin@financetrack.com` |
| `ADMIN_PASSWORD` | Admin account password for auto-seeding | No | `Admin@12345` |
| `MONGODB_URI` | MongoDB connection URL | No | `mongodb://127.0.0.1:27017/wealthpulse` |

> ⚠️ **Security Warning**: Never commit your real `.env` file or production secrets to Git repositories.

---

## 🗄️ Database Collections & Auto-Seeding

Finora uses **MongoDB** managed through Mongoose ODM. If a local MongoDB instance is not running, Finora automatically initializes an in-memory MongoDB database instance (`mongodb-memory-server`).

### Mongoose Collections:
- `users`: Account identity, role (`user`/`admin`), currency, phone, and target preferences.
- `incomes`: Cash inflow transactions (`source`, `amount`, `date`, `note`).
- `expenses`: Cash outflow transactions (`category`, `amount`, `date`, `note`).
- `habits`: Habit definitions (`name`, `frequency`, `target_amount`).
- `habitlogs`: Daily habit completion records (`habit_id`, `completed_on`).
- `goals`: Sinking fund goal milestones (`title`, `target_amount`, `saved_amount`, `deadline`).
- `investments`: Portfolio assets (`asset_name`, `asset_type`, `amount_invested`, `current_value`, `date`).
- `feedbacks`: User feedback tickets (`message`, `status`).

### Administrative Auto-Seeding:
If no database record exists for `ADMIN_EMAIL`, Finora automatically seeds a default administrator user on startup.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/auth/me` | Fetch active user profile | Yes |
| `PUT` | `/api/auth/profile` | Update profile information & preferences | Yes |
| `PUT` | `/api/auth/change-password` | Change user password | Yes |
| `GET` | `/api/auth/export-data` | Download complete user data JSON | Yes |
| `DELETE` | `/api/auth/delete-account` | Permanently delete user account & data | Yes |

### Income & Expenses (`/api/income`, `/api/expenses`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/income` | List user income entries | Yes |
| `POST` | `/api/income` | Log income entry | Yes |
| `DELETE` | `/api/income/:id` | Delete income entry | Yes |
| `GET` | `/api/expenses` | List user expense entries | Yes |
| `POST` | `/api/expenses` | Log expense entry | Yes |
| `DELETE` | `/api/expenses/:id` | Delete expense entry | Yes |

### Habits (`/api/habits`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/habits` | List habits with streak calculations | Yes |
| `POST` | `/api/habits` | Create financial habit rule | Yes |
| `POST` | `/api/habits/:id/complete` | Complete habit for a specific date | Yes |
| `DELETE` | `/api/habits/:id` | Delete habit rule | Yes |

### Goals & Sinking Funds (`/api/goals`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/goals` | List savings goals | Yes |
| `POST` | `/api/goals` | Create savings goal milestone | Yes |
| `PATCH` | `/api/goals/:id/contribute` | Add deposit contribution to goal | Yes |
| `DELETE` | `/api/goals/:id` | Delete goal | Yes |

### Asset Portfolio (`/api/investments`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/investments` | List investment holdings | Yes |
| `POST` | `/api/investments` | Log asset investment | Yes |
| `PATCH` | `/api/investments/:id` | Update current market valuation | Yes |
| `DELETE` | `/api/investments/:id` | Delete asset entry | Yes |

### Analytics & Feedback (`/api/analytics`, `/api/feedback`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/analytics/summary` | Consolidated financial analytics metrics | Yes |
| `POST` | `/api/feedback` | Submit feedback ticket | Yes / Public |
| `GET` | `/api/admin/feedback` | List submitted feedback entries | Admin |

### Admin Command (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/admin/stats` | Platform-wide aggregate metrics | Admin |
| `GET` | `/api/admin/users` | List all registered accounts | Admin |
| `PATCH` | `/api/admin/users/:id/role` | Modify user role (`user`/`admin`) | Admin |
| `DELETE` | `/api/admin/users/:id` | Admin user account deletion | Admin |
| `GET` | `/api/admin/feedback` | List user feedback tickets | Admin |
| `PATCH` | `/api/admin/feedback/:id` | Update feedback ticket status | Admin |

### SEO & IndexNow (`/api/seo`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/seo/indexnow` | Submit URLs to IndexNow search crawlers | No |

---

## 🔒 Security & Data Privacy

- **Password Hashing**: Passwords stored as salted hashes using `bcryptjs` (10 rounds).
- **JWT Authorization**: Stateless HTTP Bearer authentication token guards.
- **NoSQL Injection & Data Validation**: Schema-level validation and query sanitization via Mongoose.
- **User Data Isolation**: Queries strictly isolated by user ID (`{ user_id: req.user.id }`).
- **Role-Based Admin Access**: Administrative endpoints guarded by role checks (`role === 'admin'`).
- **Privacy-Oriented Controls**: Features inspired by GDPR principles including JSON Data Export and Account Deletion.
- **Zero Bank Credentials**: No requirement to connect real bank accounts or credentials.

---

## 🗺️ User Flow Journey

```
Landing Page (index.html)
   │
   ├──► Register Account (register.html) / Sign In (login.html)
   │
   └──► Financial Dashboard (dashboard.html)
           │
           ├──► Log Inflows & Outflows ──► Income & Expenses (expenses.html)
           │
           ├──► Track Daily Habits ─────► Habit Builder (habits.html)
           │
           ├──► Sinking Funds ──────────► Savings Goals (goals.html)
           │
           ├──► Asset Valuation ────────► Asset Portfolio (investments.html)
           │
           ├──► Net Worth Velocity ─────► Wealth Analytics (analytics.html)
           │
           ├──► Account Preferences ────► Settings (settings.html)
           │
           └──► PDF Export ─────────────► Download 3-Page Financial Report (PDF)
```

---

## 📱 Responsive Design

Finora features an adaptive layout optimized for all device viewports:
- **Desktop (>=1024px)**: Fixed sidebar navigation, multi-column analytics grids, and expanded table ledgers.
- **Tablet (768px - 1023px)**: Fluid layout with responsive grid columns and scrollable data cards.
- **Mobile (<768px)**: Stacked single-column interfaces, touch-friendly interactive targets, and compact charts.

---

## 🧪 Manual Verification & Testing Checklist

Evaluators can verify Finora's core workflows using the following manual testing checklist:

- [ ] **Account Registration**: Create a new user at `/register.html`. Verify automatic login and dashboard redirect.
- [ ] **Authentication**: Log out and sign back in at `/login.html`. Verify JWT persistence.
- [ ] **Log Income & Expenses**: Navigate to `/expenses.html`. Add an income record and an expense record. Verify that Dashboard Net Worth and Savings Rate % update automatically.
- [ ] **Habit Completion**: Navigate to `/habits.html`. Create a custom habit and toggle today's completion. Verify streak calculation.
- [ ] **Goal Contribution**: Navigate to `/goals.html`. Add money to a savings goal and verify target percentage updates.
- [ ] **Asset Management**: Navigate to `/investments.html`. Log an asset holding and check Net Worth aggregation.
- [ ] **PDF Report Download**: Click **📄 Download Report (PDF)** in the top bar. Verify that a 3-page printable PDF report generates with native `₹` symbols and clean layout bounds.
- [ ] **Account Settings**: Navigate to `/settings.html`. Test updating profile info, changing password, and downloading JSON data export.
- [ ] **Admin Dashboard**: Sign in with an admin account and open `/admin.html`. Verify user directory listing and feedback resolution.

---

## 🚀 Deployment Guide

Finora is deployment-ready for platforms such as **Render**, **Vercel**, or standard Linux Node.js servers:

### Render Deployment
1. Connect repository to Render as a **Web Service**.
2. Set Build Command: `npm install`
3. Set Start Command: `node backend/server.js`
4. Set Environment Variables (`PORT`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MONGODB_URI`).

---

## ⚠️ Limitations

- **Manual Entry**: Transactions and investments are manually logged by the user to preserve total data privacy.
- **Informational Projections**: Analytics and PDF insights are mathematical rule-based projections for guidance and do not constitute licensed financial advice.

---

## 🔮 Future Roadmap

- [ ] Bank statement CSV / Excel transaction import parser.
- [ ] Recurring automated bill reminders and subscription tracking.
- [ ] Advanced Monte Carlo financial independence projections.
- [ ] Multi-currency conversion via real-time exchange rate APIs.

---

## 📄 Project Information & Credits

- **Project Name**: Finora — Financial Habit Builder & Wealth Growth Tracker
- **Developed For**: Unified Mentor Project
- **Status**: Completed & Deployment-Ready
- **License**: MIT License
