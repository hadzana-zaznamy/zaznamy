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
    
    // Vytvorenie registračného formulára dynamicky
    vytvorRegistracnyFormular();
}

function vytvorRegistracnyFormular() {
    // Vytvorenie kontajnera
    const container = document.createElement('div');
    container.style.maxWidth = '400px';
    container.style.margin = '50px auto';
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // Nadpis
    const heading = document.createElement('h1');
    heading.textContent = 'Registrácia';
    heading.style.textAlign = 'center';
    container.appendChild(heading);
    
    // Formulár
    const form = document.createElement('form');
    form.id = 'registerForm';
    
    // Email
    const emailGroup = document.createElement('div');
    emailGroup.style.marginBottom = '15px';
    const emailLabel = document.createElement('label');
    emailLabel.textContent = 'Email';
    emailLabel.style.display = 'block';
    emailLabel.style.marginBottom = '5px';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email';
    emailInput.required = true;
    emailInput.placeholder = 'vas@email.sk';
    emailInput.style.width = '100%';
    emailInput.style.padding = '8px';
    emailInput.style.border = '1px solid #ddd';
    emailInput.style.borderRadius = '4px';
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    form.appendChild(emailGroup);
    
    // Heslo
    const passwordGroup = document.createElement('div');
    passwordGroup.style.marginBottom = '15px';
    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Heslo';
    passwordLabel.style.display = 'block';
    passwordLabel.style.marginBottom = '5px';
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'password';
    passwordInput.required = true;
    passwordInput.placeholder = 'Minimálne 6 znakov';
    passwordInput.minLength = 6;
    passwordInput.style.width = '100%';
    passwordInput.style.padding = '8px';
    passwordInput.style.border = '1px solid #ddd';
    passwordInput.style.borderRadius = '4px';
    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);
    form.appendChild(passwordGroup);
    
    // Používateľské meno
    const nameGroup = document.createElement('div');
    nameGroup.style.marginBottom = '15px';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Používateľské meno';
    nameLabel.style.display = 'block';
    nameLabel.style.marginBottom = '5px';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'displayName';
    nameInput.required = true;
    nameInput.placeholder = 'Vaše meno';
    nameInput.style.width = '100%';
    nameInput.style.padding = '8px';
    nameInput.style.border = '1px solid #ddd';
    nameInput.style.borderRadius = '4px';
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    form.appendChild(nameGroup);
    
    // reCAPTCHA
    const recaptchaDiv = document.createElement('div');
    recaptchaDiv.className = 'g-recaptcha';
    recaptchaDiv.setAttribute('data-sitekey', '6LeLq1MtAAAAAFPWj--GyismZLDALRkAJg3dhtyG');
    recaptchaDiv.style.margin = '20px 0';
    recaptchaDiv.style.display = 'flex';
    recaptchaDiv.style.justifyContent = 'center';
    form.appendChild(recaptchaDiv);
    
    // Chyba reCAPTCHA
    const recaptchaError = document.createElement('div');
    recaptchaError.id = 'recaptchaError';
    recaptchaError.style.color = 'red';
    recaptchaError.style.fontSize = '14px';
    recaptchaError.style.textAlign = 'center';
    recaptchaError.style.marginTop = '5px';
    form.appendChild(recaptchaError);
    
    // Tlačidlo
    const button = document.createElement('button');
    button.type = 'submit';
    button.id = 'registerBtn';
    button.textContent = 'Registrovať sa';
    button.style.width = '100%';
    button.style.padding = '10px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.fontSize = '16px';
    button.style.cursor = 'pointer';
    form.appendChild(button);
    
    // Správa
    const messageDiv = document.createElement('div');
    messageDiv.id = 'message';
    messageDiv.style.marginTop = '20px';
    messageDiv.style.textAlign = 'center';
    form.appendChild(messageDiv);
    
    container.appendChild(form);
    
    // Odkaz na prihlásenie
    const loginLink = document.createElement('div');
    loginLink.style.textAlign = 'center';
    loginLink.style.marginTop = '20px';
    loginLink.innerHTML = 'Už máte účet? <a href="#">Prihlásiť sa</a>';
    container.appendChild(loginLink);
    
    document.body.appendChild(container);
    
    // Načítanie reCAPTCHA skriptu
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    // Event listener pre formulár
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const displayName = nameInput.value.trim();
        
        // Kontrola reCAPTCHA
        if (typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) {
            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
                recaptchaError.textContent = 'Prosím, potvrďte že nie ste robot.';
                return;
            } else {
                recaptchaError.textContent = '';
            }
        }
        
        button.disabled = true;
        button.textContent = 'Registrujem...';
        
        try {
            const result = await window.app.registruj(email, password, displayName);
            
            if (result.success) {
                messageDiv.textContent = 'Registrácia úspešná! Vitajte, ' + displayName + ' 🎉';
                messageDiv.style.color = 'green';
                form.reset();
                if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
                    grecaptcha.reset();
                }
            } else {
                messageDiv.textContent = result.error;
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            messageDiv.textContent = 'Nastala chyba pri registrácii: ' + error.message;
            messageDiv.style.color = 'red';
        } finally {
            button.disabled = false;
            button.textContent = 'Registrovať sa';
        }
    });
}

function formatujDatum(datum) {
    const d = new Date(datum);
    return d.toLocaleDateString('sk-SK');
}

function validujCislo(hodnota) {
    return !isNaN(parseFloat(hodnota)) && isFinite(hodnota);
}
