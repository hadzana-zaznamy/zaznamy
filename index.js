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
  query, where, orderBy, limit,
  onSnapshot
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

// Pridať globálny štýl pre full-width layout
const style = document.createElement('style');
style.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html, body {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background-color: #f5f7fa;
  }
  
  #authContainer, #loggedInContainer {
    width: 100%;
    max-width: none !important;
    margin: 0 !important;
    padding: 20px !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    min-height: 100vh;
    background-color: #f5f7fa;
  }
  
  #authContainer {
    display: none;
    justify-content: center;
    align-items: center;
  }
  
  #authContainer > div {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    padding: 30px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  
  #loggedInContainer {
    padding-top: 80px !important;
    background-color: #f5f7fa;
    min-height: 100vh;
  }
  
  #authContainer h1 {
    font-size: 28px;
    margin-bottom: 30px;
  }
  
  #loggedInContainer h1 {
    font-size: 28px;
    margin-bottom: 20px;
  }
  
  #contentArea, #adminPanel {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 25px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  
  #adminButtons {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto 20px auto;
    display: none;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  #adminButtons button {
    flex: 1;
    min-width: 150px;
    max-width: 200px;
    padding: 12px 20px;
  }
  
  #usersList table {
    width: 100%;
    min-width: 600px;
  }
  
  #usersList {
    overflow-x: auto;
    width: 100%;
  }
  
  .auth-card {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    padding: 30px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  
  .auth-card h2 {
    font-size: 24px;
    margin-bottom: 25px;
  }
  
  .auth-card form input {
    font-size: 16px;
    padding: 12px 15px;
  }
  
  .auth-card form button {
    font-size: 18px;
    padding: 14px;
    margin-top: 5px;
  }
  
  #approvalMessage {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto 20px auto;
    padding: 25px;
    background: #fff3e0;
    border-radius: 12px;
    border: 1px solid #ffe0b2;
  }
  
  #logoutBtn {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  }
  
  #logoutBtn:hover {
    background-color: #d32f2f;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(244, 67, 54, 0.4);
  }
  
  .btn-approve {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    background-color: #4CAF50;
    color: white;
    transition: background-color 0.3s;
  }
  
  .btn-approve:hover {
    background-color: #388E3C;
  }
  
  .btn-reject {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    background-color: #FF9800;
    color: white;
    transition: background-color 0.3s;
  }
  
  .btn-reject:hover {
    background-color: #F57C00;
  }
  
  .btn-remove-user {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    background-color: #f44336;
    color: white;
    transition: background-color 0.3s;
  }
  
  .btn-remove-user:hover {
    background-color: #d32f2f;
  }
  
  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.3s;
  }
  
  .modal-overlay.active {
    display: flex;
  }
  
  .modal-box {
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    animation: slideUp 0.3s ease-out;
    position: relative;
  }
  
  .modal-box .modal-icon {
    font-size: 48px;
    text-align: center;
    margin-bottom: 15px;
  }
  
  .modal-box h3 {
    text-align: center;
    margin-bottom: 10px;
    font-size: 22px;
  }
  
  .modal-box p {
    text-align: center;
    margin-bottom: 20px;
    color: #555;
    line-height: 1.6;
  }
  
  .modal-box .modal-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .modal-box .modal-buttons button {
    padding: 10px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-weight: 500;
  }
  
  .modal-box .modal-buttons .btn-confirm {
    background-color: #4CAF50;
    color: white;
  }
  
  .modal-box .modal-buttons .btn-confirm:hover {
    background-color: #388E3C;
  }
  
  .modal-box .modal-buttons .btn-cancel {
    background-color: #e0e0e0;
    color: #333;
  }
  
  .modal-box .modal-buttons .btn-cancel:hover {
    background-color: #d5d5d5;
  }
  
  .modal-box .modal-buttons .btn-danger {
    background-color: #f44336;
    color: white;
  }
  
  .modal-box .modal-buttons .btn-danger:hover {
    background-color: #d32f2f;
  }
  
  .modal-box .modal-buttons .btn-warning {
    background-color: #FF9800;
    color: white;
  }
  
  .modal-box .modal-buttons .btn-warning:hover {
    background-color: #F57C00;
  }
  
  .modal-box .modal-close {
    position: absolute;
    top: 12px;
    right: 16px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
    transition: color 0.3s;
  }
  
  .modal-box .modal-close:hover {
    color: #333;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @media (max-width: 768px) {
    #authContainer > div, .auth-card {
      padding: 20px;
      margin: 0 10px;
    }
    
    #loggedInContainer {
      padding: 70px 15px 20px 15px !important;
    }
    
    #contentArea, #adminPanel, #approvalMessage {
      padding: 20px 15px;
      border-radius: 8px;
    }
    
    #adminButtons button {
      min-width: 120px;
      font-size: 13px;
      padding: 10px 15px;
    }
    
    #authContainer h1, #loggedInContainer h1 {
      font-size: 24px;
    }
    
    #logoutBtn {
      top: 15px;
      right: 15px;
      padding: 10px 18px;
      font-size: 13px;
    }
    
    #usersList table {
      font-size: 13px;
      min-width: 500px;
    }
    
    #usersList table th,
    #usersList table td {
      padding: 8px 10px !important;
    }
    
    .modal-box {
      padding: 20px;
      width: 95%;
    }
  }
  
  @media (max-width: 480px) {
    #authContainer > div, .auth-card {
      padding: 15px;
      margin: 0 5px;
    }
    
    #loggedInContainer {
      padding: 60px 10px 15px 10px !important;
    }
    
    #contentArea, #adminPanel, #approvalMessage {
      padding: 15px 12px;
    }
    
    #adminButtons {
      flex-direction: column;
      align-items: center;
    }
    
    #adminButtons button {
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    
    #authContainer h1, #loggedInContainer h1 {
      font-size: 20px;
    }
    
    #logoutBtn {
      top: 10px;
      right: 10px;
      padding: 8px 14px;
      font-size: 12px;
      border-radius: 6px;
    }
    
    #usersList table {
      font-size: 12px;
      min-width: 400px;
    }
    
    .modal-box {
      padding: 16px;
    }
    
    .modal-box h3 {
      font-size: 18px;
    }
    
    .modal-box .modal-buttons button {
      padding: 8px 16px;
      font-size: 13px;
    }
  }
