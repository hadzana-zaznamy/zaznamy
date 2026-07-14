// index.js - Hádzaná záznamy s App Check (reCAPTCHA v3)

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, setDoc, 
  collection, addDoc, 
  getDocs, updateDoc, deleteDoc, 
  query, where 
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
// App Check import
import { 
  initializeAppCheck, 
  ReCaptchaV3Provider 
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-check.js";

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

// ✅ Inicializácia App Check s vaším novým site key
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Lc2tVMtAAAAAAJeVHKtQP5vBRl9Qg22XBNmF5WP'),
  isTokenAutoRefreshEnabled: true
});

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
    
    registruj: async function(email, password) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Uložiť len email a uid do databázy, bez mena
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: email,
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
  appObj.getAktualnyPouzivatel();
  vytvorAuthContainer();
}

function vytvorAuthContainer() {
  const container = document.createElement('div');
  container.id = 'authContainer';
  container.style.maxWidth = '400px';
  container.style.margin = '50px auto';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.backgroundColor = '#f9f9f9';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
  
  const heading = document.createElement('h1');
  heading.textContent = 'Hádzaná záznamy';
  heading.style.textAlign = 'center';
  heading.style.color = '#333';
  heading.style.marginBottom = '20px';
  container.appendChild(heading);
  
  // Tlačidlá na prepínanie
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginBottom = '20px';
  
  const registerBtn = document.createElement('button');
  registerBtn.id = 'showRegisterBtn';
  registerBtn.textContent = '📝 Registrácia';
  registerBtn.style.flex = '1';
  registerBtn.style.padding = '12px';
  registerBtn.style.backgroundColor = '#4CAF50';
  registerBtn.style.color = 'white';
  registerBtn.style.border = 'none';
  registerBtn.style.borderRadius = '4px';
  registerBtn.style.fontSize = '16px';
  registerBtn.style.cursor = 'pointer';
  registerBtn.style.transition = 'all 0.3s';
  
  const loginBtn = document.createElement('button');
  loginBtn.id = 'showLoginBtn';
  loginBtn.textContent = '🔐 Prihlásenie';
  loginBtn.style.flex = '1';
  loginBtn.style.padding = '12px';
  loginBtn.style.backgroundColor = '#2196F3';
  loginBtn.style.color = 'white';
  loginBtn.style.border = 'none';
  loginBtn.style.borderRadius = '4px';
  loginBtn.style.fontSize = '16px';
  loginBtn.style.cursor = 'pointer';
  loginBtn.style.transition = 'all 0.3s';
  
  buttonContainer.appendChild(registerBtn);
  buttonContainer.appendChild(loginBtn);
  container.appendChild(buttonContainer);
  
  // Kontajner pre formuláre
  const formsContainer = document.createElement('div');
  formsContainer.id = 'formsContainer';
  container.appendChild(formsContainer);
  
  // Vytvorenie formulárov
  const registerForm = vytvorRegistracnyFormular();
  const loginForm = vytvorPrihlasovaciFormular();
  
  formsContainer.appendChild(registerForm);
  formsContainer.appendChild(loginForm);
  
  document.body.appendChild(container);
  
  // Event listenery pre tlačidlá
  registerBtn.addEventListener('click', () => {
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    registerBtn.style.backgroundColor = '#45a049';
    loginBtn.style.backgroundColor = '#2196F3';
    registerBtn.style.transform = 'scale(1.02)';
    loginBtn.style.transform = 'scale(1)';
  });
  
  loginBtn.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    loginBtn.style.backgroundColor = '#1976D2';
    registerBtn.style.backgroundColor = '#4CAF50';
    loginBtn.style.transform = 'scale(1.02)';
    registerBtn.style.transform = 'scale(1)';
  });
  
  // Štandardne zobraziť registračný formulár
  registerForm.style.display = 'block';
  loginForm.style.display = 'none';
  registerBtn.style.backgroundColor = '#45a049';
}

