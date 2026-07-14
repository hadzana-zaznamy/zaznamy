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
    aktualnyPouzivatelApproved: null,
    vsetciPouzivatelia: [],
    zobrazenieAdmin: 'aplikacia', // 'aplikacia' alebo 'pouzivatelia'
    
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
        
        // Prvý admin je automaticky schválený, ostatní čakajú na schválenie
        const approved = jePrvy ? true : false;
        
        // Uložiť do databázy
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: email,
          createdAt: new Date().toISOString(),
          role: role,
          approved: approved
        });
        
        return { success: true, user: user, role: role, approved: approved };
      } catch (error) {
        // Spracovanie špecifických chýb Firebase
        let errorMessage = error.message;
        
        // Kontrola konkrétnych chybových kódov
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Zadaná e-mailová adresa už existuje. Prosím, prihláste sa, alebo si zvoľte inú e-mailovú adresu.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Zadaná e-mailová adresa je neplatná. Prosím, skontrolujte správnosť zadania.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Heslo je príliš slabé. Prosím, zvoľte silnejšie heslo (minimálne 6 znakov).';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Registrácia je momentálne zakázaná. Kontaktujte administrátora.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Príliš veľa neúspešných pokusov. Skúste to prosím neskôr.';
        }
        
        return { success: false, error: errorMessage };
      }
    },
    
    prihlas: async function(email, password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Získať údaje používateľa z databázy
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.aktualnyPouzivatelRole = userData.role || 'user';
          this.aktualnyPouzivatelApproved = userData.approved || false;
        } else {
          this.aktualnyPouzivatelRole = 'user';
          this.aktualnyPouzivatelApproved = false;
        }
        
        return { success: true, user: user };
      } catch (error) {
        // Spracovanie špecifických chýb Firebase pre prihlásenie
        let errorMessage = error.message;
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Používateľ s touto e-mailovou adresou nebol nájdený.';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Nesprávne heslo. Prosím, skúste to znova.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Zadaná e-mailová adresa je neplatná.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Príliš veľa neúspešných pokusov. Skúste to prosím neskôr.';
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'Tento účet bol zablokovaný. Kontaktujte administrátora.';
        }
        
        return { success: false, error: errorMessage };
      }
    },
    
    odhlas: async function() {
      try {
        await signOut(auth);
        this.aktualnyPouzivatelRole = null;
        this.aktualnyPouzivatelApproved = null;
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
            // Získať údaje používateľa
            try {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                this.aktualnyPouzivatelRole = userData.role || 'user';
                this.aktualnyPouzivatelApproved = userData.approved || false;
              }
            } catch (error) {
              console.error('Chyba pri načítaní údajov:', error);
              this.aktualnyPouzivatelRole = 'user';
              this.aktualnyPouzivatelApproved = false;
            }
          } else {
            this.aktualnyPouzivatelRole = null;
            this.aktualnyPouzivatelApproved = null;
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
          pouzivatelia.push({
            id: doc.id,
            email: data.email || 'Neznámy',
            role: data.role || 'user',
            createdAt: data.createdAt || 'Neznámy',
            uid: data.uid,
            approved: data.approved || false
          });
        });
        this.vsetciPouzivatelia = pouzivatelia;
        return { success: true, pouzivatelia: pouzivatelia };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    // Funkcia na schválenie používateľa (len pre admina)
    schvalPouzivatela: async function(userId) {
      if (!this.aktualnyPouzivatel || this.aktualnyPouzivatelRole !== 'admin') {
        return { success: false, error: 'Nemáte oprávnenie na schvaľovanie používateľov' };
      }
      
      try {
        await updateDoc(doc(db, 'users', userId), {
          approved: true,
          approvedAt: new Date().toISOString(),
          approvedBy: this.aktualnyPouzivatel.uid
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    // Funkcia na zamietnutie používateľa (len pre admina)
    zamietniPouzivatela: async function(userId) {
      if (!this.aktualnyPouzivatel || this.aktualnyPouzivatelRole !== 'admin') {
        return { success: false, error: 'Nemáte oprávnenie na zamietanie používateľov' };
      }
      
      try {
        // Vymažeme používateľa z databázy
        await deleteDoc(doc(db, 'users', userId));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    // Kontrola, či má používateľ prístup
    maPristup: function() {
      return this.aktualnyPouzivatel && this.aktualnyPouzivatelApproved === true;
    },
    
    // Kontrola, či je používateľ admin
    jeAdmin: function() {
      return this.aktualnyPouzivatel && this.aktualnyPouzivatelRole === 'admin';
    },
    
    ulozZaznam: async function(zaznam) {
      if (!this.maPristup()) {
        return { success: false, error: 'Nemáte schválený prístup alebo nie ste prihlásený' };
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
      if (!this.maPristup()) {
        return { success: false, error: 'Nemáte schválený prístup alebo nie ste prihlásený' };
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
      if (!this.maPristup()) {
        return { success: false, error: 'Nemáte schválený prístup alebo nie ste prihlásený' };
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
      if (!this.maPristup()) {
        return { success: false, error: 'Nemáte schválený prístup alebo nie ste prihlásený' };
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
      // Získať údaje používateľa
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          appObj.aktualnyPouzivatelRole = userData.role || 'user';
          appObj.aktualnyPouzivatelApproved = userData.approved || false;
        } else {
          appObj.aktualnyPouzivatelRole = 'user';
          appObj.aktualnyPouzivatelApproved = false;
        }
      } catch (error) {
        console.error('Chyba pri načítaní údajov:', error);
        appObj.aktualnyPouzivatelRole = 'user';
        appObj.aktualnyPouzivatelApproved = false;
      }
      
      // Skontrolovať, či je používateľ schválený
      const jeSchvaleny = appObj.maPristup();
      const jeAdmin = appObj.jeAdmin();
      
      // Používateľ je prihlásený - skryť auth, zobraziť logged-in
      if (authContainer) authContainer.style.display = 'none';
      if (loggedInContainer) {
        loggedInContainer.style.display = 'block';
        
        // Zobraziť/skryť obsah podľa schválenia
        const contentDiv = document.getElementById('contentArea');
        const approvalMessage = document.getElementById('approvalMessage');
        
        if (contentDiv) {
          contentDiv.style.display = jeSchvaleny || jeAdmin ? 'block' : 'none';
        }
        
        if (approvalMessage) {
          approvalMessage.style.display = (!jeSchvaleny && !jeAdmin) ? 'block' : 'none';
        }
        
        // Ak je admin, zobraziť admin panel a tlačidlá
        if (jeAdmin) {
          const adminPanel = document.getElementById('adminPanel');
          const adminButtons = document.getElementById('adminButtons');
          
          // Načítať používateľov
          await appObj.nacitajVsetkychPouzivatelov();
          zobrazPouzivatelov(appObj.vsetciPouzivatelia);
          
          if (adminPanel) {
            adminPanel.style.display = 'none'; // Skryté na začiatku
          }
          
          if (adminButtons) {
            adminButtons.style.display = 'flex';
          }
          
          // Nastaviť aktívne tlačidlo na Aplikácia
          document.getElementById('btnAplikacia').style.backgroundColor = '#1976D2';
          document.getElementById('btnAplikacia').style.color = 'white';
          document.getElementById('btnPouzivatelia').style.backgroundColor = '#e0e0e0';
          document.getElementById('btnPouzivatelia').style.color = '#333';
          
          // Zobraziť aplikáciu, skryť admin panel
          document.getElementById('contentArea').style.display = 'block';
          document.getElementById('adminPanel').style.display = 'none';
          
        } else {
          const adminPanel = document.getElementById('adminPanel');
          const adminButtons = document.getElementById('adminButtons');
          
          if (adminPanel) adminPanel.style.display = 'none';
          if (adminButtons) adminButtons.style.display = 'none';
        }
      }
      // Vymazať status správy po prihlásení
      vymazStatusSpravy();
    } else {
      // Používateľ nie je prihlásený - zobraziť auth, skryť logged-in
      if (authContainer) authContainer.style.display = 'block';
      if (loggedInContainer) loggedInContainer.style.display = 'none';
      appObj.aktualnyPouzivatelRole = null;
      appObj.aktualnyPouzivatelApproved = null;
      // Vymazať všetky status správy
      vymazStatusSpravy();
      // Resetovať formuláre
      resetFormulare();
    }
  });
}

function vymazStatusSpravy() {
  const regMessage = document.getElementById('regMessage');
  if (regMessage) {
    regMessage.textContent = '';
    regMessage.style.color = '';
  }
  
  const loginMessage = document.getElementById('loginMessage');
  if (loginMessage) {
    loginMessage.textContent = '';
    loginMessage.style.color = '';
  }
  
  const logoutStatus = document.getElementById('logoutStatus');
  if (logoutStatus) {
    logoutStatus.textContent = '';
    logoutStatus.style.color = '';
  }
}

function resetFormulare() {
  const regForm = document.querySelector('#registerForm form');
  if (regForm) {
    regForm.reset();
  }
  
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
        <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;">Stav</th>
        <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;">Registrovaný</th>
        <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;">Akcia</th>
      </tr>
    </thead>
    <tbody>
  `;
  
  pouzivatelia.forEach((user) => {
    const jeAdmin = user.role === 'admin';
    const jeAktualny = user.uid === window.app.aktualnyPouzivatel?.uid;
    const jeSchvaleny = user.approved === true;
    
    html += `
      <tr style="border-bottom:1px solid #eee;${jeAktualny ? 'background-color:#e8f5e9;' : ''}">
        <td style="padding:10px;">${user.email}</td>
        <td style="padding:10px;">
          <span style="padding:3px 10px;border-radius:12px;font-size:12px;${jeAdmin ? 'background-color:#fff3e0;color:#e65100;' : 'background-color:#e3f2fd;color:#1565c0;'}">
            ${jeAdmin ? 'Admin' : 'User'}
          </span>
        </td>
        <td style="padding:10px;">
          <span style="padding:3px 10px;border-radius:12px;font-size:12px;${jeSchvaleny ? 'background-color:#c8e6c9;color:#2e7d32;' : 'background-color:#ffcdd2;color:#c62828;'}">
            ${jeSchvaleny ? 'Schválený' : 'Čaká'}
          </span>
        </td>
        <td style="padding:10px;font-size:12px;color:#666;">
          ${formatujDatum(user.createdAt)}
        </td>
        <td style="padding:10px;">
          ${!jeAdmin && !jeSchvaleny ? `
            <button onclick="schvalPouzivatela('${user.id}')" 
                    style="padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:12px;background-color:#4CAF50;color:white;margin-right:5px;">
              ✓ Schváliť
            </button>
            <button onclick="zamietniPouzivatela('${user.id}')" 
                    style="padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:12px;background-color:#f44336;color:white;">
              ✗ Zamietnuť
            </button>
          ` : (jeAdmin ? '<span style="font-size:12px;color:#999;">Admin</span>' : '<span style="font-size:12px;color:#4CAF50;">Schválený</span>')}
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// Globálne funkcie pre admina
window.schvalPouzivatela = async function(userId) {
  if (!confirm('Naozaj chcete schváliť tohto používateľa?')) {
    return;
  }
  
  try {
    const result = await window.app.schvalPouzivatela(userId);
    
    if (result.success) {
      await window.app.nacitajVsetkychPouzivatelov();
      zobrazPouzivatelov(window.app.vsetciPouzivatelia);
      alert('✅ Používateľ bol úspešne schválený!');
    } else {
      alert('❌ ' + result.error);
    }
  } catch (error) {
    alert('❌ Nastala chyba: ' + error.message);
  }
};

window.zamietniPouzivatela = async function(userId) {
  if (!confirm('Naozaj chcete zamietnuť tohto používateľa? Jeho účet bude vymazaný.')) {
    return;
  }
  
  try {
    const result = await window.app.zamietniPouzivatela(userId);
    
    if (result.success) {
      await window.app.nacitajVsetkychPouzivatelov();
      zobrazPouzivatelov(window.app.vsetciPouzivatelia);
      alert('✅ Používateľ bol zamietnutý a vymazaný!');
    } else {
      alert('❌ ' + result.error);
    }
  } catch (error) {
    alert('❌ Nastala chyba: ' + error.message);
  }
};

// Funkcie na prepínanie admin zobrazenia
window.zobrazAplikaciu = function() {
  document.getElementById('contentArea').style.display = 'block';
  document.getElementById('adminPanel').style.display = 'none';
  
  // Aktualizovať aktívne tlačidlá
  document.getElementById('btnAplikacia').style.backgroundColor = '#1976D2';
  document.getElementById('btnAplikacia').style.color = 'white';
  document.getElementById('btnPouzivatelia').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnPouzivatelia').style.color = '#333';
};

window.zobrazPouzivatelovAdmin = function() {
  document.getElementById('contentArea').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  
  // Aktualizovať aktívne tlačidlá
  document.getElementById('btnPouzivatelia').style.backgroundColor = '#1976D2';
  document.getElementById('btnPouzivatelia').style.color = 'white';
  document.getElementById('btnAplikacia').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnAplikacia').style.color = '#333';
};

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
  container.style.display = 'none';
  
  const heading = document.createElement('h1');
  heading.textContent = 'Hádzaná záznamy';
  heading.style.textAlign = 'center';
  heading.style.color = '#333';
  heading.style.marginBottom = '20px';
  container.appendChild(heading);
  
  const formsContainer = document.createElement('div');
  formsContainer.id = 'formsContainer';
  container.appendChild(formsContainer);
  
  // Vytvorenie formulárov
  const registerForm = vytvorRegistracnyFormular();
  const loginForm = vytvorPrihlasovaciFormular();
  
  formsContainer.appendChild(registerForm);
  formsContainer.appendChild(loginForm);
  
  document.body.appendChild(container);
  
  // Štandardne zobraziť prihlasovací formulár
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
}

function vytvorLoggedInContainer() {
  const container = document.createElement('div');
  container.id = 'loggedInContainer';
  container.style.maxWidth = '800px';
  container.style.margin = '50px auto';
  container.style.padding = '20px';
  container.style.paddingTop = '80px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.backgroundColor = '#f9f9f9';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
  container.style.textAlign = 'center';
  container.style.display = 'none';
  container.style.position = 'relative';
  
  // Tlačidlo na odhlásenie - FIXED pozícia v pravom hornom rohu OBRAZOVKY
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'logoutBtn';
  logoutBtn.textContent = 'Odhlásiť sa';
  logoutBtn.style.position = 'fixed';
  logoutBtn.style.top = '20px';
  logoutBtn.style.right = '20px';
  logoutBtn.style.padding = '10px 20px';
  logoutBtn.style.backgroundColor = '#f44336';
  logoutBtn.style.color = 'white';
  logoutBtn.style.border = 'none';
  logoutBtn.style.borderRadius = '4px';
  logoutBtn.style.fontSize = '14px';
  logoutBtn.style.cursor = 'pointer';
  logoutBtn.style.transition = 'background-color 0.3s';
  logoutBtn.style.zIndex = '9999';
  logoutBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  
  logoutBtn.addEventListener('mouseenter', () => {
    logoutBtn.style.backgroundColor = '#d32f2f';
  });
  
  logoutBtn.addEventListener('mouseleave', () => {
    logoutBtn.style.backgroundColor = '#f44336';
  });
  
  document.body.appendChild(logoutBtn);
  
  // Status správa pre odhlásenie - FIXED pozícia (ODSTRÁNENÝ BIELY OBDĹŽNIK)
  const statusDiv = document.createElement('div');
  statusDiv.id = 'logoutStatus';
  statusDiv.style.position = 'fixed';
  statusDiv.style.top = '70px';
  statusDiv.style.right = '20px';
  statusDiv.style.textAlign = 'center';
  statusDiv.style.fontSize = '14px';
  statusDiv.style.zIndex = '9999';
  document.body.appendChild(statusDiv);
  
  const heading = document.createElement('h1');
  heading.textContent = 'Hádzaná záznamy';
  heading.style.textAlign = 'center';
  heading.style.color = '#333';
  heading.style.marginBottom = '20px';
  container.appendChild(heading);
  
  // Admin tlačidlá - zobrazia sa len pre admina
  const adminButtons = document.createElement('div');
  adminButtons.id = 'adminButtons';
  adminButtons.style.display = 'none';
  adminButtons.style.gap = '10px';
  adminButtons.style.justifyContent = 'center';
  adminButtons.style.marginBottom = '20px';
  
  const btnAplikacia = document.createElement('button');
  btnAplikacia.id = 'btnAplikacia';
  btnAplikacia.textContent = '📋 Aplikácia';
  btnAplikacia.style.padding = '10px 20px';
  btnAplikacia.style.border = 'none';
  btnAplikacia.style.borderRadius = '4px';
  btnAplikacia.style.fontSize = '14px';
  btnAplikacia.style.cursor = 'pointer';
  btnAplikacia.style.backgroundColor = '#1976D2';
  btnAplikacia.style.color = 'white';
  btnAplikacia.style.transition = 'background-color 0.3s';
  btnAplikacia.onclick = window.zobrazAplikaciu;
  
  const btnPouzivatelia = document.createElement('button');
  btnPouzivatelia.id = 'btnPouzivatelia';
  btnPouzivatelia.textContent = '👥 Používatelia';
  btnPouzivatelia.style.padding = '10px 20px';
  btnPouzivatelia.style.border = 'none';
  btnPouzivatelia.style.borderRadius = '4px';
  btnPouzivatelia.style.fontSize = '14px';
  btnPouzivatelia.style.cursor = 'pointer';
  btnPouzivatelia.style.backgroundColor = '#e0e0e0';
  btnPouzivatelia.style.color = '#333';
  btnPouzivatelia.style.transition = 'background-color 0.3s';
  btnPouzivatelia.onclick = window.zobrazPouzivatelovAdmin;
  
  adminButtons.appendChild(btnAplikacia);
  adminButtons.appendChild(btnPouzivatelia);
  container.appendChild(adminButtons);
  
  // Správa o čakaní na schválenie
  const approvalMessage = document.createElement('div');
  approvalMessage.id = 'approvalMessage';
  approvalMessage.style.display = 'none';
  approvalMessage.style.marginTop = '20px';
  approvalMessage.style.padding = '20px';
  approvalMessage.style.backgroundColor = '#fff3e0';
  approvalMessage.style.borderRadius = '4px';
  approvalMessage.style.border = '1px solid #ffe0b2';
  approvalMessage.style.textAlign = 'center';
  
  const approvalTitle = document.createElement('h3');
  approvalTitle.textContent = '⏳ Čakáte na schválenie';
  approvalTitle.style.color = '#e65100';
  approvalTitle.style.margin = '0 0 10px 0';
  approvalMessage.appendChild(approvalTitle);
  
  const approvalText = document.createElement('p');
  approvalText.textContent = 'Váš účet bol vytvorený, ale ešte nebol schválený administrátorom.';
  approvalText.style.margin = '0 0 5px 0';
  approvalMessage.appendChild(approvalText);
  
  const approvalText2 = document.createElement('p');
  approvalText2.textContent = 'Po schválení sa vám zobrazí plný obsah aplikácie.';
  approvalText2.style.margin = '0';
  approvalText2.style.fontSize = '14px';
  approvalText2.style.color = '#666';
  approvalMessage.appendChild(approvalText2);
  
  container.appendChild(approvalMessage);
  
  // Obsahová oblasť (zobrazí sa len schváleným používateľom)
  const contentArea = document.createElement('div');
  contentArea.id = 'contentArea';
  contentArea.style.display = 'none';
  contentArea.style.marginTop = '20px';
  contentArea.style.padding = '20px';
  contentArea.style.backgroundColor = '#e3f2fd';
  contentArea.style.borderRadius = '4px';
  contentArea.style.border = '1px solid #bbdefb';
  
  const contentTitle = document.createElement('h3');
  contentTitle.textContent = '📋 Obsah aplikácie';
  contentTitle.style.margin = '0 0 15px 0';
  contentTitle.style.color = '#1565c0';
  contentArea.appendChild(contentTitle);
  
  const contentText = document.createElement('p');
  contentText.textContent = 'Tu bude neskôr obsah vašej aplikácie.';
  contentText.style.margin = '0';
  contentText.style.color = '#555';
  contentArea.appendChild(contentText);
  
  container.appendChild(contentArea);
  
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
  adminTitle.textContent = '👑 Správa používateľov';
  adminTitle.style.margin = '0 0 15px 0';
  adminTitle.style.color = '#e65100';
  adminPanel.appendChild(adminTitle);
  
  const usersList = document.createElement('div');
  usersList.id = 'usersList';
  adminPanel.appendChild(usersList);
  
  container.appendChild(adminPanel);
  
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
        statusDiv.innerHTML = '✅ Odhlásenie úspešné!';
        statusDiv.style.color = 'green';
        document.getElementById('loggedInContainer').style.display = 'none';
        document.getElementById('authContainer').style.display = 'block';
        // Skryť tlačidlo a status
        logoutBtn.style.display = 'none';
        setTimeout(() => {
          if (statusDiv) {
            statusDiv.textContent = '';
            statusDiv.style.color = '';
          }
        }, 3000);
      } else {
        statusDiv.textContent = '❌ ' + result.error;
        statusDiv.style.color = 'red';
      }
    } catch (error) {
      statusDiv.textContent = '❌ Nastala chyba pri odhlásení: ' + error.message;
      statusDiv.style.color = 'red';
    } finally {
      logoutBtn.disabled = false;
      logoutBtn.textContent = 'Odhlásiť sa';
      logoutBtn.style.opacity = '1';
    }
  });
  
  // Skryť tlačidlo na začiatku
  logoutBtn.style.display = 'none';
  
  // Zobraziť tlačidlo keď je používateľ prihlásený
  onAuthStateChanged(auth, (user) => {
    if (user) {
      logoutBtn.style.display = 'block';
    } else {
      logoutBtn.style.display = 'none';
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
  passwordGroup.style.position = 'relative';
  
  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'Heslo';
  passwordLabel.style.display = 'block';
  passwordLabel.style.marginBottom = '5px';
  passwordLabel.style.fontWeight = 'bold';
  passwordGroup.appendChild(passwordLabel);
  
  const passwordWrapper = document.createElement('div');
  passwordWrapper.style.position = 'relative';
  passwordWrapper.style.width = '100%';
  
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'regPassword';
  passwordInput.required = true;
  passwordInput.placeholder = 'Minimálne 6 znakov';
  passwordInput.minLength = 6;
  passwordInput.style.width = '100%';
  passwordInput.style.padding = '10px';
  passwordInput.style.paddingRight = '40px';
  passwordInput.style.border = '1px solid #ddd';
  passwordInput.style.borderRadius = '4px';
  passwordInput.style.fontSize = '14px';
  passwordInput.style.boxSizing = 'border-box';
  passwordWrapper.appendChild(passwordInput);
  
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.style.position = 'absolute';
  toggleBtn.style.right = '10px';
  toggleBtn.style.top = '50%';
  toggleBtn.style.transform = 'translateY(-50%)';
  toggleBtn.style.background = 'none';
  toggleBtn.style.border = 'none';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.padding = '5px';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.justifyContent = 'center';
  toggleBtn.style.color = '#666';
  toggleBtn.style.fontSize = '18px';
  
  toggleBtn.innerHTML = `
    <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  `;
  
  let isPasswordVisible = false;
  
  toggleBtn.addEventListener('click', () => {
    isPasswordVisible = !isPasswordVisible;
    passwordInput.type = isPasswordVisible ? 'text' : 'password';
    
    if (isPasswordVisible) {
      toggleBtn.innerHTML = `
        <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          <line x1="21" y1="3" x2="3" y2="21" stroke="currentColor" stroke-width="2" />
        </svg>
      `;
    } else {
      toggleBtn.innerHTML = `
        <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      `;
    }
  });
  
  passwordWrapper.appendChild(toggleBtn);
  passwordGroup.appendChild(passwordWrapper);
  form.appendChild(passwordGroup);
  
  // Potvrdenie hesla
  const confirmPasswordGroup = document.createElement('div');
  confirmPasswordGroup.style.marginBottom = '15px';
  confirmPasswordGroup.style.position = 'relative';
  
  const confirmPasswordLabel = document.createElement('label');
  confirmPasswordLabel.textContent = 'Potvrdenie hesla';
  confirmPasswordLabel.style.display = 'block';
  confirmPasswordLabel.style.marginBottom = '5px';
  confirmPasswordLabel.style.fontWeight = 'bold';
  confirmPasswordGroup.appendChild(confirmPasswordLabel);
  
  const confirmPasswordWrapper = document.createElement('div');
  confirmPasswordWrapper.style.position = 'relative';
  confirmPasswordWrapper.style.width = '100%';
  
  const confirmPasswordInput = document.createElement('input');
  confirmPasswordInput.type = 'password';
  confirmPasswordInput.id = 'regConfirmPassword';
  confirmPasswordInput.required = true;
  confirmPasswordInput.placeholder = 'Zopakujte heslo';
  confirmPasswordInput.style.width = '100%';
  confirmPasswordInput.style.padding = '10px';
  confirmPasswordInput.style.paddingRight = '40px';
  confirmPasswordInput.style.border = '1px solid #ddd';
  confirmPasswordInput.style.borderRadius = '4px';
  confirmPasswordInput.style.fontSize = '14px';
  confirmPasswordInput.style.boxSizing = 'border-box';
  confirmPasswordWrapper.appendChild(confirmPasswordInput);
  
  // Tlačidlo pre zobrazenie/skrytie potvrdenia hesla
  const confirmToggleBtn = document.createElement('button');
  confirmToggleBtn.type = 'button';
  confirmToggleBtn.style.position = 'absolute';
  confirmToggleBtn.style.right = '10px';
  confirmToggleBtn.style.top = '50%';
  confirmToggleBtn.style.transform = 'translateY(-50%)';
  confirmToggleBtn.style.background = 'none';
  confirmToggleBtn.style.border = 'none';
  confirmToggleBtn.style.cursor = 'pointer';
  confirmToggleBtn.style.padding = '5px';
  confirmToggleBtn.style.display = 'flex';
  confirmToggleBtn.style.alignItems = 'center';
  confirmToggleBtn.style.justifyContent = 'center';
  confirmToggleBtn.style.color = '#666';
  confirmToggleBtn.style.fontSize = '18px';
  
  confirmToggleBtn.innerHTML = `
    <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  `;
  
  let isConfirmPasswordVisible = false;
  
  confirmToggleBtn.addEventListener('click', () => {
    isConfirmPasswordVisible = !isConfirmPasswordVisible;
    confirmPasswordInput.type = isConfirmPasswordVisible ? 'text' : 'password';
    
    if (isConfirmPasswordVisible) {
      confirmToggleBtn.innerHTML = `
        <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          <line x1="21" y1="3" x2="3" y2="21" stroke="currentColor" stroke-width="2" />
        </svg>
      `;
    } else {
      confirmToggleBtn.innerHTML = `
        <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      `;
    }
  });
  
  confirmPasswordWrapper.appendChild(confirmToggleBtn);
  confirmPasswordGroup.appendChild(confirmPasswordWrapper);
  form.appendChild(confirmPasswordGroup);
  
  // Správa o zhode hesiel
  const passwordMatchMessage = document.createElement('div');
  passwordMatchMessage.id = 'passwordMatchMessage';
  passwordMatchMessage.style.marginTop = '-10px';
  passwordMatchMessage.style.marginBottom = '10px';
  passwordMatchMessage.style.fontSize = '13px';
  passwordMatchMessage.style.color = '#f44336';
  passwordMatchMessage.style.display = 'none';
  form.appendChild(passwordMatchMessage);
  
  // Kontrola zhody hesiel pri zmene
  function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword.length === 0) {
      passwordMatchMessage.style.display = 'none';
      return true;
    }
    
    if (password === confirmPassword) {
      passwordMatchMessage.style.display = 'none';
      return true;
    } else {
      passwordMatchMessage.textContent = '❌ Heslá sa nezhodujú!';
      passwordMatchMessage.style.display = 'block';
      return false;
    }
  }
  
  passwordInput.addEventListener('input', checkPasswordMatch);
  confirmPasswordInput.addEventListener('input', checkPasswordMatch);
  
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
  
  // Link na prepnutie na prihlásenie
  const switchLink = document.createElement('p');
  switchLink.style.textAlign = 'center';
  switchLink.style.marginTop = '15px';
  switchLink.style.fontSize = '14px';
  switchLink.style.color = '#555';
  switchLink.innerHTML = 'Už máte svoj účet? <a href="#" id="switchToLogin" style="color:#2196F3;text-decoration:none;cursor:pointer;font-weight:bold;">Prihláste sa.</a>';
  form.appendChild(switchLink);
  
  const messageDiv = document.createElement('div');
  messageDiv.id = 'regMessage';
  messageDiv.style.marginTop = '15px';
  messageDiv.style.textAlign = 'center';
  messageDiv.style.fontSize = '14px';
  form.appendChild(messageDiv);
  
  container.appendChild(form);
  
  // Event listener pre prepnutie na prihlásenie
  switchLink.querySelector('#switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    vymazStatusSpravy();
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Skontrolovať zhodu hesiel
    if (!checkPasswordMatch()) {
      passwordMatchMessage.textContent = '❌ Heslá sa nezhodujú!';
      passwordMatchMessage.style.display = 'block';
      return;
    }
    
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
        const statusText = result.approved ? 'OKAMŽITE SCHVÁLENÝ' : 'ČAKÁ NA SCHVÁLENIE ADMINOM';
        messageDiv.innerHTML = `✅ Registrácia úspešná!<br>Vaša rola: <strong>${roleText}</strong><br>Stav: <strong>${statusText}</strong>`;
        messageDiv.style.color = result.approved ? 'green' : 'orange';
        form.reset();
        passwordMatchMessage.style.display = 'none';
        
        // Automaticky prepnúť na prihlasovací formulár po úspešnej registrácii
        setTimeout(() => {
          document.getElementById('registerForm').style.display = 'none';
          document.getElementById('loginForm').style.display = 'block';
          vymazStatusSpravy();
        }, 3000);
      } else {
        // Zobrazenie chybovej správy - použijeme priamo chybovú správu z funkcie
        messageDiv.textContent = '❌ ' + result.error;
        messageDiv.style.color = 'red';
      }
    } catch (error) {
      // Toto by nemalo nastať, ale pre istotu
      messageDiv.textContent = '❌ Nastala neočakávaná chyba: ' + error.message;
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
  container.style.display = 'block';
  
  const heading = document.createElement('h2');
  heading.textContent = 'Prihlásiť sa';
  heading.style.textAlign = 'center';
  heading.style.color = '#333';
  heading.style.marginBottom = '20px';
  container.appendChild(heading);
  
  const form = document.createElement('form');
  
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
  
  const passwordGroup = document.createElement('div');
  passwordGroup.style.marginBottom = '15px';
  passwordGroup.style.position = 'relative';
  
  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'Heslo';
  passwordLabel.style.display = 'block';
  passwordLabel.style.marginBottom = '5px';
  passwordLabel.style.fontWeight = 'bold';
  passwordGroup.appendChild(passwordLabel);
  
  const passwordWrapper = document.createElement('div');
  passwordWrapper.style.position = 'relative';
  passwordWrapper.style.width = '100%';
  
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'loginPassword';
  passwordInput.required = true;
  passwordInput.placeholder = 'Vaše heslo';
  passwordInput.style.width = '100%';
  passwordInput.style.padding = '10px';
  passwordInput.style.paddingRight = '40px';
  passwordInput.style.border = '1px solid #ddd';
  passwordInput.style.borderRadius = '4px';
  passwordInput.style.fontSize = '14px';
  passwordInput.style.boxSizing = 'border-box';
  passwordWrapper.appendChild(passwordInput);
  
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.style.position = 'absolute';
  toggleBtn.style.right = '10px';
  toggleBtn.style.top = '50%';
  toggleBtn.style.transform = 'translateY(-50%)';
  toggleBtn.style.background = 'none';
  toggleBtn.style.border = 'none';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.padding = '5px';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.justifyContent = 'center';
  toggleBtn.style.color = '#666';
  toggleBtn.style.fontSize = '18px';
  
  toggleBtn.innerHTML = `
    <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  `;
  
  let isPasswordVisible = false;
  
  toggleBtn.addEventListener('click', () => {
    isPasswordVisible = !isPasswordVisible;
    passwordInput.type = isPasswordVisible ? 'text' : 'password';
    
    if (isPasswordVisible) {
      toggleBtn.innerHTML = `
        <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          <line x1="21" y1="3" x2="3" y2="21" stroke="currentColor" stroke-width="2" />
        </svg>
      `;
    } else {
      toggleBtn.innerHTML = `
        <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      `;
    }
  });
  
  passwordWrapper.appendChild(toggleBtn);
  passwordGroup.appendChild(passwordWrapper);
  form.appendChild(passwordGroup);
  
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
  
  // Link na prepnutie na registráciu
  const switchLink = document.createElement('p');
  switchLink.style.textAlign = 'center';
  switchLink.style.marginTop = '15px';
  switchLink.style.fontSize = '14px';
  switchLink.style.color = '#555';
  switchLink.innerHTML = 'Ešte nemáte svoj účet? <a href="#" id="switchToRegister" style="color:#4CAF50;text-decoration:none;cursor:pointer;font-weight:bold;">Registrujte sa.</a>';
  form.appendChild(switchLink);
  
  const messageDiv = document.createElement('div');
  messageDiv.id = 'loginMessage';
  messageDiv.style.marginTop = '15px';
  messageDiv.style.textAlign = 'center';
  messageDiv.style.fontSize = '14px';
  form.appendChild(messageDiv);
  
  container.appendChild(form);
  
  // Event listener pre prepnutie na registráciu
  switchLink.querySelector('#switchToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    vymazStatusSpravy();
  });
  
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
        messageDiv.innerHTML = '✅ Prihlásenie úspešné!';
        messageDiv.style.color = 'green';
        form.reset();
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
  if (!datum) return 'Neznámy';
  const d = new Date(datum);
  return d.toLocaleDateString('sk-SK') + ' ' + d.toLocaleTimeString('sk-SK', {hour: '2-digit', minute: '2-digit'});
}

function validujCislo(hodnota) {
  return !isNaN(parseFloat(hodnota)) && isFinite(hodnota);
}
