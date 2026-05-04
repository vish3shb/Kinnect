# 📖 Kinnect Project Documentation & User Manual

Welcome to **Kinnect**, your real-time campus activity coordination platform! This document serves as a comprehensive guide, containing the End-User Manual, Software Requirement Specifications (SRS), and the Developer Setup Guide.

---

# PART 1: SOFTWARE REQUIREMENT SPECIFICATION (SRS)

## 1.1 Purpose & Scope
Kinnect is a hyperlocal, real-time campus platform designed to help students discover, create, and coordinate activities (called "Floats"). It aims to bridge the gap between digital communication and physical meetups using proximity-based feeds and live mapping.

## 1.2 Tech Stack & Libraries Required
### Frontend (Client-Side)
*   **Framework:** Next.js 14, React 18
*   **Styling:** Tailwind CSS (with `clsx`, `tailwind-merge`)
*   **Maps:** Leaflet & React-Leaflet
*   **Animations:** Framer Motion
*   **Authentication:** NextAuth.js (Google OAuth)
*   **Data Fetching:** SWR (Stale-While-Revalidate)

### Backend (Server-Side)
*   **Framework:** FastAPI (Python)
*   **Database ORM:** SQLAlchemy (Async)
*   **Database Engine:** SQLite (stored in `kinnect.db`)
*   **Server:** Uvicorn
*   **Real-time:** WebSockets (native FastAPI integration)

## 1.3 System Architecture Constraints
*   **Client Architecture:** Progressive Web App (PWA) compatible, mobile-first responsive design.
*   **Communication:** REST APIs for CRUD operations; WebSockets for real-time chat and SOS broadcasts.
*   **Security:** OAuth 2.0 based authentication; stateless token validation via JWT for API endpoints.

---

# PART 2: DEVELOPER SETUP GUIDE (GITHUB REPO)

If you have downloaded or cloned this GitHub repository, follow these exact commands to get the application running on your local machine.

## Prerequisites
Before you start, ensure you have the following installed on your system:
*   **Node.js:** (v18 or higher)
*   **Python:** (v3.10 or higher)
*   **Git**

## Step 1: Backend Setup
Open a terminal and navigate to the project root directory.

```bash
# Navigate to the backend directory
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install all required Python libraries
pip install -r requirements.txt

# Run database migrations to create the SQLite tables
python migrate_db.py

# Start the FastAPI backend server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```
*The backend is now running at `http://localhost:8000`.*

## Step 2: Frontend Setup
Open a **new** terminal window (leave the backend running) and navigate to the project root.

```bash
# Navigate to the frontend directory
cd frontend

# Install all Node modules and React libraries
npm install
```

## Step 3: Environment Variables
Before starting the frontend, you must configure Google OAuth for login to work.
Create a file named `.env.local` inside the `frontend/` directory and add the following:

```env
GOOGLE_CLIENT_ID=your_google_cloud_client_id
GOOGLE_CLIENT_SECRET=your_google_cloud_client_secret
NEXTAUTH_SECRET=a_random_secure_string
NEXTAUTH_URL=http://localhost:3000
```

## Step 4: Run the Application
```bash
# Start the Next.js development server
npm run dev
```
*The frontend is now running at `http://localhost:3000`. Open this in your browser.*

---

# PART 3: END-USER MANUAL

## 📱 3.1 End-User System Requirements
*   **Browser:** A modern web browser (Google Chrome, Apple Safari, Mozilla Firefox).
*   **Location Services:** You **must** allow the browser to access your Location (GPS) for the proximity feed to work.
*   **Account:** A valid Google Account is required for sign-in.

## 🚀 3.2 Getting Started
1. Open Kinnect and tap **"Sign in with Google"**.
2. **Onboarding:** If it's your first time, select your **Hall of Residence** and type in your **Interests** (e.g., *coding, basketball*). Tap **Complete Profile**.

## 📍 3.3 Discovering Activities
Activities are called **"Floats"**.
*   **The Dashboard:** Automatically shows you activities happening nearby, calculating the real-time distance from your current location.
*   **The Map View:** Click the Map icon to see a full-screen campus map. Every active Float appears as an emoji pin.
*   **Filtering:** Use the **Filter** button to narrow down your feed by maximum distance, specific times, or join methods.

## ➕ 3.4 Creating an Activity (Floating)
1. Tap the glowing **"+"** button on your dashboard.
2. Fill out **Title, Description, and Category** (Emoji).
3. **Pick a Location:** Use the interactive map to drop a pin.
4. Set **Max Capacity** and **Time/Expiration**.
5. Select a **Join Mode**:
    *   *Open:* Anyone can join instantly.
    *   *Approval:* Users must request to join, and you must approve them.
6. Tap **Create Float**. *(Note: You can only host up to 5 active activities at a time).*

## 🤝 3.5 Joining and Communicating
*   **Joining:** Tap an activity card. If it is **Open**, tap **Join**. If it requires **Approval**, tap **Request to Join**.
*   **Chatting:** Every activity has a dedicated real-time group chat. A pulsing badge will appear on your dock for unread messages. If the creator disbands the activity, the chat closes permanently.
*   **Direct Messages:** View a user's profile, send a friend request, and once accepted, send private Direct Messages.

## 🆘 3.6 Emergency SOS System
1. Tap the red **SOS** button in the header.
2. The app immediately captures your GPS coordinates and broadcasts a blinking red alert to **all active users**.
3. Other users can tap **"Respond"** to let you know help is on the way.
4. **⚠️ Warning:** Deliberately triggering false alarms is tracked and will result in penalties on your account.

## 🛡️ 3.7 Community Guidelines & Bans
*   **Reporting:** If you see inappropriate activity, tap the **Report** button.
*   **Auto-Ban System:** If an activity receives **5 reports**, it is automatically deleted, and the creator is **banned for 5 days**.