`;
document.head.appendChild(style);

// Funkcie pre modálne okná
function showModal(options) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    
    const modal = document.createElement('div');
    modal.className = 'modal-box';
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => {
      overlay.remove();
      resolve('cancel');
    };
    modal.appendChild(closeBtn);
    
    // Icon
    if (options.icon) {
      const icon = document.createElement('div');
      icon.className = 'modal-icon';
      icon.textContent = options.icon;
      modal.appendChild(icon);
    }
    
    // Title
    if (options.title) {
      const title = document.createElement('h3');
      title.textContent = options.title;
      modal.appendChild(title);
    }
    
    // Message
    if (options.message) {
      const message = document.createElement('p');
      message.innerHTML = options.message;
      modal.appendChild(message);
    }
    
    // Buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'modal-buttons';
    
    if (options.type === 'confirm' || options.type === 'danger' || options.type === 'warning') {
      const confirmBtn = document.createElement('button');
      const btnClass = options.type === 'danger' ? 'btn-danger' : 
                       options.type === 'warning' ? 'btn-warning' : 'btn-confirm';
      confirmBtn.className = btnClass;
      confirmBtn.textContent = options.confirmText || 'Potvrdiť';
      confirmBtn.onclick = () => {
        overlay.remove();
        resolve('confirm');
      };
      buttonsDiv.appendChild(confirmBtn);
      
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-cancel';
      cancelBtn.textContent = options.cancelText || 'Zrušiť';
      cancelBtn.onclick = () => {
        overlay.remove();
        resolve('cancel');
      };
      buttonsDiv.appendChild(cancelBtn);
    } else if (options.type === 'alert') {
      const okBtn = document.createElement('button');
      okBtn.className = 'btn-confirm';
      okBtn.textContent = options.okText || 'OK';
      okBtn.onclick = () => {
        overlay.remove();
        resolve('ok');
      };
      buttonsDiv.appendChild(okBtn);
    }
    
    modal.appendChild(buttonsDiv);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Click outside to close (only for alert type)
    if (options.type === 'alert') {
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve('ok');
        }
      };
    }
  });
}

// Vytvorenie modálnych funkcií
async function showAlert(message, title = 'Informácia', icon = 'ℹ️') {
  return showModal({ type: 'alert', title, message, icon, okText: 'OK' });
}

async function showConfirm(message, title = 'Potvrdenie', icon = '❓') {
  return showModal({ type: 'confirm', title, message, icon, confirmText: 'Áno', cancelText: 'Nie' });
}

async function showDangerConfirm(message, title = 'Varovanie', icon = '⚠️') {
  return showModal({ type: 'danger', title, message, icon, confirmText: 'Odstrániť', cancelText: 'Zrušiť' });
}

async function showWarningConfirm(message, title = 'Potvrdenie', icon = '⚠️') {
  return showModal({ type: 'warning', title, message, icon, confirmText: 'Potvrdiť', cancelText: 'Zrušiť' });
}

document.addEventListener('DOMContentLoaded', inicializujAplikaciu);

function inicializujAplikaciu() {
  const appObj = {
    zaznamy: [],
    aktualnyZaznam: null,
    aktualnyPouzivatel: null,
    aktualnyPouzivatelRole: null,
    aktualnyPouzivatelApproved: null,
    vsetciPouzivatelia: [],
    zobrazenieAdmin: 'aplikacia',
    unsubscribeUsers: null,
    unsubscribeUser: null, // Nový listener pre aktuálneho používateľa
    
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
    
    // Nová metóda pre real-time listener na aktuálneho používateľa
    spustiRealTimeListenerPrePouzivatela: function(userId) {
      if (this.unsubscribeUser) {
        this.unsubscribeUser();
      }
      
      const userRef = doc(db, 'users', userId);
      this.unsubscribeUser = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const predoslyApproved = this.aktualnyPouzivatelApproved;
          const predoslaRole = this.aktualnyPouzivatelRole;
      
          this.aktualnyPouzivatelApproved = userData.approved || false;
          this.aktualnyPouzivatelRole = userData.role || 'user';
          
          // Ak sa zmenil status alebo rola, prerenderujeme UI
          if (predoslyApproved !== this.aktualnyPouzivatelApproved || 
              predoslaRole !== this.aktualnyPouzivatelRole) {
            prerenderujPodlaStavu(this.aktualnyPouzivatel);
          }
        } else {
          // Dokument používateľa bol odstránený - odhlásiť používateľa
          console.log('Používateľský dokument bol odstránený, odhlasujem používateľa');
          
          // Zobraziť upozornenie
          showAlert(
            'Váš účet bol odstránený administrátorom. Budete odhlásený.',
            'Účet odstránený',
            '⚠️'
          ).then(() => {
            // Odhlásiť používateľa
            signOut(auth).then(() => {
              // Zrušiť listener
              if (this.unsubscribeUser) {
                this.unsubscribeUser();
                this.unsubscribeUser = null;
              }
              // Aktualizovať UI
              this.aktualnyPouzivatel = null;
              this.aktualnyPouzivatelRole = null;
              this.aktualnyPouzivatelApproved = null;
              prerenderujPodlaStavu(null);
            }).catch((error) => {
              console.error('Chyba pri odhlásení:', error);
            });
          });
        }
      }, (error) => {
        console.error('Chyba v listeneri používateľa:', error);
      });
    },
    
    jePrvyPouzivatel: async function() {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'asc'), limit(1));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
      } catch (error) {
        console.error('Chyba pri kontrole prvého používateľa:', error);
        return false;
      }
    },
    
    registruj: async function(email, password) {
      try {
        const jePrvy = await this.jePrvyPouzivatel();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const role = jePrvy ? 'admin' : 'user';
        const approved = jePrvy ? true : false;
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: email,
          createdAt: new Date().toISOString(),
          role: role,
          approved: approved
        });
        
        return { success: true, user: user, role: role, approved: approved };
      } catch (error) {
        let errorMessage = error.message;
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
        // Odhlásiť real-time listenery
        if (this.unsubscribeUsers) {
          this.unsubscribeUsers();
          this.unsubscribeUsers = null;
        }
        if (this.unsubscribeUser) {
          this.unsubscribeUser();
          this.unsubscribeUser = null;
        }
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
    
    // Spustenie real-time listenera na používateľov
    spustiRealTimeListener: function() {
      if (this.unsubscribeUsers) {
        this.unsubscribeUsers();
      }
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'asc'));
      
      this.unsubscribeUsers = onSnapshot(q, (querySnapshot) => {
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
        zobrazPouzivatelov(pouzivatelia);
      }, (error) => {
        console.error('Chyba v real-time listeneri:', error);
      });
    },
    
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
    
    zamietniPouzivatela: async function(userId) {
      if (!this.aktualnyPouzivatel || this.aktualnyPouzivatelRole !== 'admin') {
        return { success: false, error: 'Nemáte oprávnenie na zamietanie používateľov' };
      }
      try {
        await updateDoc(doc(db, 'users', userId), {
          approved: false,
          rejectedAt: new Date().toISOString(),
          rejectedBy: this.aktualnyPouzivatel.uid
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    odstranPouzivatela: async function(userId, userEmail) {
      if (!this.aktualnyPouzivatel || this.aktualnyPouzivatelRole !== 'admin') {
        return { success: false, error: 'Nemáte oprávnenie na odstraňovanie používateľov' };
      }
      
      // Kontrola či neodstraňuje sám seba
      const jeSamSeba = userId === this.aktualnyPouzivatel.uid;
      
      try {
        await deleteDoc(doc(db, 'users', userId));
        
        // Skopírovať email do schránky
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(userEmail);
          } catch (clipboardError) {
            const tempInput = document.createElement('input');
            tempInput.value = userEmail;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
          }
        } else {
          const tempInput = document.createElement('input');
          tempInput.value = userEmail;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }
    
        // Ak admin odstránil sám seba, odhlásiť ho
        if (jeSamSeba) {
          // Odhlásiť používateľa
          await signOut(auth);
          this.aktualnyPouzivatel = null;
          this.aktualnyPouzivatelRole = null;
          this.aktualnyPouzivatelApproved = null;
          
          // Zrušiť listenery
          if (this.unsubscribeUsers) {
            this.unsubscribeUsers();
            this.unsubscribeUsers = null;
          }
          if (this.unsubscribeUser) {
            this.unsubscribeUser();
            this.unsubscribeUser = null;
          }
      
          return { success: true, email: userEmail, vlastnyUcet: true };
        }
        
        return { success: true, email: userEmail, vlastnyUcet: false };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    
    maPristup: function() {
      return this.aktualnyPouzivatel && this.aktualnyPouzivatelApproved === true;
    },
    
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
  
  vytvorAuthContainer();
  vytvorLoggedInContainer();
  
  const authContainer = document.getElementById('authContainer');
  const loggedInContainer = document.getElementById('loggedInContainer');
  
  if (authContainer) authContainer.style.display = 'none';
  if (loggedInContainer) loggedInContainer.style.display = 'none';
  
  onAuthStateChanged(auth, async (user) => {
    appObj.aktualnyPouzivatel = user;
    
    if (user) {
      // Zrušiť predchádzajúci listener
      if (appObj.unsubscribeUser) {
        appObj.unsubscribeUser();
        appObj.unsubscribeUser = null;
      }
      
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
        
        // Spustiť real-time listener pre aktuálneho používateľa
        appObj.spustiRealTimeListenerPrePouzivatela(user.uid);
        
      } catch (error) {
        console.error('Chyba pri načítaní údajov:', error);
        appObj.aktualnyPouzivatelRole = 'user';
        appObj.aktualnyPouzivatelApproved = false;
      }
      
      prerenderujPodlaStavu(user);
    } else {
      // Zrušiť listener pri odhlásení
      if (appObj.unsubscribeUser) {
        appObj.unsubscribeUser();
        appObj.unsubscribeUser = null;
      }
      
      if (authContainer) authContainer.style.display = 'flex';
      if (loggedInContainer) loggedInContainer.style.display = 'none';
      appObj.aktualnyPouzivatelRole = null;
      appObj.aktualnyPouzivatelApproved = null;
      
      if (appObj.unsubscribeUsers) {
        appObj.unsubscribeUsers();
        appObj.unsubscribeUsers = null;
      }
      
      vymazStatusSpravy();
      resetFormulare();
    }
  });
}

// Nová funkcia na prerenderovanie UI podľa stavu
function prerenderujPodlaStavu(user) {
  const authContainer = document.getElementById('authContainer');
  const loggedInContainer = document.getElementById('loggedInContainer');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (!user) {
    if (authContainer) authContainer.style.display = 'flex';
    if (loggedInContainer) loggedInContainer.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    return;
  }
  
  const jeSchvaleny = window.app.maPristup();
  const jeAdmin = window.app.jeAdmin();
  
  if (authContainer) authContainer.style.display = 'none';
  if (loggedInContainer) {
    loggedInContainer.style.display = 'block';
    
    const contentDiv = document.getElementById('contentArea');
    const approvalMessage = document.getElementById('approvalMessage');
    
    if (contentDiv) {
      contentDiv.style.display = jeSchvaleny || jeAdmin ? 'block' : 'none';
    }
    
    if (approvalMessage) {
      approvalMessage.style.display = (!jeSchvaleny && !jeAdmin) ? 'block' : 'none';
    }
    
    if (jeAdmin) {
      const adminPanel = document.getElementById('adminPanel');
      const adminButtons = document.getElementById('adminButtons');
      
      if (!window.app.unsubscribeUsers) {
        window.app.spustiRealTimeListener();
      }
      
      window.app.nacitajVsetkychPouzivatelov().then(() => {
        zobrazPouzivatelov(window.app.vsetciPouzivatelia);
      });
      
      if (adminPanel) {
        adminPanel.style.display = 'none';
      }
      
      if (adminButtons) {
        adminButtons.style.display = 'flex';
      }
      
      const btnAplikacia = document.getElementById('btnAplikacia');
      const btnPouzivatelia = document.getElementById('btnPouzivatelia');
      
      if (btnAplikacia && btnPouzivatelia) {
        btnAplikacia.style.backgroundColor = '#1976D2';
        btnAplikacia.style.color = 'white';
        btnPouzivatelia.style.backgroundColor = '#e0e0e0';
        btnPouzivatelia.style.color = '#333';
      }
      
      if (document.getElementById('contentArea')) {
        document.getElementById('contentArea').style.display = 'block';
      }
      if (document.getElementById('adminPanel')) {
        document.getElementById('adminPanel').style.display = 'none';
      }
    } else {
      const adminPanel = document.getElementById('adminPanel');
      const adminButtons = document.getElementById('adminButtons');
      
      if (adminPanel) adminPanel.style.display = 'none';
      if (adminButtons) adminButtons.style.display = 'none';
      
      if (window.app.unsubscribeUsers) {
        window.app.unsubscribeUsers();
        window.app.unsubscribeUsers = null;
      }
    }
  }
  
  if (logoutBtn) logoutBtn.style.display = 'block';
  vymazStatusSpravy();
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
        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">Email</th>
        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">Rola</th>
        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">Stav</th>
        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">Registrovaný</th>
        <th style="padding:12px;text-align:left;border-bottom:2px solid #ddd;">Akcia</th>
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
        <td style="padding:12px;">${user.email}</td>
        <td style="padding:12px;">
          <span style="padding:4px 12px;border-radius:12px;font-size:12px;${jeAdmin ? 'background-color:#fff3e0;color:#e65100;' : 'background-color:#e3f2fd;color:#1565c0;'}">
            ${jeAdmin ? 'Admin' : 'User'}
          </span>
        </td>
        <td style="padding:12px;">
          <span style="padding:4px 12px;border-radius:12px;font-size:12px;${jeSchvaleny ? 'background-color:#c8e6c9;color:#2e7d32;' : 'background-color:#ffcdd2;color:#c62828;'}">
            ${jeSchvaleny ? 'Schválený' : 'Čaká'}
          </span>
        </td>
        <td style="padding:12px;font-size:12px;color:#666;">
          ${formatujDatum(user.createdAt)}
        </td>
        <td style="padding:12px;">
          ${!jeAdmin ? `
            <div style="display:flex;flex-wrap:wrap;gap:5px;">
              ${!jeSchvaleny ? `
                <button onclick="schvalPouzivatela('${user.id}')" 
                        class="btn-approve">
                  ✓ Schváliť
                </button>
              ` : `
                <button onclick="zamietniPouzivatela('${user.id}')" 
                        class="btn-reject">
                  ✗ Zamietnuť
                </button>
              `}
              <button onclick="odstranPouzivatela('${user.id}', '${user.email}')" 
                      class="btn-remove-user">
                🗑️ Odstrániť
              </button>
            </div>
          ` : '<span style="font-size:12px;color:#999;">Admin</span>'}
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// Globálna funkcia pre admina na schválenie používateľa
window.schvalPouzivatela = async function(userId) {
  const confirmed = await showWarningConfirm(
    'Naozaj chcete schváliť tohto používateľa?',
    'Schválenie používateľa',
    '✅'
  );
  
  if (confirmed !== 'confirm') return;
  
  try {
    const result = await window.app.schvalPouzivatela(userId);
    if (result.success) {
      await showAlert(
        'Používateľ bol úspešne schválený!<br><br>Ak bol schválený práve prihlásený používateľ, jeho stav sa automaticky aktualizuje.',
        'Úspech',
        '✅'
      );
      // Načítať používateľov znova
      await window.app.nacitajVsetkychPouzivatelov();
      zobrazPouzivatelov(window.app.vsetciPouzivatelia);
    } else {
      await showAlert(
        '❌ ' + result.error,
        'Chyba',
        '❌'
      );
    }
  } catch (error) {
    await showAlert(
      '❌ Nastala chyba: ' + error.message,
      'Chyba',
      '❌'
    );
  }
};

// Globálna funkcia pre admina na zamietnutie používateľa
window.zamietniPouzivatela = async function(userId) {
  const confirmed = await showWarningConfirm(
    'Naozaj chcete ZAMIETNUŤ tohto používateľa? Jeho stav sa zmení na "Čaká".',
    'Zamietnutie používateľa',
    '⚠️'
  );
  
  if (confirmed !== 'confirm') return;
  
  try {
    const result = await window.app.zamietniPouzivatela(userId);
    if (result.success) {
      await showAlert(
        'Používateľ bol zamietnutý!<br><br>Jeho stav je teraz "Čaká".<br>Ak bol zamietnutý práve prihlásený používateľ, jeho stav sa automaticky aktualizuje.',
        'Úspech',
        '✅'
      );
      // Načítať používateľov znova
      await window.app.nacitajVsetkychPouzivatelov();
      zobrazPouzivatelov(window.app.vsetciPouzivatelia);
    } else {
      await showAlert(
        '❌ ' + result.error,
        'Chyba',
        '❌'
      );
    }
  } catch (error) {
    await showAlert(
      '❌ Nastala chyba: ' + error.message,
      'Chyba',
      '❌'
    );
  }
};

// Globálna funkcia pre admina na odstránenie používateľa
window.odstranPouzivatela = async function(userId, userEmail) {
  const confirmed = await showDangerConfirm(
    `Naozaj chcete ODSTRÁNIŤ používateľa <strong>${userEmail}</strong>?<br><br>Po odstránení bude jeho email skopírovaný do schránky a otvorí sa Firebase Console pre manuálne vymazanie účtu.${userId === window.app.aktualnyPouzivatel?.uid ? '<br><br><strong style="color:red;">⚠️ POZOR: Toto je váš vlastný účet!</strong>' : ''}`,
    'Odstránenie používateľa',
    '🗑️'
  );
  
  if (confirmed !== 'confirm') return;
  
  try {
    const result = await window.app.odstranPouzivatela(userId, userEmail);
    
    if (result.success) {
      if (result.vlastnyUcet) {
        await showAlert(
          `✅ Váš účet <strong>${result.email}</strong> bol odstránený!<br><br>📧 Email bol skopírovaný do schránky.<br>🌐 Otvára sa Firebase Console pre manuálne vymazanie účtu.<br><br><strong style="color:#f44336;">Budete odhlásený.</strong>`,
          'Vlastný účet odstránený',
          '⚠️'
        );
        window.open('https://console.firebase.google.com/project/z-a-z-n-a-m-y/authentication/users', '_blank');
      } else {
        await showAlert(
          `✅ Používateľ <strong>${result.email}</strong> bol odstránený z databázy!<br><br>📧 Email bol skopírovaný do schránky.<br>🌐 Otvára sa Firebase Console pre manuálne vymazanie účtu.`,
          'Úspech',
          '✅'
        );
        window.open('https://console.firebase.google.com/project/z-a-z-n-a-m-y/authentication/users', '_blank');
      }
    } else {
      await showAlert(
        '❌ ' + result.error,
        'Chyba',
        '❌'
      );
    }
  } catch (error) {
    await showAlert(
      '❌ Nastala chyba: ' + error.message,
      'Chyba',
      '❌'
    );
  }
};

window.zobrazAplikaciu = function() {
  document.getElementById('contentArea').style.display = 'block';
  document.getElementById('adminPanel').style.display = 'none';
  
  document.getElementById('btnAplikacia').style.backgroundColor = '#1976D2';
  document.getElementById('btnAplikacia').style.color = 'white';
  document.getElementById('btnPouzivatelia').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnPouzivatelia').style.color = '#333';
};

window.zobrazPouzivatelovAdmin = function() {
  document.getElementById('contentArea').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  
  document.getElementById('btnPouzivatelia').style.backgroundColor = '#1976D2';
  document.getElementById('btnPouzivatelia').style.color = 'white';
  document.getElementById('btnAplikacia').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnAplikacia').style.color = '#333';
};

function vytvorAuthContainer() {
  const container = document.createElement('div');
  container.id = 'authContainer';
  container.style.display = 'none';
  
  const authCard = document.createElement('div');
  authCard.className = 'auth-card';
  
  const heading = document.createElement('h1');
  heading.textContent = 'Hádzaná záznamy';
  heading.style.textAlign = 'center';
  heading.style.color = '#333';
  heading.style.marginBottom = '20px';
  authCard.appendChild(heading);
  
  const formsContainer = document.createElement('div');
  formsContainer.id = 'formsContainer';
  authCard.appendChild(formsContainer);
  
  const registerForm = vytvorRegistracnyFormular();
  const loginForm = vytvorPrihlasovaciFormular();
  
  formsContainer.appendChild(registerForm);
  formsContainer.appendChild(loginForm);
  
  container.appendChild(authCard);
  document.body.appendChild(container);
  
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
}

function vytvorLoggedInContainer() {
  const container = document.createElement('div');
  container.id = 'loggedInContainer';
  container.style.display = 'none';
  
  const heading = document.createElement('h1');
  heading.textContent = 'Hádzaná záznamy';
  heading.style.textAlign = 'center';
  heading.style.color = '#333';
  heading.style.marginBottom = '20px';
  container.appendChild(heading);
  
  // Admin buttons
  const adminButtons = document.createElement('div');
  adminButtons.id = 'adminButtons';
  adminButtons.style.display = 'none';
  
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
  
  // Approval message
  const approvalMessage = document.createElement('div');
  approvalMessage.id = 'approvalMessage';
  approvalMessage.style.display = 'none';
  
  const approvalTitle = document.createElement('h3');
  approvalTitle.textContent = '⏳ Čakáte na schválenie';
  approvalTitle.style.color = '#e65100';
  approvalTitle.style.margin = '0 0 10px 0';
  approvalMessage.appendChild(approvalTitle);
  
  const approvalText = document.createElement('p');
  approvalText.textContent = 'Váš účet bol vytvorený, ale ešte nebol schválený administrátorom.';
  approvalMessage.appendChild(approvalText);
  
  const approvalText2 = document.createElement('p');
  approvalText2.textContent = 'Po schválení sa vám zobrazí plný obsah aplikácie.';
  approvalText2.style.margin = '0';
  approvalText2.style.fontSize = '14px';
  approvalText2.style.color = '#666';
  approvalMessage.appendChild(approvalText2);
  
  container.appendChild(approvalMessage);
  
  // Content area
  const contentArea = document.createElement('div');
  contentArea.id = 'contentArea';
  contentArea.style.display = 'none';
  
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
  
  // Logout button
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'logoutBtn';
  logoutBtn.textContent = 'Odhlásiť sa';
  document.body.appendChild(logoutBtn);
  
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    logoutBtn.textContent = 'Odhlasujem...';
    logoutBtn.style.opacity = '0.7';
    
    try {
      const result = await window.app.odhlas();
      if (result.success) {
        document.getElementById('loggedInContainer').style.display = 'none';
        document.getElementById('authContainer').style.display = 'flex';
        logoutBtn.style.display = 'none';
      } else {
        await showAlert('❌ ' + result.error, 'Chyba', '❌');
      }
    } catch (error) {
      await showAlert('❌ Nastala chyba pri odhlásení: ' + error.message, 'Chyba', '❌');
    } finally {
      logoutBtn.disabled = false;
      logoutBtn.textContent = 'Odhlásiť sa';
      logoutBtn.style.opacity = '1';
    }
  });
  
  logoutBtn.style.display = 'none';
  
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
  emailInput.style.padding = '12px';
  emailInput.style.border = '1px solid #ddd';
  emailInput.style.borderRadius = '4px';
  emailInput.style.fontSize = '14px';
  emailInput.style.boxSizing = 'border-box';
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
  passwordInput.id = 'regPassword';
  passwordInput.required = true;
  passwordInput.placeholder = 'Minimálne 6 znakov';
  passwordInput.minLength = 6;
  passwordInput.style.width = '100%';
  passwordInput.style.padding = '12px';
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
    toggleBtn.innerHTML = isPasswordVisible ? `
      <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <line x1="21" y1="3" x2="3" y2="21" stroke="currentColor" stroke-width="2" />
      </svg>
    ` : `
      <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    `;
  });
  
  passwordWrapper.appendChild(toggleBtn);
  passwordGroup.appendChild(passwordWrapper);
  form.appendChild(passwordGroup);
  
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
  confirmPasswordInput.style.padding = '12px';
  confirmPasswordInput.style.paddingRight = '40px';
  confirmPasswordInput.style.border = '1px solid #ddd';
  confirmPasswordInput.style.borderRadius = '4px';
  confirmPasswordInput.style.fontSize = '14px';
  confirmPasswordInput.style.boxSizing = 'border-box';
  confirmPasswordWrapper.appendChild(confirmPasswordInput);
  
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
    confirmToggleBtn.innerHTML = isConfirmPasswordVisible ? `
      <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <line x1="21" y1="3" x2="3" y2="21" stroke="currentColor" stroke-width="2" />
      </svg>
    ` : `
      <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    `;
  });
  
  confirmPasswordWrapper.appendChild(confirmToggleBtn);
  confirmPasswordGroup.appendChild(confirmPasswordWrapper);
  form.appendChild(confirmPasswordGroup);
  
  const passwordMatchMessage = document.createElement('div');
  passwordMatchMessage.id = 'passwordMatchMessage';
  passwordMatchMessage.style.marginTop = '-10px';
  passwordMatchMessage.style.marginBottom = '10px';
  passwordMatchMessage.style.fontSize = '13px';
  passwordMatchMessage.style.color = '#f44336';
  passwordMatchMessage.style.display = 'none';
  form.appendChild(passwordMatchMessage);
  
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
  
  const button = document.createElement('button');
  button.type = 'submit';
  button.id = 'registerBtn';
  button.textContent = 'Registrovať sa';
  button.style.width = '100%';
  button.style.padding = '14px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.fontSize = '16px';
  button.style.cursor = 'pointer';
  button.style.transition = 'background-color 0.3s';
  form.appendChild(button);
  
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
  
  switchLink.querySelector('#switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    vymazStatusSpravy();
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
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
        setTimeout(() => {
          document.getElementById('registerForm').style.display = 'none';
          document.getElementById('loginForm').style.display = 'block';
          vymazStatusSpravy();
        }, 3000);
      } else {
        messageDiv.textContent = '❌ ' + result.error;
        messageDiv.style.color = 'red';
      }
    } catch (error) {
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
  emailInput.style.padding = '12px';
  emailInput.style.border = '1px solid #ddd';
  emailInput.style.borderRadius = '4px';
  emailInput.style.fontSize = '14px';
  emailInput.style.boxSizing = 'border-box';
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
  passwordInput.style.padding = '12px';
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
    toggleBtn.innerHTML = isPasswordVisible ? `
      <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <line x1="21" y1="3" x2="3" y2="21" stroke="currentColor" stroke-width="2" />
      </svg>
    ` : `
      <svg style="width:20px;height:20px;color:#666;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    `;
  });
  
  passwordWrapper.appendChild(toggleBtn);
  passwordGroup.appendChild(passwordWrapper);
  form.appendChild(passwordGroup);
  
  const button = document.createElement('button');
  button.type = 'submit';
  button.id = 'loginBtn';
  button.textContent = 'Prihlásiť sa';
  button.style.width = '100%';
  button.style.padding = '14px';
  button.style.backgroundColor = '#2196F3';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.fontSize = '16px';
  button.style.cursor = 'pointer';
  button.style.transition = 'background-color 0.3s';
  form.appendChild(button);
  
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
