// index.js - Hádzaná záznamy

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAE-IZQGubCgQYzhtMtH6y4w1sRFOW_suI",
    authDomain: "z-a-z-n-a-m-y.firebaseapp.com",
    projectId: "z-a-z-n-a-m-y",
    storageBucket: "z-a-z-n-a-m-y.firebasestorage.app",
    messagingSenderId: "540843058951",
    appId: "1:540843058951:web:9c53831a6ce372609707a2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', inicializujAplikaciu);

function inicializujAplikaciu() {
    const appObj = {
        zaznamy: [],
        aktualnyZaznam: null,
        aktualnyPouzivatel: null,
        
        pridajZaznam: function(data) {
            this.zaznamy.push(data);
            this.aktualizujZoznam();
        },
        
        odstranZaznam: function(index) {
            if (index >= 0 && index < this.zaznamy.length) {
                this.zaznamy.splice(index, 1);
                this.aktualizujZoznam();
            }
        },
        
        aktualizujZoznam: function() {
            // Tu neskôr pridáme vykreslenie zoznamu
        },
        
        registruj: async function(email, password, displayName) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                await updateProfile(user, { displayName: displayName });
                
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: email,
                    displayName: displayName,
                    createdAt: new Date().toISOString(),
                    role: 'user'
                });
                
                return { success: true, user: user };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        prihlas: async function(email, password) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                return { success: true, user: userCredential.user };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        odhlas: async function() {
            try {
                await signOut(auth);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        getAktualnyPouzivatel: function() {
            return new Promise((resolve) => {
                onAuthStateChanged(auth, (user) => {
                    this.aktualnyPouzivatel = user;
                    resolve(user);
                });
            });
        },
        
        ulozZaznam: async function(zaznam) {
            if (!this.aktualnyPouzivatel) {
                return { success: false, error: 'Používateľ nie je prihlásený' };
            }
            
            try {
                const docRef = await addDoc(collection(db, 'zaznamy'), {
                    ...zaznam,
                    uid: this.aktualnyPouzivatel.uid,
                    createdAt: new Date().toISOString()
                });
                return { success: true, id: docRef.id };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        nacitajZaznamy: async function() {
            if (!this.aktualnyPouzivatel) {
                return { success: false, error: 'Používateľ nie je prihlásený' };
            }
            
            try {
                const q = query(collection(db, 'zaznamy'), where('uid', '==', this.aktualnyPouzivatel.uid));
                const querySnapshot = await getDocs(q);
                const zaznamy = [];
                querySnapshot.forEach((doc) => {
                    zaznamy.push({ id: doc.id, ...doc.data() });
                });
                this.zaznamy = zaznamy;
                this.aktualizujZoznam();
                return { success: true, zaznamy: zaznamy };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        aktualizujZaznam: async function(id, data) {
            if (!this.aktualnyPouzivatel) {
                return { success: false, error: 'Používateľ nie je prihlásený' };
            }
            
            try {
                await updateDoc(doc(db, 'zaznamy', id), {
                    ...data,
                    updatedAt: new Date().toISOString()
                });
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        
        vymazZaznam: async function(id) {
            if (!this.aktualnyPouzivatel) {
                return { success: false, error: 'Používateľ nie je prihlásený' };
            }
            
            try {
                await deleteDoc(doc(db, 'zaznamy', id));
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
    };
    
    window.app = appObj;
    
    // Automatické nastavenie aktuálneho používateľa
    appObj.getAktualnyPouzivatel();
}

function formatujDatum(datum) {
    const d = new Date(datum);
    return d.toLocaleDateString('sk-SK');
}

function validujCislo(hodnota) {
    return !isNaN(parseFloat(hodnota)) && isFinite(hodnota);
}

// Export pre použitie v iných moduloch
export { auth, db, app };
