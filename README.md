# ☁️ Cloud-Powered Virtual Coding Lab

> A complete cloud-based virtual programming environment built with **React.js + FastAPI + Docker + SQLite**  
> Based on your Phase 1 project report — ready to run!

---

## 📁 Project Structure

```
cloud-lab/
├── backend/
│   ├── main.py              ← FastAPI app (ALL routes, WebSocket, DB)
│   ├── requirements.txt     ← Python dependencies
│   ├── lab.db               ← SQLite database (auto-created)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.js           ← Root + global styles + auth context
│   │   └── pages/
│   │       ├── WelcomePage.js     ← Landing + Login + Register
│   │       ├── StudentDashboard.js ← Code editor + courses + history
│   │       └── AdminDashboard.js  ← Live tracking + analytics + management
│   ├── public/index.html
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── setup.sh / setup.bat     ← One-time setup
├── run.sh / run.bat         ← Start both servers
└── README.md
```

---

## ⚡ Quick Start — VS Code Step-by-Step

### Prerequisites
Install these first:
- [Node.js 18+](https://nodejs.org) (includes npm)
- [Python 3.10+](https://www.python.org/downloads/)
- [VS Code](https://code.visualstudio.com)

Optional (for multi-language support):
- GCC/G++ for C/C++ → Linux: `sudo apt install gcc g++` | Windows: [MinGW](https://www.mingw-w64.org/)
- Java → [JDK 17](https://adoptium.net/)

---

### 🖥️ Method 1: VS Code Terminal (Recommended)

#### Step 1 — Open Project in VS Code
```
File → Open Folder → Select the cloud-lab folder
```

#### Step 2 — Open TWO Terminals in VS Code
```
Terminal → New Terminal   (first terminal)
Terminal → Split Terminal (second terminal)
```

---

#### Step 3 — Terminal 1: Start Backend

**On Linux/Mac:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**On Windows:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

✅ You should see: `Uvicorn running on http://0.0.0.0:8000`

---

#### Step 4 — Terminal 2: Start Frontend

```bash
cd frontend
npm install
npm start
```

✅ Browser opens automatically at **http://localhost:3000**

---

### 🪟 Method 2: Windows — Double Click

1. Double-click `setup.bat` → installs everything
2. Double-click `run.bat` → opens two CMD windows

---

### 🐧 Method 3: Linux/Mac — Shell Scripts

```bash
chmod +x setup.sh run.sh
bash setup.sh    # one-time setup
bash run.sh      # start everything
```

---

## 🌐 URLs After Starting

| Service | URL |
|---------|-----|
| 🎓 Frontend (App) | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:8000 |
| 📖 API Docs (Swagger) | http://localhost:8000/docs |
| 🔌 WebSocket (Admin) | ws://localhost:8000/ws/admin |

---

## 🔑 Demo Login Credentials

### Student Login
| Field | Value |
|-------|-------|
| Name | `Jayasri` |
| Email | `jay21@gmail.com` |

Other students: Rahul Kumar / rahul@gmail.com, Priya Sharma / priya@gmail.com

### Admin Login
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

---

## 📋 Features Implemented

### Student Side
- [x] Welcome / Landing page
- [x] Student login (name + email)
- [x] Student registration
- [x] Semester selection (I–VIII)
- [x] Subject/course browser
- [x] **Multi-language code editor** (Python, C, C++, Java)
- [x] **Real code execution** via subprocess
- [x] Live output display with status
- [x] Keyboard shortcut: `Ctrl+Enter` to run
- [x] Submission history log

### Admin Side
- [x] Admin login (username + password)
- [x] **Real-time WebSocket live tracking**
- [x] Active sessions monitor
- [x] Live event feed (code runs, logins)
- [x] Student CRUD (Add / Delete)
- [x] Analytics dashboard
- [x] Language usage bar chart + pie chart
- [x] Top students leaderboard
- [x] Daily activity line chart

### Backend / Infrastructure
- [x] FastAPI REST API
- [x] SQLite database with seeded data
- [x] WebSocket endpoint for admin live tracking
- [x] Code execution engine (Python/C/C++/Java)
- [x] Session management
- [x] Docker-ready (Dockerfile + docker-compose)
- [x] CORS enabled for development

---

## 🗃️ Database Schema

```sql
departments (id, name)
subjects    (id, name, department_id, semester)
students    (id, name, email, register_number, department_id, semester)
admins      (id, username, password)
code_submissions (id, student_id, language, code, output, status, execution_time)
active_sessions  (id, student_id, student_name, started_at, last_activity, language, status)
```

---

## 🐳 Docker Deployment (Cloud)

```bash
docker-compose up --build
```

Access at http://localhost:3000

---

## 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` in venv |
| `npm not found` | Install Node.js from nodejs.org |
| Port 8000 busy | Kill process: `lsof -ti:8000 \| xargs kill` |
| CORS error | Backend must be running on port 8000 |
| C/C++ not executing | Install gcc: `sudo apt install gcc g++` |
| Python not found | Use `python` instead of `python3` on Windows |

---

## 🚀 Future Enhancements (Phase 2)
- Docker container per-user isolation
- Kubernetes orchestration
- AI code review
- LMS integration (Moodle/Google Classroom)
- VR lab module
- JWT authentication
- Real-time collaborative editing

---

*Built with ❤️ for Phase 1 Final Year Project — Cloud-Powered Virtual Coding Lab*
