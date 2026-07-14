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
  doc, getDoc, setDoc, 
  collection, addDoc, 
  getDocs, updateDoc, deleteDoc, 
  query, where, orderBy, limit 
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

// Inicializácia App Check s vaším novým site key
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
    aktualnyPouzivatelRole: null,
    vsetciPouzivatelia: [],
    
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
    
    // Funkcia na kontrolu, či je používateľ prvý v databáze
    jePrvyPouzivatel: async function() {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'asc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        // Ak nie sú žiadni používatelia, tento je prvý
        if (querySnapshot.empty) {
          return true;
        }
        
        // Inak už existuje aspoň jeden používateľ
        return false;
      } catch (error) {
        console.error('Chyba pri kontrole prvého používateľa:', error);
        return false;
      }
    },
    
    registruj: async function(email, password) {
      try {
        // Najprv skontrolovať, či je používateľ prvý
        const jePrvy = await this.jePrvyPouzivatel();
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Určiť rolu - admin ak je prvý, inak user
        const role = jePrvy ? 'admin' : 'user';
        
        // Uložiť do databázy
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: email,
          createdAt: new Date().toISOString(),
          role: role
        });
        
        return { success: true, user: user, role: role };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    prihlas: async function(email, password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Získať rolu používateľa z databázy
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.aktualnyPouzivatelRole = userData.role || 'user';
        }
        
        return { success: true, user: user };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    odhlas: async function() {
      try {
        await signOut(auth);
        this.aktualnyPouzivatelRole = null;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    getAktualnyPouzivatel: function() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.aktualnyPouzivatel = user;
          if (user) {
            // Získať rolu používateľa
            try {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                this.aktualnyPouzivatelRole = userData.role || 'user';
              }
            } catch (error) {
              console.error('Chyba pri načítaní roly:', error);
              this.aktualnyPouzivatelRole = 'user';
            }
          } else {
            this.aktualnyPouzivatelRole = null;
          }
          resolve(user);
        });
      });
    },
    
    // Funkcia na načítanie všetkých používateľov (len pre admina)
    nacitajVsetkychPouzivatelov: async function() {
      if (!this.aktualnyPouzivatel || this.aktualnyPouzivatelRole !== 'admin') {
        return { success: false, error: 'Nemáte oprávnenie na zobrazenie používateľov' };
      }
      
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const pouzivatelia = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Skryť citlivé údaje
          pouzivatelia.push({
            id: doc.id,
            email: data.email || 'Neznámy',
            role: data.role || 'user',
            createdAt: data.createdAt || 'Neznámy',
            uid: data.uid
          });
        });
        this.vsetciPouzivatelia = pouzivatelia;
        return { success: true, pouzivatelia: pouzivatelia };
      } catch (error) {
        return { success: false, error: error.message };
      }
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
  
  // Vytvoriť auth container a logged-in container
  vytvorAuthContainer();
  vytvorLoggedInContainer();
  
  // Najprv skryť oba kontajnery
  const authContainer = document.getElementById('authContainer');
  const loggedInContainer = document.getElementById('loggedInContainer');
  
  if (authContainer) authContainer.style.display = 'none';
  if (loggedInContainer) loggedInContainer.style.display = 'none';
  
  // Sledovanie stavu prihlásenia
  onAuthStateChanged(auth, async (user) => {
    appObj.aktualnyPouzivatel = user;
    
    if (user) {
      // Získať rolu používateľa
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          appObj.aktualnyPouzivatelRole = userData.role || 'user';
        }
      } catch (error) {
        console.error('Chyba pri načítaní roly:', error);
        appObj.aktualnyPouzivatelRole = 'user';
      }
      
      // Používateľ je prihlásený - skryť auth, zobraziť logged-in
      if (authContainer) authContainer.style.display = 'none';
      if (loggedInContainer) {
        loggedInContainer.style.display = 'block';
        // Aktualizovať email a rolu v správe
        const emailSpan = document.getElementById('userEmail');
        if (emailSpan) emailSpan.textContent = user.email;
        
        const roleSpan = document.getElementById('userRole');
        if (roleSpan) {
          const role = appObj.aktualnyPouzivatelRole || 'user';
          roleSpan.textContent = role === 'admin' ? 'Administrátor' : 'Používateľ';
          roleSpan.style.color = role === 'admin' ? '#ff6f00' : '#555';
        }
        
        // Ak je admin, zobraziť admin panel
        if (appObj.aktualnyPouzivatelRole === 'admin') {
          const adminPanel = document.getElementById('adminPanel');
          if (adminPanel) {
            adminPanel.style.display = 'block';
            // Načítať používateľov
            await appObj.nacitajVsetkychPouzivatelov();
            zobrazPouzivatelov(appObj.vsetciPouzivatelia);
          }
        } else {
          const adminPanel = document.getElementById('adminPanel');
          if (adminPanel) adminPanel.style.display = 'none';
        }
      }
      // Vymazať status správy po prihlásení
      vymazStatusSpravy();
    } else {
      // Používateľ nie je prihlásený - zobraziť auth, skryť logged-in
      if (authContainer) authContainer.style.display = 'block';
      if (loggedInContainer) loggedInContainer.style.display = 'none';
      appObj.aktualnyPouzivatelRole = null;
      // Vymazať všetky status správy
      vymazStatusSpravy();
      // Resetovať formuláre
      resetFormulare();
    }
  });
}

