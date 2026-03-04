# 🗺️ Geofence HQ — Setup Guide

Follow these steps in order. Every command is copy-paste ready.

---

## STEP 1 — Install Node.js

1. Go to **https://nodejs.org**
2. Click the big green **"LTS"** button (Long Term Support)
3. Download and run the installer
4. Accept all defaults, click through to Finish
5. **Restart your terminal / command prompt**
6. Verify it worked:
   ```
   node --version
   ```
   You should see something like `v20.x.x` ✅

---

## STEP 2 — Set Up Firebase (free)

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → name it `geofence-hq` → click through
3. Once created, click **"Firestore Database"** in the left sidebar
4. Click **"Create database"** → choose **"Start in test mode"** → pick your region → Done
5. Go to **Project Settings** (gear icon ⚙️ top left)
6. Scroll to **"Your apps"** → click the `</>` (Web) icon
7. Register the app (name it anything), skip Firebase Hosting
8. **Copy the firebaseConfig values** — you'll need them in Step 4

---

## STEP 3 — Get the Code Running Locally

Open your terminal and run these commands one by one:

```bash
# 1. Go into the project folder (wherever you put it)
cd geofence-dashboard

# 2. Install all dependencies
npm install

# 3. Copy the environment file
cp .env.example .env
```

Now open `.env` in any text editor (Notepad, VS Code, etc.) and fill in your Firebase values from Step 2:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=geofence-hq.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=geofence-hq
VITE_FIREBASE_STORAGE_BUCKET=geofence-hq.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123...
```

Test it locally:
```bash
npm run dev
```
Open **http://localhost:5173** — you should see the dashboard! ✅

---

## STEP 4 — Push to GitHub

1. Go to **https://github.com** → sign in → click **"New repository"**
2. Name it `geofence-dashboard`, keep it **Public** (or Private), click **Create**
3. GitHub will show you commands. In your terminal run:

```bash
git init
git add .
git commit -m "Initial commit — Geofence HQ"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/geofence-dashboard.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## STEP 5 — Deploy on Vercel

1. Go to **https://vercel.com** → sign in with GitHub
2. Click **"Add New Project"**
3. Find and click **"Import"** next to your `geofence-dashboard` repo
4. Under **"Environment Variables"**, add all 6 variables from your `.env` file:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Click **"Deploy"**

🎉 In ~60 seconds your app is live at `https://geofence-dashboard.vercel.app`

---

## STEP 6 — Auto-deploy on every change

From now on, every time you push to GitHub:
```bash
git add .
git commit -m "Your change description"
git push
```
Vercel automatically rebuilds and redeploys. No extra steps needed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm: command not found` | Restart your terminal after installing Node |
| Firebase permission denied | Make sure Firestore is in **test mode** |
| Blank page on Vercel | Check that all 6 env variables are added in Vercel settings |
| `git push` asks for password | Use a GitHub Personal Access Token instead of your password |

---

## Your Project Files

```
geofence-dashboard/
├── index.html          ← App entry point
├── vite.config.js      ← Build config
├── package.json        ← Dependencies
├── .env                ← Your secret Firebase keys (never commit this!)
├── .env.example        ← Template for the above
├── .gitignore          ← Tells git to ignore node_modules and .env
└── src/
    ├── main.jsx        ← React entry point
    ├── App.jsx         ← The entire dashboard UI
    └── firebase.js     ← Firebase connection + CRUD helpers
```
