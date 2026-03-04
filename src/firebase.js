import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

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
export const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function signOutUser() {
  await signOut(auth)
}

// ─── Campaign CRUD ────────────────────────────────────────────────────────────
export async function saveCampaign(campaign, userId) {
  const docRef = await addDoc(collection(db, 'campaigns'), {
    ...campaign, userId, createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function loadCampaigns(userId) {
  const q = query(collection(db, 'campaigns'), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateCampaign(id, data) {
  await updateDoc(doc(db, 'campaigns', id), data)
}

export async function deleteCampaign(id) {
  await deleteDoc(doc(db, 'campaigns', id))
}

// ─── Client CRUD ──────────────────────────────────────────────────────────────
export async function saveClient(client, userId) {
  const docRef = await addDoc(collection(db, 'clients'), {
    ...client, userId, createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function loadClients(userId) {
  const q = query(collection(db, 'clients'), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateClient(id, data) {
  await updateDoc(doc(db, 'clients', id), data)
}

export async function deleteClient(id) {
  await deleteDoc(doc(db, 'clients', id))
}
