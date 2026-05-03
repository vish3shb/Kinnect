# 📂 Kinnect Codebase Walkthrough

This document is your ultimate cheat sheet for the codebase. If the judges point to a random file and ask "What does this do?", you can find the exact answer here.

---

## 🟢 BACKEND FOLDER (`/backend`)
*This is the brain of your app. It handles the database, real-time chats, and logic.*

### Root Backend Files
*   `main.py` (inside `/src`): The main entry point. It starts the FastAPI server, connects to the database, and registers all the API routes.
*   `migrate_db.py`: A utility script. You run this once to create all the empty tables in the SQLite database based on your schema.
*   `requirements.txt`: The list of Python libraries needed (FastAPI, Uvicorn, SQLAlchemy). Like a grocery list for the server.
*   `kinnect.db`: The actual SQLite database file where all your data lives locally.
*   `render.yaml`: Configuration file for deploying the backend to the cloud provider 'Render'.
*   `export_data.py`: The script we created to export your SQLite database into CSV Excel files.

### `/src/models`
*   `schema.py`: Extremely important. It defines the structure of your database tables (Users, Activities, ChatMessages). It uses SQLAlchemy to translate Python classes into actual SQL tables.

### `/src/services`
*   `db.py`: Manages the connection to the SQLite database. It provides a "session" so other files can read/write data safely.

### `/src/api` (The API Routes)
*   `auth.py`: Handles login. When the frontend says "Hey, this Google user logged in," this file checks the database and creates their profile if they are new.
*   `activities.py`: The biggest file. Handles Creating, Joining, Leaving, Disbanding, and Reporting activities (Floats).
*   `feed.py`: The algorithm file. It takes the user's GPS coordinates and calculates the distance to all active floats, returning only the ones nearby.
*   `friends.py`: Manages sending, accepting, and declining friend requests, as well as Direct Messages.
*   `sos.py`: Handles the Emergency SOS logic. When triggered, it logs the GPS coordinates and tracks when someone resolves the emergency.

### `/src/sockets`
*   `chat.py`: The Real-Time engine. It uses WebSockets to keep an open connection between the server and the phones. When someone types a message, this file instantly broadcasts it to everyone else in that specific activity without them needing to refresh the page.

---

## 🔵 FRONTEND FOLDER (`/frontend`)
*This is the face of your app. It is built with Next.js (React) and runs in the browser.*

### Root Frontend Files
*   `package.json`: The Node.js version of `requirements.txt`. It lists all the React libraries (Tailwind, Leaflet, Framer Motion).
*   `next.config.js`: Configuration for Next.js. It contains the "proxy" setup that allows your frontend (`localhost:3000`) to seamlessly talk to your backend (`localhost:8000`).
*   `tailwind.config.js` & `postcss.config.js`: The styling engines. They convert your Tailwind classes (like `bg-blue-500`) into actual CSS.
*   `.env.local`: Your secret file. It holds your Google OAuth Client IDs and passwords.

### `/src/pages` (The Screens)
*   `_app.jsx`: The root wrapper for every page. It sets up global things like Authentication tracking (NextAuth) and layout styling.
*   `index.jsx`: The Landing Page. The very first screen the user sees with the "Sign in with Google" button.
*   `dashboard.jsx`: The main app screen. It fetches your location, gets the proximity feed from the backend, and displays the `MapFeed` and `ActivityCards`.
*   `onboarding.jsx`: The screen new users are forced into to pick their Hall of Residence and Interests.
*   `map.jsx`: A full-screen version of the interactive map.
*   `/api/auth/[...nextauth].js`: The magic file that handles all the complex Google Login security handshakes automatically.

### `/src/components` (The Building Blocks)
*These are reusable puzzle pieces that make up the pages.*

**Main UI Components:**
*   `MapFeed.jsx`: The interactive Leaflet map that displays emojis where activities are happening.
*   `ActivityCard.jsx`: The visual card in the feed showing an event's title, time, capacity, and distance.

**Modals (Pop-ups):**
*   `CreateFloatModal.jsx`: The form where users type the details and pick a location to host a new activity.
*   `LocationPicker.jsx`: A mini-map inside the Create form used specifically to drop a pin.
*   `FilterModal.jsx`: The pop-up to change your feed settings (e.g., "Only show activities within 1km").
*   `EmergencyModal.jsx`: The big red button pop-up that confirms if you want to trigger an SOS.
*   `NotificationsModal.jsx`: The dropdown showing who joined your float or sent a friend request.
*   `ProfileModal.jsx` & `UserProfileModal.jsx`: Displays a user's details, avatar, and allows sending friend requests.
*   `MyActivitiesModal.jsx`: Shows a list divided into "Activities I am Hosting" and "Activities I Joined".

**Chat Components:**
*   `LiveChatDrawer.jsx`: The slide-out panel for an activity's group chat. It connects directly to the backend's `chat.py` WebSocket.
*   `DirectMessageDrawer.jsx`: The private 1-on-1 chat interface for friends.

**Global Alerts:**
*   `SOSAlertBanner.jsx`: The component that forces a blinking red banner across the entire screen for all users if an emergency is triggered.
