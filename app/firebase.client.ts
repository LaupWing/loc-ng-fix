import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
    apiKey: "AIzaSyClqaC_Y2NeCBFcfYCREoNt5qQTgEhXM4Q",
    authDomain: "loc-ng.firebaseapp.com",
    projectId: "loc-ng",
    storageBucket: "loc-ng.firebasestorage.app",
    messagingSenderId: "505831891834",
    appId: "1:505831891834:web:206872d4e7ea7f873dacc3",
    measurementId: "G-8HGD8HBHSL",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

export { auth, db, analytics }
