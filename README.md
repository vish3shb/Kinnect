# 🔗 Kinnect — Campus Activity Coordination Platform

A real-time campus platform for IITK students to discover, create, and join activities happening nearby. Built with **Next.js** (frontend) and **FastAPI** (backend).

---

## 📋 Prerequisites

Make sure these are installed on your system:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.10+ | [python.org](https://python.org/) |
| **Git** | any | [git-scm.com](https://git-scm.com/) |

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Clone the project

```bash
git clone <your-repo-url>
cd GOAT
```

Or just copy the `GOAT` folder to their machine.

---

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (creates/updates tables)
python migrate_db.py

# Start the backend server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

> ✅ Backend should now be running at `http://localhost:8000`
> You can verify by visiting `http://localhost:8000` — it should show `{"message": "Welcome to the Kinnect API"}`

---

### Step 3: Frontend Setup

Open a **new terminal window** (keep the backend running):

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

> ✅ Frontend should now be running at `http://localhost:3000`

---

### Step 4: Google OAuth Setup (for Login)

The app uses **Google Sign-In**. To make login work, you need Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Set Application Type to **Web Application**
6. Add these Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret**

Then create/edit the file `frontend/.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_SECRET=any-random-secret-string-here
NEXTAUTH_URL=http://localhost:3000
```

> 💡 **For testing without Google OAuth**: The app already has fallback values. If you just want to see the UI, you can skip this step, but the login button won't work without valid credentials.

---

## 📁 Project Structure

```
GOAT/
├── backend/                  # FastAPI Python Backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── activities.py # Activity CRUD, join, leave, report, notifications
│   │   │   ├── auth.py       # User authentication sync
│   │   │   ├── feed.py       # Proximity-based activity feed
│   │   │   └── sos.py        # Emergency SOS broadcasting
│   │   ├── models/
│   │   │   └── schema.py     # SQLAlchemy database models
│   │   ├── services/
│   │   │   └── db.py         # Database connection
│   │   ├── sockets/
│   │   │   └── chat.py       # WebSocket real-time chat
│   │   └── main.py           # FastAPI app entry point
│   ├── migrate_db.py         # Database migration script
│   ├── requirements.txt      # Python dependencies
│   └── kinnect.db            # SQLite database (auto-created)
│
├── frontend/                 # Next.js React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActivityCard.jsx       # Activity card with creator info
│   │   │   ├── CreateFloatModal.jsx   # Create new activity modal
│   │   │   ├── EmergencyModal.jsx     # SOS emergency broadcast
│   │   │   ├── LiveChatDrawer.jsx     # Real-time WebSocket chat
│   │   │   ├── MapFeed.jsx            # Leaflet map with markers
│   │   │   ├── MyActivitiesModal.jsx  # Hosted/Joined activities
│   │   │   ├── NotificationsModal.jsx # Notification centre
│   │   │   └── ProfileModal.jsx       # User profile
│   │   ├── pages/
│   │   │   ├── api/auth/[...nextauth].js  # Google OAuth
│   │   │   ├── dashboard.jsx  # Main feed page
│   │   │   ├── index.jsx      # Login page
│   │   │   ├── map.jsx        # Full-screen map
│   │   │   └── onboarding.jsx # Profile creation
│   │   └── styles/
│   ├── .env.local             # Environment variables (not committed)
│   ├── next.config.js         # API proxy config
│   └── package.json
│
└── README.md
```

---

## 🌐 Running on Same WiFi (Access from Phone/Other Devices)

To let others on the **same WiFi network** access the app from their phones:

### 1. Find your computer's local IP

```bash
# Windows
ipconfig
# Look for "IPv4 Address" under your WiFi adapter, e.g. 192.168.1.42

# macOS/Linux
ifconfig | grep inet
```

### 2. Start backend on all interfaces (already set up)

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Update frontend environment

Edit `frontend/.env.local` and change `NEXTAUTH_URL`:

```env
NEXTAUTH_URL=http://192.168.1.42:3000
```

### 4. Start frontend on all interfaces

```bash
npm run dev -- -H 0.0.0.0
```

### 5. Access from other devices

Others can open their browser and go to:
```
http://192.168.1.42:3000
```

> ⚠️ **Important**: Update `NEXTAUTH_URL` in `.env.local` to your IP, or Google OAuth callbacks will fail.
> Also update the Google Cloud Console redirect URIs to include `http://192.168.1.42:3000/api/auth/callback/google`.

---

## 🔧 Common Issues

| Issue | Solution |
|-------|----------|
| `npm install` fails | Make sure Node.js v18+ is installed: `node --version` |
| `pip install` fails | Make sure Python 3.10+ and pip are installed: `python --version` |
| Backend won't start | Check if port 8000 is free. Kill other processes using it. |
| Frontend shows "Loading..." forever | Make sure the backend is running on port 8000 |
| Google login doesn't work | Check your `.env.local` has valid Google OAuth credentials |
| Chat not connecting | Backend must be running. Check browser console for WebSocket errors. |
| Map not loading | Needs internet connection to load OpenStreetMap tiles |
| "CORS error" in console | Make sure backend CORS config includes your frontend URL |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion, Leaflet, SWR
- **Backend**: FastAPI, SQLAlchemy (async), SQLite, WebSockets
- **Auth**: NextAuth.js with Google OAuth
- **Real-time**: WebSockets for live group chat

---

## 📱 Features

- 🔐 Google Sign-In with profile onboarding
- 📍 Proximity-based activity feed with distance calculation
- 🗺️ Interactive map with emoji markers per activity type
- 💬 Real-time WebSocket group chat per activity
- 🔔 Notification centre (joins, leaves, disbands, approvals)
- 🆘 SOS emergency broadcast with blinking map markers
- 👥 Join modes: Quick Join & Request Access
- 🚫 Auto-ban after 5 reports (5-day ban)
- 📊 Activity limits (max 5 active per user)
- ↩️ Leave/Disband with group notifications
