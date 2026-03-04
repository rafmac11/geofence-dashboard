import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore'

// These values come from your .env file (safe — Vite exposes VITE_ prefixed vars only)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// ─── Campaign CRUD helpers ───────────────────────────────────────────────────

export async function saveCampaign(campaign) {
  const docRef = await addDoc(collection(db, 'campaigns'), {
    ...campaign,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function loadCampaigns() {
  const snapshot = await getDocs(collection(db, 'campaigns'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateCampaign(id, data) {
  await updateDoc(doc(db, 'campaigns', id), data)
}

export async function deleteCampaign(id) {
  await deleteDoc(doc(db, 'campaigns', id))
}