function vymazStatusSpravy() {
  // Vymazať správy z registračného formulára
  const regMessage = document.getElementById('regMessage');
  if (regMessage) {
    regMessage.textContent = '';
    regMessage.style.color = '';
  }
  
  // Vymazať správy z prihlasovacieho formulára
  const loginMessage = document.getElementById('loginMessage');
  if (loginMessage) {
    loginMessage.textContent = '';
    loginMessage.style.color = '';
  }
  
  // Vymazať správy z odhlasovacieho formulára
  const logoutStatus = document.getElementById('logoutStatus');
  if (logoutStatus) {
    logoutStatus.textContent = '';
    logoutStatus.style.color = '';
  }
}

function resetFormulare() {
  // Resetovať registračný formulár
  const regForm = document.querySelector('#registerForm form');
  if (regForm) {
    regForm.reset();
  }
  
  // Resetovať prihlasovací formulár
  const loginForm = document.querySelector('#loginForm form');
  if (loginForm) {
    loginForm.reset();
  }
}

function zobrazPouzivatelov(pouzivatelia) {
  const container = document.getElementById('usersList');
  if (!container) return;
  
  if (!pouzivatelia || pouzivatelia.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;">Žiadni používatelia</p>';
    return;
  }
  
  let html = '<div style="overflow-x:auto;">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:14px;">';
  html += `
    <thead>
      <tr style="background-color:#f5f5f5;">
        <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;">Email</th>
        <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;">Rola</th>
        <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;">Registrovaný</th>
      </tr>
    </thead>
    <tbody>
  `;
  
  pouzivatelia.forEach((user) => {
    const jeAdmin = user.role === 'admin';
    const jeAktualny = user.uid === window.app.aktualnyPouzivatel?.uid;
    
    html += `
      <tr style="border-bottom:1px solid #eee;${jeAktualny ? 'background-color:#e8f5e9;' : ''}">
        <td style="padding:10px;">${user.email} ${jeAktualny ? '(Vy)' : ''}</td>
        <td style="padding:10px;">
          <span style="padding:3px 10px;border-radius:12px;font-size:12px;${jeAdmin ? 'background-color:#fff3e0;color:#e65100;' : 'background-color:#e3f2fd;color:#1565c0;'}">
            ${jeAdmin ? 'Admin' : 'User'}
          </span>
        </td>
        <td style="padding:10px;font-size:12px;color:#666;">
          ${formatujDatum(user.createdAt)}
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
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
  // Pôvodne skrytý - zobrazí sa len ak nie je prihlásený
  container.style.display = 'none';
  
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
  registerBtn.textContent = 'Registrácia';
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
  loginBtn.textContent = 'Prihlásenie';
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
    // Vymazať správy pri prepínaní
    vymazStatusSpravy();
  });
  
  loginBtn.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    loginBtn.style.backgroundColor = '#1976D2';
    registerBtn.style.backgroundColor = '#4CAF50';
    loginBtn.style.transform = 'scale(1.02)';
    registerBtn.style.transform = 'scale(1)';
    // Vymazať správy pri prepínaní
    vymazStatusSpravy();
  });
  
  // Štandardne zobraziť registračný formulár
  registerForm.style.display = 'block';
  loginForm.style.display = 'none';
  registerBtn.style.backgroundColor = '#45a049';
}

function vytvorLoggedInContainer() {
  const container = document.createElement('div');
  container.id = 'loggedInContainer';
  container.style.maxWidth = '800px';
  container.style.margin = '50px auto';
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.backgroundColor = '#f9f9f9';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
  container.style.textAlign = 'center';
  // Pôvodne skrytý - zobrazí sa len ak je prihlásený
  container.style.display = 'none';
  
  const heading = document.createElement('h1');
  heading.textContent = 'Hádzaná záznamy';
  heading.style.textAlign = 'center';
  heading.style.color = '#333';
  heading.style.marginBottom = '20px';
  container.appendChild(heading);
  
  // Správa pre prihláseného používateľa
  const messageDiv = document.createElement('div');
  messageDiv.style.marginBottom = '20px';
  messageDiv.style.padding = '15px';
  messageDiv.style.backgroundColor = '#e8f5e9';
  messageDiv.style.borderRadius = '4px';
  messageDiv.style.border = '1px solid #c8e6c9';
  
  const welcomeText = document.createElement('p');
  welcomeText.style.margin = '0 0 5px 0';
  welcomeText.style.fontSize = '16px';
  welcomeText.textContent = 'Ste prihlásený';
  messageDiv.appendChild(welcomeText);
  
  const emailText = document.createElement('p');
  emailText.style.margin = '5px 0';
  emailText.style.fontSize = '14px';
  emailText.style.color = '#555';
  emailText.innerHTML = 'Email: <span id="userEmail"></span>';
  messageDiv.appendChild(emailText);
  
  const roleText = document.createElement('p');
  roleText.style.margin = '5px 0 0 0';
  roleText.style.fontSize = '14px';
  roleText.innerHTML = 'Rola: <span id="userRole"></span>';
  messageDiv.appendChild(roleText);
  
  container.appendChild(messageDiv);
  
  // Admin panel
  const adminPanel = document.createElement('div');
  adminPanel.id = 'adminPanel';
  adminPanel.style.display = 'none';
  adminPanel.style.marginTop = '20px';
  adminPanel.style.padding = '20px';
  adminPanel.style.backgroundColor = '#fff3e0';
  adminPanel.style.borderRadius = '4px';
  adminPanel.style.border = '1px solid #ffe0b2';
  adminPanel.style.textAlign = 'left';
  
  const adminTitle = document.createElement('h3');
  adminTitle.textContent = 'Zoznam používateľov';
  adminTitle.style.margin = '0 0 15px 0';
  adminTitle.style.color = '#e65100';
  adminPanel.appendChild(adminTitle);
  
  const usersList = document.createElement('div');
  usersList.id = 'usersList';
  adminPanel.appendChild(usersList);
  
  container.appendChild(adminPanel);
  
  // Odhlasovacie tlačidlo
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'logoutBtn';
  logoutBtn.textContent = 'Odhlásiť sa';
  logoutBtn.style.width = '100%';
  logoutBtn.style.marginTop = '20px';
  logoutBtn.style.padding = '12px';
  logoutBtn.style.backgroundColor = '#f44336';
  logoutBtn.style.color = 'white';
  logoutBtn.style.border = 'none';
  logoutBtn.style.borderRadius = '4px';
  logoutBtn.style.fontSize = '16px';
  logoutBtn.style.cursor = 'pointer';
  logoutBtn.style.transition = 'background-color 0.3s';
  
  logoutBtn.addEventListener('mouseenter', () => {
    logoutBtn.style.backgroundColor = '#d32f2f';
  });
  
  logoutBtn.addEventListener('mouseleave', () => {
    logoutBtn.style.backgroundColor = '#f44336';
  });
  
  container.appendChild(logoutBtn);
  
  // Status správa
  const statusDiv = document.createElement('div');
  statusDiv.id = 'logoutStatus';
  statusDiv.style.marginTop = '15px';
  statusDiv.style.textAlign = 'center';
  statusDiv.style.fontSize = '14px';
  container.appendChild(statusDiv);
  
  document.body.appendChild(container);
  
  // Event listener pre odhlásenie
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    logoutBtn.textContent = 'Odhlasujem...';
    logoutBtn.style.opacity = '0.7';
    statusDiv.textContent = '';
    statusDiv.style.color = '';
    
    try {
      const result = await window.app.odhlas();
      
      if (result.success) {
        statusDiv.innerHTML = 'Odhlásenie úspešné!';
        statusDiv.style.color = 'green';
        // Skryť logged-in container, zobraziť auth container
        document.getElementById('loggedInContainer').style.display = 'none';
        document.getElementById('authContainer').style.display = 'block';
        // Vymazať status správu po chvíli
        setTimeout(() => {
          if (statusDiv) {
            statusDiv.textContent = '';
            statusDiv.style.color = '';
          }
        }, 3000);
      } else {
        statusDiv.textContent = 'Chyba: ' + result.error;
        statusDiv.style.color = 'red';
      }
    } catch (error) {
      statusDiv.textContent = 'Nastala chyba pri odhlásení: ' + error.message;
      statusDiv.style.color = 'red';
    } finally {
      logoutBtn.disabled = false;
      logoutBtn.textContent = 'Odhlásiť sa';
      logoutBtn.style.opacity = '1';
    }
  });
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
    messageDiv.style.color = '';
    
    try {
      const result = await window.app.registruj(email, password);
      
      if (result.success) {
        const roleText = result.role === 'admin' ? 'ADMINISTRÁTOR' : 'Používateľ';
        messageDiv.innerHTML = 'Registrácia úspešná! Vaša rola: ' + roleText;
        messageDiv.style.color = 'green';
        form.reset();
        // Po registrácii sa používateľ automaticky prihlási
        // onAuthStateChanged sa postará o zobrazenie správneho UI
      } else {
        messageDiv.textContent = 'Chyba: ' + result.error;
        messageDiv.style.color = 'red';
      }
    } catch (error) {
      messageDiv.textContent = 'Nastala chyba pri registrácii: ' + error.message;
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
    messageDiv.style.color = '';
    
    try {
      const result = await window.app.prihlas(email, password);
      
      if (result.success) {
        messageDiv.innerHTML = 'Prihlásenie úspešné!';
        messageDiv.style.color = 'green';
        form.reset();
        // onAuthStateChanged sa postará o zobrazenie správneho UI
      } else {
        messageDiv.textContent = 'Chyba: ' + result.error;
        messageDiv.style.color = 'red';
      }
    } catch (error) {
      messageDiv.textContent = 'Nastala chyba pri prihlásení: ' + error.message;
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
  if (!datum) return 'Neznámy';
  const d = new Date(datum);
  return d.toLocaleDateString('sk-SK') + ' ' + d.toLocaleTimeString('sk-SK', {hour: '2-digit', minute: '2-digit'});
}

function validujCislo(hodnota) {
  return !isNaN(parseFloat(hodnota)) && isFinite(hodnota);
}