function vytvorRegistracnyFormular() {
  const container = document.createElement('div');
  container.id = 'registerForm';
  container.style.display = 'none';
  
  const heading = document.createElement('h2');
  heading.textContent = 'Vytvoriť nový účet';
  heading.style.textAlign = 'center';
  heading.style.color = '#333';
  heading.style.marginBottom = '20px';
  container.appendChild(heading);
  
  const form = document.createElement('form');
  
  // Email
  const emailGroup = document.createElement('div');
  emailGroup.style.marginBottom = '15px';
  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'Email';
  emailLabel.style.display = 'block';
  emailLabel.style.marginBottom = '5px';
  emailLabel.style.fontWeight = 'bold';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.id = 'regEmail';
  emailInput.required = true;
  emailInput.placeholder = 'vas@email.sk';
  emailInput.style.width = '100%';
  emailInput.style.padding = '10px';
  emailInput.style.border = '1px solid #ddd';
  emailInput.style.borderRadius = '4px';
  emailInput.style.fontSize = '14px';
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
  passwordLabel.style.fontWeight = 'bold';
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'regPassword';
  passwordInput.required = true;
  passwordInput.placeholder = 'Minimálne 6 znakov';
  passwordInput.minLength = 6;
  passwordInput.style.width = '100%';
  passwordInput.style.padding = '10px';
  passwordInput.style.border = '1px solid #ddd';
  passwordInput.style.borderRadius = '4px';
  passwordInput.style.fontSize = '14px';
  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(passwordInput);
  form.appendChild(passwordGroup);
  
  // Tlačidlo
  const button = document.createElement('button');
  button.type = 'submit';
  button.id = 'registerBtn';
  button.textContent = 'Registrovať sa';
  button.style.width = '100%';
  button.style.padding = '12px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.fontSize = '16px';
  button.style.cursor = 'pointer';
  button.style.transition = 'background-color 0.3s';
  form.appendChild(button);
  
  // Správa
  const messageDiv = document.createElement('div');
  messageDiv.id = 'regMessage';
  messageDiv.style.marginTop = '15px';
  messageDiv.style.textAlign = 'center';
  messageDiv.style.fontSize = '14px';
  form.appendChild(messageDiv);
  
  container.appendChild(form);
  
  // Event listener pre formulár
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    button.disabled = true;
    button.textContent = 'Registrujem...';
    button.style.opacity = '0.7';
    messageDiv.textContent = '';
    
    try {
      const result = await window.app.registruj(email, password);
      
      if (result.success) {
        messageDiv.innerHTML = '✅ Registrácia úspešná! 🎉';
        messageDiv.style.color = 'green';
        form.reset();
        
        // Po registrácii automaticky prihlásiť
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        messageDiv.textContent = '❌ ' + result.error;
        messageDiv.style.color = 'red';
      }
    } catch (error) {
      messageDiv.textContent = '❌ Nastala chyba pri registrácii: ' + error.message;
      messageDiv.style.color = 'red';
    } finally {
      button.disabled = false;
      button.textContent = 'Registrovať sa';
      button.style.opacity = '1';
    }
  });
  
  return container;
}

function vytvorPrihlasovaciFormular() {
  const container = document.createElement('div');
  container.id = 'loginForm';
  container.style.display = 'none';
  
  const heading = document.createElement('h2');
  heading.textContent = 'Prihlásiť sa';
  heading.style.textAlign = 'center';
  heading.style.color = '#333';
  heading.style.marginBottom = '20px';
  container.appendChild(heading);
  
  const form = document.createElement('form');
  
  // Email
  const emailGroup = document.createElement('div');
  emailGroup.style.marginBottom = '15px';
  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'Email';
  emailLabel.style.display = 'block';
  emailLabel.style.marginBottom = '5px';
  emailLabel.style.fontWeight = 'bold';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.id = 'loginEmail';
  emailInput.required = true;
  emailInput.placeholder = 'vas@email.sk';
  emailInput.style.width = '100%';
  emailInput.style.padding = '10px';
  emailInput.style.border = '1px solid #ddd';
  emailInput.style.borderRadius = '4px';
  emailInput.style.fontSize = '14px';
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
  passwordLabel.style.fontWeight = 'bold';
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'loginPassword';
  passwordInput.required = true;
  passwordInput.placeholder = 'Vaše heslo';
  passwordInput.style.width = '100%';
  passwordInput.style.padding = '10px';
  passwordInput.style.border = '1px solid #ddd';
  passwordInput.style.borderRadius = '4px';
  passwordInput.style.fontSize = '14px';
  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(passwordInput);
  form.appendChild(passwordGroup);
  
  // Tlačidlo
  const button = document.createElement('button');
  button.type = 'submit';
  button.id = 'loginBtn';
  button.textContent = 'Prihlásiť sa';
  button.style.width = '100%';
  button.style.padding = '12px';
  button.style.backgroundColor = '#2196F3';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.fontSize = '16px';
  button.style.cursor = 'pointer';
  button.style.transition = 'background-color 0.3s';
  form.appendChild(button);
  
  // Správa
  const messageDiv = document.createElement('div');
  messageDiv.id = 'loginMessage';
  messageDiv.style.marginTop = '15px';
  messageDiv.style.textAlign = 'center';
  messageDiv.style.fontSize = '14px';
  form.appendChild(messageDiv);
  
  container.appendChild(form);
  
  // Event listener pre formulár
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    button.disabled = true;
    button.textContent = 'Prihlasujem...';
    button.style.opacity = '0.7';
    messageDiv.textContent = '';
    
    try {
      const result = await window.app.prihlas(email, password);
      
      if (result.success) {
        messageDiv.innerHTML = '✅ Prihlásenie úspešné! 🎉';
        messageDiv.style.color = 'green';
        form.reset();
        
        // Po prihlásení presmerovať
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        messageDiv.textContent = '❌ ' + result.error;
        messageDiv.style.color = 'red';
      }
    } catch (error) {
      messageDiv.textContent = '❌ Nastala chyba pri prihlásení: ' + error.message;
      messageDiv.style.color = 'red';
    } finally {
      button.disabled = false;
      button.textContent = 'Prihlásiť sa';
      button.style.opacity = '1';
    }
  });
  
  return container;
}

function formatujDatum(datum) {
  const d = new Date(datum);
  return d.toLocaleDateString('sk-SK');
}

function validujCislo(hodnota) {
  return !isNaN(parseFloat(hodnota)) && isFinite(hodnota);
}
