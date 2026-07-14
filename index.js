// index.js - Aplikácia s App Check (reCAPTCHA v3)

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

// YouTube embed URL
const YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/';
const YOUTUBE_THUMBNAIL_URL = 'https://img.youtube.com/vi/';

// Mapovanie kategórií
const categoryMap = {
  "MLDKY": "Mladšie dorastenky",
  "STDKY": "Staršie dorastenky",
  "MLDCI": "Mladší dorastenci",
  "STDCI": "Starší dorastenci"
};

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
  
  /* Video card styles */
  .video-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    transition: transform 0.2s ease, box-shadow 0.2s;
    cursor: pointer;
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
  }
  
  .video-card:active {
    transform: scale(0.99);
  }
  
  .video-thumbnail {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    background: #000;
  }
  
  .video-thumbnail img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .video-thumbnail .play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: rgba(255, 0, 0, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
  }
  
  .video-thumbnail .play-button:hover {
    background: rgba(255, 0, 0, 1);
  }
  
  .video-thumbnail .play-button svg {
    width: 30px;
    height: 30px;
    fill: white;
    margin-left: 4px;
  }
  
  .video-details {
    padding: 12px 16px;
    font-size: 14px;
    color: #1f2937;
    text-align: left;
  }
  
  .video-details p {
    margin: 4px 0;
  }
  
  .video-details .video-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #999;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #eee;
  }
  
  .filters-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    padding: 20px 16px;
    background: white;
    border-radius: 12px;
    margin-bottom: 20px;
  }
  
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    width: 100%;
  }
  
  .filters select {
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 40px;
    background: #f9fafb;
    font-size: 14px;
    flex: 1 1 auto;
    min-width: 140px;
    max-width: 200px;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='https://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
  }
  
  .filter-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 8px;
  }
  
  .reset-button {
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 40px;
    background-color: #388E3C;
    color: white;
    cursor: pointer;
    transition: 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  
  .reset-button:active {
    transform: scale(0.97);
  }
  
  #videoContainer {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    padding: 20px 0;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .no-results {
    text-align: center;
    padding: 40px;
    color: #dc2626;
    font-weight: 600;
  }
  
  /* Video Modal Styles */
  #videoModal {
    position: fixed;
    inset: 0;
    background: black;
    z-index: 2000;
    display: none;
    align-items: center;
    justify-content: center;
    background-color: #000;
  }
  
  #videoModal.show {
    display: flex;
  }
  
  #modalContent {
    position: relative;
    width: 100%;
    height: 100%;
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .video-player-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: black;
  }
  
  #youtubePlayer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
  
  #customPlayerOverlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: rgba(0,0,0,0.2);
    transition: background 0.2s;
    z-index: 30;
    cursor: default;
  }
  
  #customPlayerOverlay.playing {
    background: transparent;
    cursor: none;
  }
  
  #customPlayerOverlay.paused {
    background: rgba(0,0,0,0.4);
    cursor: pointer;
  }
  
  #customControls {
    background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
    padding: 16px 20px;
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.25s, transform 0.25s;
    pointer-events: all;
  }
  
  #customPlayerOverlay.playing #customControls {
    opacity: 0;
    transform: translateY(100%);
    pointer-events: none;
  }
  
  #customPlayerOverlay.playing:hover #customControls,
  #customPlayerOverlay.paused #customControls {
    opacity: 1;
    transform: translateY(0);
    pointer-events: all;
  }
  
  #mainControlsRow {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: nowrap;
  }
  
  #progressBarContainer {
    flex: 1;
    position: relative;
    height: 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  
  #progressBar {
    width: 100%;
    height: 5px;
    -webkit-appearance: none;
    background: #555;
    border-radius: 5px;
    outline: none;
  }
  
  #progressBar::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: #3A8D41;
    border-radius: 50%;
    border: 2px solid white;
    cursor: pointer;
  }
  
  .timestamp-marker {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #ff8c42;
    border-radius: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border: 2px solid white;
    cursor: pointer;
    z-index: 20;
    box-shadow: 0 0 4px rgba(0,0,0,0.5);
  }
  
  .time-display {
    font-size: 13px;
    font-weight: 500;
    min-width: 55px;
    text-align: center;
    color: white;
    text-shadow: 0 0 2px black;
  }
  
  button.control-btn {
    background: none;
    border: none;
    color: white;
    padding: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
  }
  
  #closeModal {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    background: rgba(0,0,0,0.6);
    border-radius: 40px;
    color: white;
    font-size: 28px;
    border: none;
    z-index: 2001;
    backdrop-filter: blur(5px);
    cursor: pointer;
  }
  
  #speedMessage {
    position: absolute;
    bottom: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.8);
    color: white;
    font-size: 2rem;
    font-weight: bold;
    padding: 12px 24px;
    border-radius: 60px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 100;
  }
  
  #playbackSpeedDisplay {
    font-size: 12px;
    font-weight: 600;
    background: rgba(0,0,0,0.6);
    padding: 4px 8px;
    border-radius: 20px;
    min-width: 45px;
    text-align: center;
    color: white;
  }
  
  #seekFeedback {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 2.5rem;
    font-weight: bold;
    color: white;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 15px 30px;
    border-radius: 12px;
    z-index: 100;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    white-space: nowrap;
  }
  
  #centerPlayButtonContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    transition: opacity 0.2s ease;
  }
  
  #customPlayerOverlay.playing #centerPlayButtonContainer {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  
  #customPlayerOverlay.paused #centerPlayButtonContainer {
    opacity: 1;
    pointer-events: all;
  }
  
  #customPlayerOverlay.playing:hover #centerPlayButtonContainer {
    opacity: 0;
  }
  
  .hidden {
    display: none;
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
    
    #videoContainer {
      padding: 12px;
      gap: 16px;
    }
    
    .video-card {
      max-width: 100%;
    }
    
    .filter-buttons {
      width: 100%;
    }
    
    .reset-button {
      flex: 1;
      text-align: center;
    }
    
    .filters select {
      max-width: none;
      width: auto;
    }
    
    #mainControlsRow {
      gap: 6px;
    }
    
    .time-display {
      font-size: 11px;
      min-width: 48px;
    }
    
    #closeModal {
      top: 12px;
      right: 12px;
      width: 36px;
      height: 36px;
      font-size: 24px;
    }
    
    .timestamp-marker {
      width: 10px;
      height: 10px;
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
    
    .video-thumbnail .play-button {
      width: 40px;
      height: 40px;
    }
    
    .video-thumbnail .play-button svg {
      width: 20px;
      height: 20px;
    }
    
    #videoContainer {
      grid-template-columns: 1fr;
      gap: 16px;
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
    unsubscribeUser: null,
    vsetkyVidea: [],
    unsubscribeVidea: null,
    
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
          
          if (predoslyApproved !== this.aktualnyPouzivatelApproved || 
              predoslaRole !== this.aktualnyPouzivatelRole) {
            prerenderujPodlaStavu(this.aktualnyPouzivatel);
          }
        } else {
          console.log('Používateľský dokument bol odstránený, odhlasujem používateľa');
          
          showAlert(
            'Váš účet bol odstránený administrátorom. Budete odhlásený.',
            'Účet odstránený',
            '⚠️'
          ).then(() => {
            signOut(auth).then(() => {
              if (this.unsubscribeUser) {
                this.unsubscribeUser();
                this.unsubscribeUser = null;
              }
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
        if (this.unsubscribeUsers) {
          this.unsubscribeUsers();
          this.unsubscribeUsers = null;
        }
        if (this.unsubscribeUser) {
          this.unsubscribeUser();
          this.unsubscribeUser = null;
        }
        if (this.unsubscribeVidea) {
          this.unsubscribeVidea();
          this.unsubscribeVidea = null;
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
        // Only update users list if admin panel is visible
        if (document.getElementById('adminPanel').style.display !== 'none' && 
            document.getElementById('usersList')) {
          zobrazPouzivatelov(pouzivatelia);
        }
      }, (error) => {
        console.error('Chyba v real-time listeneri:', error);
      });
    },
    
    spustiRealTimeListenerPreVidea: function() {
      if (this.unsubscribeVidea) {
        this.unsubscribeVidea();
      }
      
      const videaRef = collection(db, 'matches');
      const q = query(videaRef, orderBy('createdAt', 'desc'));
      
      this.unsubscribeVidea = onSnapshot(q, (querySnapshot) => {
        const videa = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          videa.push({
            id: doc.id,
            videoId: data.videoId || '',
            kategoria: data.kategoria || '',
            sezona: data.sezona || '',
            sutaz: data.sutaz || '',
            tim: data.tim || '',
            mesiac: data.mesiac || '',
            kolo: data.kolo || '',
            datumacas: data.datumacas || '',
            timestamps: data.timestamps || {},
            createdAt: data.createdAt || '',
            createdBy: data.createdBy || '',
            createdByEmail: data.createdByEmail || ''
          });
        });
        this.vsetkyVidea = videa;
        
        // Aktualizovať zobrazenie videí
        if (document.getElementById('contentArea').style.display !== 'none') {
          zobrazVideaPouzivatelom(videa);
        }
        if (document.getElementById('adminPanel').style.display !== 'none' && 
            document.getElementById('videaList').style.display !== 'none') {
          zobrazVideaAdmin(videa);
        }
        if (document.getElementById('videaPrePouzivatelov')) {
          zobrazVideaPouzivatelom(videa);
        }
      }, (error) => {
        console.error('Chyba v real-time listeneri pre videá:', error);
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
      
      const jeSamSeba = userId === this.aktualnyPouzivatel.uid;
      
      try {
        await deleteDoc(doc(db, 'users', userId));
        
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
    
        if (jeSamSeba) {
          await signOut(auth);
          this.aktualnyPouzivatel = null;
          this.aktualnyPouzivatelRole = null;
          this.aktualnyPouzivatelApproved = null;
          
          if (this.unsubscribeUsers) {
            this.unsubscribeUsers();
            this.unsubscribeUsers = null;
          }
          if (this.unsubscribeUser) {
            this.unsubscribeUser();
            this.unsubscribeUser = null;
          }
          if (this.unsubscribeVidea) {
            this.unsubscribeVidea();
            this.unsubscribeVidea = null;
          }
      
          return { success: true, email: userEmail, vlastnyUcet: true };
        }
        
        return { success: true, email: userEmail, vlastnyUcet: false };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
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
    },

    // Video management methods
    pridajVideo: async function(videoData) {
      if (!this.jeAdmin()) {
        return { success: false, error: 'Nemáte oprávnenie na pridávanie videí' };
      }
      
      try {
        const docRef = await addDoc(collection(db, 'matches'), {
          videoId: videoData.videoId || '',
          kategoria: videoData.kategoria || '',
          sezona: videoData.sezona || '',
          sutaz: videoData.sutaz || '',
          tim: videoData.tim || '',
          mesiac: videoData.mesiac || '',
          kolo: videoData.kolo || '',
          datumacas: videoData.datumacas || '',
          timestamps: videoData.timestamps || {},
          createdAt: new Date().toISOString(),
          createdBy: this.aktualnyPouzivatel.uid,
          createdByEmail: this.aktualnyPouzivatel.email
        });
        return { success: true, id: docRef.id };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    nacitajVidea: async function() {
      try {
        const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const videa = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          videa.push({ 
            id: doc.id, 
            ...data 
          });
        });
        this.vsetkyVidea = videa;
        return { success: true, videa: videa };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    odstranVideo: async function(videoId) {
      if (!this.jeAdmin()) {
        return { success: false, error: 'Nemáte oprávnenie na odstraňovanie videí' };
      }
      
      try {
        await deleteDoc(doc(db, 'matches', videoId));
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
        
        appObj.spustiRealTimeListenerPrePouzivatela(user.uid);
        appObj.spustiRealTimeListenerPreVidea();
        
      } catch (error) {
        console.error('Chyba pri načítaní údajov:', error);
        appObj.aktualnyPouzivatelRole = 'user';
        appObj.aktualnyPouzivatelApproved = false;
      }
      
      prerenderujPodlaStavu(user);
    } else {
      if (appObj.unsubscribeUser) {
        appObj.unsubscribeUser();
        appObj.unsubscribeUser = null;
      }
      if (appObj.unsubscribeVidea) {
        appObj.unsubscribeVidea();
        appObj.unsubscribeVidea = null;
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
      if (jeSchvaleny || jeAdmin) {
        // Only show videos if not in admin panel
        if (document.getElementById('adminPanel').style.display === 'none') {
          zobrazVideaPouzivatelom(window.app.vsetkyVidea);
        }
      }
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
      
      // Only load users if admin panel is visible
      if (adminPanel.style.display !== 'none') {
        window.app.nacitajVsetkychPouzivatelov().then(() => {
          zobrazPouzivatelov(window.app.vsetciPouzivatelia);
        });
      }
      
      if (adminButtons) {
        adminButtons.style.display = 'flex';
      }
      
      const btnAplikacia = document.getElementById('btnAplikacia');
      const btnPouzivatelia = document.getElementById('btnPouzivatelia');
      const btnVidea = document.getElementById('btnVidea');
      
      if (btnAplikacia && btnPouzivatelia && btnVidea) {
        btnAplikacia.style.backgroundColor = '#1976D2';
        btnAplikacia.style.color = 'white';
        btnPouzivatelia.style.backgroundColor = '#e0e0e0';
        btnPouzivatelia.style.color = '#333';
        btnVidea.style.backgroundColor = '#e0e0e0';
        btnVidea.style.color = '#333';
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

// Funkcia na získanie ID videa z YouTube URL
function extrahujVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
    /(?:youtube\.com\/v\/)([\w-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  // Ak je to priamo ID (len písmená a čísla)
  if (/^[\w-]{11}$/.test(url)) {
    return url;
  }
  
  return null;
}

// Vytvorenie HTML pre video kartu
function vytvorVideoKartu(video, sOdstranenim = false) {
  const embedUrl = `${YOUTUBE_EMBED_URL}${video.videoId}`;
  const thumbnailUrl = `https://smf-hk-zilina.smfhkzilina.workers.dev/?id=${video.videoId}`;
  
  // Zostavenie detailov videa
  let detailsHtml = '';
  if (video.kategoria) {
    const kategoriaDisplay = categoryMap[video.kategoria] || video.kategoria;
    detailsHtml += `<p><strong>Kategória:</strong> ${kategoriaDisplay}</p>`;
  }
  if (video.sezona) {
    detailsHtml += `<p><strong>Sezóna:</strong> ${video.sezona}</p>`;
  }
  if (video.sutaz) {
    detailsHtml += `<p><strong>Súťaž:</strong> ${video.sutaz}</p>`;
  }
  if (video.tim) {
    detailsHtml += `<p><strong>Tím:</strong> ${video.tim}</p>`;
  }
  if (video.mesiac) {
    detailsHtml += `<p><strong>Mesiac:</strong> ${video.mesiac}</p>`;
  }
  if (video.kolo) {
    detailsHtml += `<p><strong>Kolo:</strong> ${video.kolo}</p>`;
  }
  if (video.datumacas) {
    detailsHtml += `<p><strong>Dátum a čas:</strong> ${video.datumacas}</p>`;
  }
  
  return `
    <div class="video-card" data-video-id="${video.id}">
      <div class="video-thumbnail" onclick="otvorVideoModal('${video.id}')">
        <img src="${thumbnailUrl}" alt="${video.nazov || 'Video'}" loading="lazy" onerror="this.src='https://placehold.co/640x360/1f2937/white?text=Video'">
        <div class="play-button">
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      <div class="video-details">
        ${detailsHtml}
        ${sOdstranenim ? `
          <div class="video-meta">
            <span>Pridané: ${formatujDatum(video.createdAt)}</span>
            <button onclick="odstranVideo('${video.id}')" 
                    class="btn-remove-user"
                    style="padding:4px 10px;font-size:11px;">
              🗑️ Odstrániť
            </button>
          </div>
        ` : `
          ${video.createdAt ? `<div class="video-meta"><span>Pridané: ${formatujDatum(video.createdAt)}</span></div>` : ''}
        `}
      </div>
    </div>
  `;
}

// Zobrazenie videí pre používateľov
function zobrazVideaPouzivatelom(videa) {
  const container = document.getElementById('videaPrePouzivatelov');
  if (!container) return;
  
  if (!videa || videa.length === 0) {
    container.innerHTML = `
      <div class="filters-container">
        <div class="filters">
          <select id="filterKategoria"><option value="">Kategória</option></select>
          <select id="filterSezona"><option value="">Sezóna</option></select>
          <select id="filterSutaz"><option value="">Súťaž</option></select>
          <select id="filterTim"><option value="">Tím</option></select>
          <select id="filterMesiac"><option value="">Mesiac</option></select>
        </div>
        <div class="filter-buttons">
          <button class="reset-button" onclick="resetFiltre()">Vymazať filtre</button>
        </div>
      </div>
      <p style="text-align:center;color:#999;padding:40px;">Žiadne videá nie sú dostupné</p>
    `;
    return;
  }
  
  // Získanie unikátnych hodnôt pre filtre
  const kategorie = [...new Set(videa.map(v => v.kategoria).filter(Boolean))];
  const sezony = [...new Set(videa.map(v => v.sezona).filter(Boolean))];
  const sutaze = [...new Set(videa.map(v => v.sutaz).filter(Boolean))];
  const timy = [...new Set(videa.map(v => v.tim).filter(Boolean))];
  const mesiace = [...new Set(videa.map(v => v.mesiac).filter(Boolean))];
  
  let html = `
    <div class="filters-container">
      <div class="filters">
        <select id="filterKategoria">
          <option value="">Kategória</option>
          ${kategorie.map(k => `<option value="${k}">${categoryMap[k] || k}</option>`).join('')}
        </select>
        <select id="filterSezona">
          <option value="">Sezóna</option>
          ${sezony.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <select id="filterSutaz">
          <option value="">Súťaž</option>
          ${sutaze.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <select id="filterTim">
          <option value="">Tím</option>
          ${timy.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <select id="filterMesiac">
          <option value="">Mesiac</option>
          ${mesiace.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <div class="filter-buttons">
        <button class="reset-button" onclick="resetFiltre()">Vymazať filtre</button>
      </div>
    </div>
    <div id="videoContainer">
  `;
  
  // Zobrazenie všetkých videí (filtrovanie sa robí cez JS)
  videa.forEach((video) => {
    html += vytvorVideoKartu(video, false);
  });
  
  html += '</div>';
  html += '<div id="noResultsMessage" class="no-results" style="display:none;">Žiadne videá nevyhovujú filtrom</div>';
  
  container.innerHTML = html;
  
  // Pridať event listenery pre filtre
  document.getElementById('filterKategoria').addEventListener('change', aplikujFiltre);
  document.getElementById('filterSezona').addEventListener('change', aplikujFiltre);
  document.getElementById('filterSutaz').addEventListener('change', aplikujFiltre);
  document.getElementById('filterTim').addEventListener('change', aplikujFiltre);
  document.getElementById('filterMesiac').addEventListener('change', aplikujFiltre);
}

// Globálna funkcia pre filtre
window.aplikujFiltre = function() {
  const videa = window.app.vsetkyVidea || [];
  const kategoria = document.getElementById('filterKategoria')?.value || '';
  const sezona = document.getElementById('filterSezona')?.value || '';
  const sutaz = document.getElementById('filterSutaz')?.value || '';
  const tim = document.getElementById('filterTim')?.value || '';
  const mesiac = document.getElementById('filterMesiac')?.value || '';
  
  const filtered = videa.filter(v => {
    if (kategoria && v.kategoria !== kategoria) return false;
    if (sezona && v.sezona !== sezona) return false;
    if (sutaz && v.sutaz !== sutaz) return false;
    if (tim && v.tim !== tim) return false;
    if (mesiac && v.mesiac !== mesiac) return false;
    return true;
  });
  
  const container = document.getElementById('videoContainer');
  const noResults = document.getElementById('noResultsMessage');
  
  if (!container) return;
  
  if (filtered.length === 0) {
    container.innerHTML = '';
    if (noResults) noResults.style.display = 'block';
    return;
  }
  
  if (noResults) noResults.style.display = 'none';
  
  let html = '';
  filtered.forEach((video) => {
    html += vytvorVideoKartu(video, false);
  });
  container.innerHTML = html;
};

window.resetFiltre = function() {
  document.getElementById('filterKategoria').value = '';
  document.getElementById('filterSezona').value = '';
  document.getElementById('filterSutaz').value = '';
  document.getElementById('filterTim').value = '';
  document.getElementById('filterMesiac').value = '';
  aplikujFiltre();
};

// Načítanie videí do admin panelu
function nacitajVideaDoAdminPanelu() {
  const container = document.getElementById('videaList');
  if (!container) return;
  
  zobrazVideaAdmin(window.app.vsetkyVidea);
}

// Zobrazenie videí pre admina
function zobrazVideaAdmin(videa) {
  const container = document.getElementById('videaList');
  if (!container) return;
  
  if (!videa || videa.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Žiadne videá neboli pridané</p>';
    return;
  }
  
  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;">';
  
  videa.forEach((video) => {
    html += vytvorVideoKartu(video, true);
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// Otvorenie modálneho okna pre video
window.otvorVideoModal = async function(videoId) {
  const video = window.app.vsetkyVidea.find(v => v.id === videoId);
  if (!video) {
    await showAlert('Video sa nenašlo', 'Chyba', '❌');
    return;
  }
  
  const modal = document.getElementById('videoModal');
  if (!modal) return;
  
  // Skryť scroll tlačidlo
  const scrollBtn = document.getElementById('scroll');
  if (scrollBtn) {
    scrollBtn.classList.add('hide');
  }
  
  // Nastaviť aktuálne timestampy
  currentTimestamps = video.timestamps || {};
  timestampKeys = Object.keys(currentTimestamps).sort((a, b) => {
    return timeToSec(currentTimestamps[a]) - timeToSec(currentTimestamps[b]);
  });
  
  // Zobraziť modal
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // Vytvoriť alebo aktualizovať prehrávač
  if (window.youtubePlayer) {
    window.youtubePlayer.destroy();
    window.youtubePlayer = null;
  }
  
  const modalErrorDiv = document.getElementById('modalError');
  if (modalErrorDiv) modalErrorDiv.style.display = 'none';
  
  // Načítať video
  if (window.YT && YT.Player) {
    window.youtubePlayer = new YT.Player('youtubePlayer', {
      videoId: video.videoId,
      playerVars: { 
        autoplay: 1, 
        controls: 0, 
        modestbranding: 1, 
        rel: 0, 
        playsinline: 1 
      },
      events: {
        onReady: (e) => {
          e.target.playVideo();
          let dur = e.target.getDuration();
          document.getElementById('duration').textContent = formatTime(dur);
          setTimeout(() => {
            let finalDur = e.target.getDuration();
            addMarkers(finalDur);
          }, 100);
          updatePlayButtons(1);
          showControlsAndRestartTimer();
          // Nastaviť kvalitu
          if (e.target.setPlaybackQuality) {
            e.target.setPlaybackQuality('hd1080');
          }
        },
        onStateChange: (e) => {
          updatePlayButtons(e.data);
          if (e.data === 1) {
            if (window.progressInterval) clearInterval(window.progressInterval);
            window.progressInterval = setInterval(() => {
              if (!window.isSeeking && window.youtubePlayer) updateProgressBarInstant();
            }, 500);
          } else {
            clearInterval(window.progressInterval);
          }
          if (e.data === 0) {
            clearInterval(window.progressInterval);
          }
        },
        onError: () => {
          if (modalErrorDiv) modalErrorDiv.style.display = 'flex';
          if (window.youtubePlayer) window.youtubePlayer.stopVideo();
        }
      }
    });
  }
};

// Odstránenie videa (admin)
window.odstranVideo = async function(videoId) {
  const confirmed = await showDangerConfirm(
    'Naozaj chcete odstrániť toto video?',
    'Odstránenie videa',
    '🗑️'
  );
  
  if (confirmed !== 'confirm') return;
  
  const result = await window.app.odstranVideo(videoId);
  if (result.success) {
    await showAlert('✅ Video bolo úspešne odstránené!', 'Úspech', '✅');
    // Data sa aktualizujú cez real-time listener
  } else {
    await showAlert('❌ ' + result.error, 'Chyba', '❌');
  }
};

// Funkcia na otvorenie modálneho okna pre pridanie videa
window.otvorModalPridaniaVidea = function() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.id = 'videoModalPridanie';
  
  const modalBox = document.createElement('div');
  modalBox.className = 'modal-box';
  modalBox.style.maxWidth = '600px';
  modalBox.style.maxHeight = '90vh';
  modalBox.style.overflow = 'auto';
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.innerHTML = '×';
  closeBtn.onclick = () => {
    modal.remove();
  };
  modalBox.appendChild(closeBtn);
  
  // Icon
  const icon = document.createElement('div');
  icon.className = 'modal-icon';
  icon.textContent = '🎥';
  modalBox.appendChild(icon);
  
  // Title
  const title = document.createElement('h3');
  title.textContent = 'Pridať nové video';
  title.style.marginBottom = '20px';
  modalBox.appendChild(title);
  
  // Form
  const form = document.createElement('form');
  form.id = 'videoForm';
  
  // Video ID input
  const idGroup = document.createElement('div');
  idGroup.style.marginBottom = '15px';
  
  const idLabel = document.createElement('label');
  idLabel.textContent = 'ID videa *';
  idLabel.style.display = 'block';
  idLabel.style.marginBottom = '5px';
  idLabel.style.fontWeight = 'bold';
  idGroup.appendChild(idLabel);
  
  const idInput = document.createElement('input');
  idInput.type = 'text';
  idInput.id = 'videoIdInput';
  idInput.required = true;
  idInput.placeholder = 'YouTube ID videa (napr. LjOBNPYv7uR0VJQcyqUOgo)';
  idInput.style.width = '100%';
  idInput.style.padding = '12px';
  idInput.style.border = '1px solid #ddd';
  idInput.style.borderRadius = '4px';
  idInput.style.fontSize = '14px';
  idInput.style.boxSizing = 'border-box';
  idGroup.appendChild(idInput);
  form.appendChild(idGroup);
  
  // Kategória
  const catGroup = document.createElement('div');
  catGroup.style.marginBottom = '15px';
  
  const catLabel = document.createElement('label');
  catLabel.textContent = 'Kategória *';
  catLabel.style.display = 'block';
  catLabel.style.marginBottom = '5px';
  catLabel.style.fontWeight = 'bold';
  catGroup.appendChild(catLabel);
  
  const catSelect = document.createElement('select');
  catSelect.id = 'kategoriaInput';
  catSelect.required = true;
  catSelect.style.width = '100%';
  catSelect.style.padding = '12px';
  catSelect.style.border = '1px solid #ddd';
  catSelect.style.borderRadius = '4px';
  catSelect.style.fontSize = '14px';
  catSelect.style.boxSizing = 'border-box';
  catSelect.style.backgroundColor = 'white';
  
  const catOptions = [
    { value: '', text: 'Vyberte kategóriu' },
    { value: 'MLDKY', text: 'Mladšie dorastenky' },
    { value: 'STDKY', text: 'Staršie dorastenky' },
    { value: 'MLDCI', text: 'Mladší dorastenci' },
    { value: 'STDCI', text: 'Starší dorastenci' }
  ];
  
  catOptions.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.text;
    catSelect.appendChild(option);
  });
  
  catGroup.appendChild(catSelect);
  form.appendChild(catGroup);
  
  // Sezóna
  const sezGroup = document.createElement('div');
  sezGroup.style.marginBottom = '15px';
  
  const sezLabel = document.createElement('label');
  sezLabel.textContent = 'Sezóna *';
  sezLabel.style.display = 'block';
  sezLabel.style.marginBottom = '5px';
  sezLabel.style.fontWeight = 'bold';
  sezGroup.appendChild(sezLabel);
  
  const sezSelect = document.createElement('select');
  sezSelect.id = 'sezonaInput';
  sezSelect.required = true;
  sezSelect.style.width = '100%';
  sezSelect.style.padding = '12px';
  sezSelect.style.border = '1px solid #ddd';
  sezSelect.style.borderRadius = '4px';
  sezSelect.style.fontSize = '14px';
  sezSelect.style.boxSizing = 'border-box';
  sezSelect.style.backgroundColor = 'white';
  
  const sezOptions = [
    { value: '', text: 'Vyberte sezónu' },
    { value: '2025/2026', text: '2025/2026' },
    { value: '2024/2025', text: '2024/2025' },
    { value: '2023/2024', text: '2023/2024' }
  ];
  
  sezOptions.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.text;
    sezSelect.appendChild(option);
  });
  
  sezGroup.appendChild(sezSelect);
  form.appendChild(sezGroup);
  
  // Súťaž
  const sutGroup = document.createElement('div');
  sutGroup.style.marginBottom = '15px';
  
  const sutLabel = document.createElement('label');
  sutLabel.textContent = 'Súťaž *';
  sutLabel.style.display = 'block';
  sutLabel.style.marginBottom = '5px';
  sutLabel.style.fontWeight = 'bold';
  sutGroup.appendChild(sutLabel);
  
  const sutSelect = document.createElement('select');
  sutSelect.id = 'sutazInput';
  sutSelect.required = true;
  sutSelect.style.width = '100%';
  sutSelect.style.padding = '12px';
  sutSelect.style.border = '1px solid #ddd';
  sutSelect.style.borderRadius = '4px';
  sutSelect.style.fontSize = '14px';
  sutSelect.style.boxSizing = 'border-box';
  sutSelect.style.backgroundColor = 'white';
  
  const sutOptions = [
    { value: '', text: 'Vyberte súťaž' },
    { value: '1. liga', text: '1. liga' }
  ];
  
  sutOptions.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.text;
    sutSelect.appendChild(option);
  });
  
  sutGroup.appendChild(sutSelect);
  form.appendChild(sutGroup);
  
  // Tím
  const timGroup = document.createElement('div');
  timGroup.style.marginBottom = '15px';
  
  const timLabel = document.createElement('label');
  timLabel.textContent = 'Tím *';
  timLabel.style.display = 'block';
  timLabel.style.marginBottom = '5px';
  timLabel.style.fontWeight = 'bold';
  timGroup.appendChild(timLabel);
  
  const timInput = document.createElement('input');
  timInput.type = 'text';
  timInput.id = 'timInput';
  timInput.required = true;
  timInput.placeholder = 'Názov tímu';
  timInput.style.width = '100%';
  timInput.style.padding = '12px';
  timInput.style.border = '1px solid #ddd';
  timInput.style.borderRadius = '4px';
  timInput.style.fontSize = '14px';
  timInput.style.boxSizing = 'border-box';
  timGroup.appendChild(timInput);
  form.appendChild(timGroup);
  
  // Mesiac
  const mesGroup = document.createElement('div');
  mesGroup.style.marginBottom = '15px';
  
  const mesLabel = document.createElement('label');
  mesLabel.textContent = 'Mesiac *';
  mesLabel.style.display = 'block';
  mesLabel.style.marginBottom = '5px';
  mesLabel.style.fontWeight = 'bold';
  mesGroup.appendChild(mesLabel);
  
  const mesSelect = document.createElement('select');
  mesSelect.id = 'mesiacInput';
  mesSelect.required = true;
  mesSelect.style.width = '100%';
  mesSelect.style.padding = '12px';
  mesSelect.style.border = '1px solid #ddd';
  mesSelect.style.borderRadius = '4px';
  mesSelect.style.fontSize = '14px';
  mesSelect.style.boxSizing = 'border-box';
  mesSelect.style.backgroundColor = 'white';
  
  const mesOptions = [
    { value: '', text: 'Vyberte mesiac' },
    { value: 'január', text: 'Január' },
    { value: 'február', text: 'Február' },
    { value: 'marec', text: 'Marec' },
    { value: 'apríl', text: 'Apríl' },
    { value: 'máj', text: 'Máj' },
    { value: 'jún', text: 'Jún' },
    { value: 'júl', text: 'Júl' },
    { value: 'august', text: 'August' },
    { value: 'september', text: 'September' },
    { value: 'október', text: 'Október' },
    { value: 'november', text: 'November' },
    { value: 'december', text: 'December' }
  ];
  
  mesOptions.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.text;
    mesSelect.appendChild(option);
  });
  
  mesGroup.appendChild(mesSelect);
  form.appendChild(mesGroup);
  
  // Kolo
  const koloGroup = document.createElement('div');
  koloGroup.style.marginBottom = '15px';
  
  const koloLabel = document.createElement('label');
  koloLabel.textContent = 'Kolo';
  koloLabel.style.display = 'block';
  koloLabel.style.marginBottom = '5px';
  koloLabel.style.fontWeight = 'bold';
  koloGroup.appendChild(koloLabel);
  
  const koloInput = document.createElement('input');
  koloInput.type = 'text';
  koloInput.id = 'koloInput';
  koloInput.placeholder = 'Číslo kola (napr. 22)';
  koloInput.style.width = '100%';
  koloInput.style.padding = '12px';
  koloInput.style.border = '1px solid #ddd';
  koloInput.style.borderRadius = '4px';
  koloInput.style.fontSize = '14px';
  koloInput.style.boxSizing = 'border-box';
  koloGroup.appendChild(koloInput);
  form.appendChild(koloGroup);
  
  // Dátum a čas
  const datumGroup = document.createElement('div');
  datumGroup.style.marginBottom = '15px';
  
  const datumLabel = document.createElement('label');
  datumLabel.textContent = 'Dátum a čas';
  datumLabel.style.display = 'block';
  datumLabel.style.marginBottom = '5px';
  datumLabel.style.fontWeight = 'bold';
  datumGroup.appendChild(datumLabel);
  
  const datumInput = document.createElement('input');
  datumInput.type = 'text';
  datumInput.id = 'datumacasInput';
  datumInput.placeholder = '09. 05. 2026 12:00 hod.';
  datumInput.style.width = '100%';
  datumInput.style.padding = '12px';
  datumInput.style.border = '1px solid #ddd';
  datumInput.style.borderRadius = '4px';
  datumInput.style.fontSize = '14px';
  datumInput.style.boxSizing = 'border-box';
  datumGroup.appendChild(datumInput);
  form.appendChild(datumGroup);
  
  // Timestamps
  const tsGroup = document.createElement('div');
  tsGroup.style.marginBottom = '15px';
  
  const tsLabel = document.createElement('label');
  tsLabel.textContent = 'Časové značky (JSON objekt)';
  tsLabel.style.display = 'block';
  tsLabel.style.marginBottom = '5px';
  tsLabel.style.fontWeight = 'bold';
  tsGroup.appendChild(tsLabel);
  
  const tsTextarea = document.createElement('textarea');
  tsTextarea.id = 'timestampsInput';
  tsTextarea.placeholder = '{"Začiatok": "00:00:00", "1. polčas": "00:02:20", "Prestávka": "00:36:02", "2. polčas": "00:44:38"}';
  tsTextarea.style.width = '100%';
  tsTextarea.style.padding = '12px';
  tsTextarea.style.border = '1px solid #ddd';
  tsTextarea.style.borderRadius = '4px';
  tsTextarea.style.fontSize = '14px';
  tsTextarea.style.boxSizing = 'border-box';
  tsTextarea.style.resize = 'vertical';
  tsTextarea.style.minHeight = '80px';
  tsTextarea.style.fontFamily = 'Arial, sans-serif';
  tsGroup.appendChild(tsTextarea);
  form.appendChild(tsGroup);
  
  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = '✅ Pridať video';
  submitBtn.style.width = '100%';
  submitBtn.style.padding = '12px';
  submitBtn.style.backgroundColor = '#4CAF50';
  submitBtn.style.color = 'white';
  submitBtn.style.border = 'none';
  submitBtn.style.borderRadius = '4px';
  submitBtn.style.fontSize = '16px';
  submitBtn.style.cursor = 'pointer';
  submitBtn.style.transition = 'background-color 0.3s';
  form.appendChild(submitBtn);
  
  // Message div
  const messageDiv = document.createElement('div');
  messageDiv.id = 'videoMessage';
  messageDiv.style.marginTop = '15px';
  messageDiv.style.textAlign = 'center';
  messageDiv.style.fontSize = '14px';
  form.appendChild(messageDiv);
  
  modalBox.appendChild(form);
  modal.appendChild(modalBox);
  document.body.appendChild(modal);
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const videoId = document.getElementById('videoIdInput').value.trim();
    const kategoria = document.getElementById('kategoriaInput').value;
    const sezona = document.getElementById('sezonaInput').value;
    const sutaz = document.getElementById('sutazInput').value;
    const tim = document.getElementById('timInput').value.trim();
    const mesiac = document.getElementById('mesiacInput').value;
    const kolo = document.getElementById('koloInput').value.trim();
    const datumacas = document.getElementById('datumacasInput').value.trim();
    let timestamps = {};
    
    // Parse timestamps
    const tsText = document.getElementById('timestampsInput').value.trim();
    if (tsText) {
      try {
        // Najprv skúsime parsovať ako JSON
        timestamps = JSON.parse(tsText);
      } catch (e) {
        try {
          // Ak JSON zlyhal, skúsime to ako JavaScript objekt
          // Použijeme Function constructor na bezpečné vyhodnotenie
          const evalFn = new Function(`return (${tsText})`);
          const result = evalFn();
          if (typeof result === 'object' && !Array.isArray(result) && result !== null) {
            timestamps = result;
          } else {
            throw new Error('Musí byť objekt');
          }
        } catch (error) {
          messageDiv.textContent = '❌ Neplatný formát časových značiek. Použite JSON alebo JavaScript objekt.';
          messageDiv.style.color = 'red';
          return;
        }
      }
      // Validate that it's an object
      if (typeof timestamps !== 'object' || Array.isArray(timestamps) || timestamps === null) {
        messageDiv.textContent = '❌ Časové značky musia byť objekt';
        messageDiv.style.color = 'red';
        return;
      }
    }
    
    // Validate required fields
    if (!videoId || !kategoria || !sezona || !sutaz || !tim || !mesiac) {
      messageDiv.textContent = '❌ Prosím, vyplňte všetky povinné polia (označené *)';
      messageDiv.style.color = 'red';
      return;
    }
    
    // Validate video ID format
    if (!/^[\w-]{11}$/.test(videoId)) {
      messageDiv.textContent = '❌ Neplatné ID videa. Malo by mať 11 znakov (písmená, čísla, pomlčky).';
      messageDiv.style.color = 'red';
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ukladám...';
    submitBtn.style.opacity = '0.7';
    messageDiv.textContent = '';
    
    const videoData = {
      videoId,
      kategoria,
      sezona,
      sutaz,
      tim,
      mesiac,
      kolo: kolo || '',
      datumacas: datumacas || '',
      timestamps
    };
    
    const result = await window.app.pridajVideo(videoData);
    
    if (result.success) {
      messageDiv.innerHTML = '✅ Video bolo úspešne pridané!';
      messageDiv.style.color = 'green';
      form.reset();
      
      // Close modal after delay
      setTimeout(() => {
        modal.remove();
      }, 1500);
    } else {
      messageDiv.textContent = '❌ ' + result.error;
      messageDiv.style.color = 'red';
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = '✅ Pridať video';
    submitBtn.style.opacity = '1';
  });
  
  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

// Zobrazenie správy videí (admin)
window.zobrazSpravuVidei = function() {
  const contentArea = document.getElementById('contentArea');
  const adminPanel = document.getElementById('adminPanel');
  const usersList = document.getElementById('usersList');
  const videaList = document.getElementById('videaList');
  const addVideoBtn = document.getElementById('addVideoBtn');
  const adminPanelTitle = document.getElementById('adminPanelTitle');
  
  contentArea.style.display = 'none';
  adminPanel.style.display = 'block';
  
  // Zmeniť názov panelu
  if (adminPanelTitle) {
    adminPanelTitle.textContent = 'Správa videí';
  }
  
  // Skryť zoznam používateľov, zobraziť zoznam videí
  if (usersList) usersList.style.display = 'none';
  if (videaList) videaList.style.display = 'block';
  if (addVideoBtn) addVideoBtn.style.display = 'block';
  
  // Aktualizovať tlačidlá
  document.getElementById('btnVidea').style.backgroundColor = '#1976D2';
  document.getElementById('btnVidea').style.color = 'white';
  document.getElementById('btnAplikacia').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnAplikacia').style.color = '#333';
  document.getElementById('btnPouzivatelia').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnPouzivatelia').style.color = '#333';
  
  // Načítanie videí pre admin panel
  nacitajVideaDoAdminPanelu();
};

window.zobrazAplikaciu = function() {
  const contentArea = document.getElementById('contentArea');
  const adminPanel = document.getElementById('adminPanel');
  
  contentArea.style.display = 'block';
  adminPanel.style.display = 'none';
  
  // Aktualizovať tlačidlá
  document.getElementById('btnAplikacia').style.backgroundColor = '#1976D2';
  document.getElementById('btnAplikacia').style.color = 'white';
  document.getElementById('btnPouzivatelia').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnPouzivatelia').style.color = '#333';
  document.getElementById('btnVidea').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnVidea').style.color = '#333';
  
  // Načítať videá pre používateľov
  zobrazVideaPouzivatelom(window.app.vsetkyVidea);
};

window.zobrazPouzivatelovAdmin = function() {
  const contentArea = document.getElementById('contentArea');
  const adminPanel = document.getElementById('adminPanel');
  const usersList = document.getElementById('usersList');
  const videaList = document.getElementById('videaList');
  const addVideoBtn = document.getElementById('addVideoBtn');
  const adminPanelTitle = document.getElementById('adminPanelTitle');
  
  contentArea.style.display = 'none';
  adminPanel.style.display = 'block';
  
  // Zmeniť názov panelu
  if (adminPanelTitle) {
    adminPanelTitle.textContent = 'Správa používateľov';
  }
  
  // Skryť zoznam videí, zobraziť zoznam používateľov
  if (usersList) usersList.style.display = 'block';
  if (videaList) videaList.style.display = 'none';
  if (addVideoBtn) addVideoBtn.style.display = 'none';
  
  // Aktualizovať tlačidlá
  document.getElementById('btnPouzivatelia').style.backgroundColor = '#1976D2';
  document.getElementById('btnPouzivatelia').style.color = 'white';
  document.getElementById('btnAplikacia').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnAplikacia').style.color = '#333';
  document.getElementById('btnVidea').style.backgroundColor = '#e0e0e0';
  document.getElementById('btnVidea').style.color = '#333';
  
  // Načítať používateľov
  if (window.app.vsetciPouzivatelia.length > 0) {
    zobrazPouzivatelov(window.app.vsetciPouzivatelia);
  } else {
    window.app.nacitajVsetkychPouzivatelov().then(() => {
      zobrazPouzivatelov(window.app.vsetciPouzivatelia);
    });
  }
};

// ===== Video Player Functions (from second code) =====

// Premenné pre prehrávač
let currentTimestamps = {};
let timestampKeys = [];
let controlsTimer = null;
let isSeeking = false;
let lastVolume = 80;

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  let h = Math.floor(sec / 3600);
  let m = Math.floor((sec % 3600) / 60);
  let s = Math.floor(sec % 60);
  return h > 0 ? `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}` : `${m}:${s < 10 ? '0' + s : s}`;
}

function timeToSec(t) {
  let p = t.split(':').map(Number);
  return p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2];
}

function addMarkers(duration) {
  const progressContainer = document.getElementById('progressBarContainer');
  if (!progressContainer) return;
  
  const existingMarkers = progressContainer.querySelectorAll('.timestamp-marker');
  existingMarkers.forEach(m => m.remove());
  
  if (!currentTimestamps || Object.keys(currentTimestamps).length === 0 || !duration || duration <= 0) return;
  
  Object.entries(currentTimestamps).forEach(([name, tStr]) => {
    let sec = timeToSec(tStr);
    if (sec > duration) return;
    
    let percent = (sec / duration) * 100;
    percent = Math.min(100, Math.max(0, percent));
    
    const marker = document.createElement('div');
    marker.className = 'timestamp-marker';
    marker.style.left = `${percent}%`;
    marker.style.transform = 'translate(-50%, -50%)';
    marker.title = name;
    marker.dataset.time = sec;
    marker.dataset.name = name;
    
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.youtubePlayer) {
        window.youtubePlayer.seekTo(sec, true);
        updateProgressBarInstant();
        showControlsAndRestartTimer();
      }
    });
    
    progressContainer.appendChild(marker);
  });
}

function updateProgressBarInstant() {
  if (!window.youtubePlayer) return;
  let cur = window.youtubePlayer.getCurrentTime() || 0;
  let dur = window.youtubePlayer.getDuration() || 1;
  let perc = (cur / dur) * 100;
  const progressBar = document.getElementById('progressBar');
  const currentTimeSpan = document.getElementById('currentTime');
  const durationSpan = document.getElementById('duration');
  if (progressBar) progressBar.value = perc;
  if (currentTimeSpan) currentTimeSpan.textContent = formatTime(cur);
  if (durationSpan) durationSpan.textContent = formatTime(dur);
  updateSection(cur);
}

function updateSection(t) {
  const sectionTitleSpan = document.getElementById('sectionTitle');
  if (!sectionTitleSpan) return;
  if (!timestampKeys.length) {
    sectionTitleSpan.textContent = '';
    return;
  }
  let active = '';
  for (let i = timestampKeys.length - 1; i >= 0; i--) {
    let key = timestampKeys[i];
    if (t >= timeToSec(currentTimestamps[key])) {
      active = key;
      break;
    }
  }
  sectionTitleSpan.textContent = active;
}

function showSpeedMessage(rate) {
  const speedMsg = document.getElementById('speedMessage');
  if (!speedMsg) return;
  speedMsg.textContent = `${rate}x`;
  speedMsg.style.opacity = '1';
  clearTimeout(window.speedHide);
  window.speedHide = setTimeout(() => {
    speedMsg.style.opacity = '0';
  }, 1200);
}

function showControlsAndRestartTimer() {
  const customOverlay = document.getElementById('customPlayerOverlay');
  if (!customOverlay) return;
  customOverlay.style.cursor = 'default';
  let ctrl = document.getElementById('customControls');
  if (ctrl) {
    ctrl.style.opacity = '1';
    ctrl.style.transform = 'translateY(0)';
    ctrl.style.pointerEvents = 'all';
  }
  if (window.youtubePlayer && window.youtubePlayer.getPlayerState() === 1) {
    clearTimeout(controlsTimer);
    controlsTimer = setTimeout(() => {
      if (window.youtubePlayer && window.youtubePlayer.getPlayerState() === 1 && !isSeeking) {
        if (ctrl) {
          ctrl.style.opacity = '0';
          ctrl.style.transform = 'translateY(100%)';
          ctrl.style.pointerEvents = 'none';
        }
        customOverlay.style.cursor = 'none';
      }
    }, 2000);
  }
}

function togglePlayPause() {
  if (!window.youtubePlayer) return;
  if (window.youtubePlayer.getPlayerState() === 1) {
    window.youtubePlayer.pauseVideo();
  } else {
    if (window.youtubePlayer.getPlaybackRate() !== 1) {
      window.youtubePlayer.setPlaybackRate(1);
      showSpeedMessage('1.0');
      const playbackSpeedDisplay = document.getElementById('playbackSpeedDisplay');
      if (playbackSpeedDisplay) playbackSpeedDisplay.textContent = '1.0x';
    }
    window.youtubePlayer.playVideo();
  }
  showControlsAndRestartTimer();
}

function updatePlayButtons(state) {
  let isPlaying = (state === 1);
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  if (playIcon) playIcon.classList.toggle('hidden', isPlaying);
  if (pauseIcon) pauseIcon.classList.toggle('hidden', !isPlaying);
  
  const miniPlay = document.querySelector('#playPauseButtonMini svg:first-child');
  const miniPause = document.querySelector('#playPauseButtonMini svg:last-child');
  if (miniPlay) miniPlay.classList.toggle('hidden', isPlaying);
  if (miniPause) miniPause.classList.toggle('hidden', !isPlaying);
  
  const customOverlay = document.getElementById('customPlayerOverlay');
  if (customOverlay) {
    customOverlay.classList.toggle('playing', isPlaying);
    customOverlay.classList.toggle('paused', !isPlaying);
  }
  
  if (isPlaying) {
    showControlsAndRestartTimer();
  } else {
    clearTimeout(controlsTimer);
    let ctrl = document.getElementById('customControls');
    if (ctrl) {
      ctrl.style.opacity = '1';
      ctrl.style.transform = 'translateY(0)';
    }
  }
}

function toggleMute() {
  if (!window.youtubePlayer) return;
  let muted = window.youtubePlayer.isMuted();
  if (muted) {
    window.youtubePlayer.unMute();
    window.youtubePlayer.setVolume(lastVolume);
  } else {
    lastVolume = window.youtubePlayer.getVolume();
    window.youtubePlayer.mute();
  }
  const volumeBtn = document.getElementById('volumeButton');
  if (volumeBtn) {
    let upIcon = volumeBtn.querySelector('svg:first-child');
    let muteIcon = volumeBtn.querySelector('svg:last-child');
    if (upIcon && muteIcon) {
      upIcon.classList.toggle('hidden', !muted);
      muteIcon.classList.toggle('hidden', muted);
    }
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    let elem = document.querySelector('.video-player-container');
    if (!elem) return;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}

function closeVideoModal() {
  if (window.youtubePlayer) {
    window.youtubePlayer.stopVideo();
    window.youtubePlayer.destroy();
    window.youtubePlayer = null;
  }
  const modal = document.getElementById('videoModal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
  clearInterval(window.progressInterval);
  clearTimeout(controlsTimer);
  isSeeking = false;
  
  const scrollBtn = document.getElementById('scroll');
  if (scrollBtn) {
    scrollBtn.classList.remove('hide');
  }
}

// Funkcia na zobrazenie seek feedbacku
function showSeekFeedback(text, isForward) {
  let feedback = document.getElementById('seekFeedback');
  const container = document.querySelector('.video-player-container');
  if (!feedback && container) {
    feedback = document.createElement('div');
    feedback.id = 'seekFeedback';
    container.appendChild(feedback);
  }
  if (!feedback) return;
  
  clearTimeout(feedback.hideTimeout);
  
  const offset = '25%';
  if (isForward) {
    feedback.style.left = `calc(50% + ${offset})`;
    feedback.style.transform = `translateY(-50%) translateX(-50%)`;
  } else {
    feedback.style.left = `calc(50% - ${offset})`;
    feedback.style.transform = `translateY(-50%) translateX(50%)`;
  }
  
  feedback.textContent = text;
  feedback.style.opacity = '1';
  
  feedback.hideTimeout = setTimeout(() => {
    feedback.style.opacity = '0';
  }, 800);
}

// Vytvorenie štruktúry pre video prehrávač v loggedInContainer
function vytvorVideoPlayer() {
  // Vytvorenie modálneho okna pre video
  const modal = document.createElement('div');
  modal.id = 'videoModal';
  modal.innerHTML = `
    <div id="modalContent">
      <button id="closeModal">✕</button>
      <div class="video-player-container">
        <div id="modalError" style="position:absolute;inset:0;background:black;display:none;align-items:center;justify-content:center;color:white;z-index:50;"><p>Video nie je dostupné</p></div>
        <div id="youtubePlayer"></div>
        <div id="customPlayerOverlay" class="paused">
          <div></div>
          <div id="centerPlayButtonContainer" style="display:flex; justify-content:center; align-items:center;">
            <button id="customPlayPauseButton" style="background:white; border-radius:60px; width:64px; height:64px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px black; cursor:pointer;">
              <svg id="playIcon" width="32" height="32" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"></path></svg>
              <svg id="pauseIcon" class="hidden" width="32" height="32" viewBox="0 0 24 24" fill="black"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
            </button>
          </div>
          <div id="customControls">
            <div id="mainControlsRow">
              <button id="playPauseButtonMini" class="control-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"></path></svg>
                <svg class="hidden" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
              </button>
              <span id="currentTime" class="time-display">0:00</span>
              <div id="progressBarContainer">
                <input type="range" id="progressBar" value="0" min="0" max="100" step="0.1">
              </div>
              <span id="duration" class="time-display">0:00</span>
              <span id="playbackSpeedDisplay" class="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded-full">1.0x</span>
              <button id="volumeButton" class="control-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                <svg class="hidden" width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
              </button>
              <button id="fullscreenButton" class="control-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                <svg class="hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>
              </button>
            </div>
            <div id="sectionTitle" class="text-white text-xs text-center mt-1 opacity-80"></div>
          </div>
        </div>
        <div id="speedMessage"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Event listeners pre prehrávač
  document.getElementById('closeModal').addEventListener('click', closeVideoModal);
  
  document.getElementById('customPlayPauseButton').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });
  
  document.getElementById('playPauseButtonMini').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });
  
  const progressBar = document.getElementById('progressBar');
  progressBar.addEventListener('input', (e) => {
    if (!window.youtubePlayer) return;
    isSeeking = true;
    let val = parseFloat(e.target.value);
    let dur = window.youtubePlayer.getDuration();
    let newTime = (val / 100) * dur;
    document.getElementById('currentTime').textContent = formatTime(newTime);
    updateSection(newTime);
  });
  
  progressBar.addEventListener('change', (e) => {
    if (!window.youtubePlayer) return;
    let val = parseFloat(e.target.value);
    let dur = window.youtubePlayer.getDuration();
    let newTime = (val / 100) * dur;
    window.youtubePlayer.seekTo(newTime, true);
    isSeeking = false;
    showControlsAndRestartTimer();
  });
  
  document.getElementById('progressBarContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('timestamp-marker')) return;
    let rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let percent = (x / rect.width) * 100;
    percent = Math.min(100, Math.max(0, percent));
    document.getElementById('progressBar').value = percent;
    let dur = window.youtubePlayer?.getDuration();
    if (dur && window.youtubePlayer) {
      let newTime = (percent / 100) * dur;
      window.youtubePlayer.seekTo(newTime, true);
      updateProgressBarInstant();
    }
  });
  
  document.getElementById('volumeButton').addEventListener('click', toggleMute);
  document.getElementById('fullscreenButton').addEventListener('click', toggleFullscreen);
  
  document.addEventListener('fullscreenchange', () => {
    let isFs = !!document.fullscreenElement;
    let enter = document.querySelector('#fullscreenButton svg:first-child');
    let exit = document.querySelector('#fullscreenButton svg:last-child');
    if (enter && exit) {
      enter.classList.toggle('hidden', isFs);
      exit.classList.toggle('hidden', !isFs);
    }
  });
  
  const customOverlay = document.getElementById('customPlayerOverlay');
  customOverlay.addEventListener('mousemove', () => {
    if (window.youtubePlayer && window.youtubePlayer.getPlayerState() === 1) showControlsAndRestartTimer();
  });
  customOverlay.addEventListener('touchstart', () => {
    if (window.youtubePlayer && window.youtubePlayer.getPlayerState() === 1) showControlsAndRestartTimer();
  });
  
  // Dvojklik na prehrávač
  let lastTapTime = 0;
  const DOUBLE_TAP_DELAY = 300;
  let clickTimeout = null;
  
  const videoPlayerContainer = document.querySelector('.video-player-container');
  
  // PC - click
  if (videoPlayerContainer) {
    videoPlayerContainer.addEventListener('click', (e) => {
      if (!window.youtubePlayer || document.getElementById('modalError').style.display === 'flex') return;
      
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
        return;
      }
      
      clickTimeout = setTimeout(() => {
        togglePlayPause();
        clickTimeout = null;
      }, 200);
    });
    
    // PC - dblclick
    videoPlayerContainer.addEventListener('dblclick', (e) => {
      if (!window.youtubePlayer || document.getElementById('modalError').style.display === 'flex') return;
      
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
      
      const rect = videoPlayerContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const halfWidth = rect.width / 2;
      const SEEK_AMOUNT = 10;
      const currentTime = window.youtubePlayer.getCurrentTime();
      const duration = window.youtubePlayer.getDuration();
      let newTime;
      
      if (x < halfWidth) {
        newTime = Math.max(0, currentTime - SEEK_AMOUNT);
        showSeekFeedback(`-10s`, false);
      } else {
        newTime = Math.min(duration, currentTime + SEEK_AMOUNT);
        showSeekFeedback(`+10s`, true);
      }
      
      window.youtubePlayer.seekTo(newTime, true);
      showControlsAndRestartTimer();
      
      if (window.youtubePlayer.getPlayerState() !== 1) {
        window.youtubePlayer.playVideo();
      }
      
      e.preventDefault();
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('videoModal');
    if (!modal.classList.contains('show') || !window.youtubePlayer) return;
    if (document.getElementById('modalError').style.display === 'flex') {
      if (e.code === 'Escape') closeVideoModal();
      return;
    }
    
    const currentTime = window.youtubePlayer.getCurrentTime();
    const duration = window.youtubePlayer.getDuration();
    let newTime;
    let seekAmount = e.ctrlKey ? 60 : 5;
    let currentRate;
    
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newTime = Math.max(0, currentTime - seekAmount);
        window.youtubePlayer.seekTo(newTime, true);
        showControlsAndRestartTimer();
        break;
      case 'ArrowRight':
        e.preventDefault();
        newTime = Math.min(duration, currentTime + seekAmount);
        window.youtubePlayer.seekTo(newTime, true);
        showControlsAndRestartTimer();
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
      case 'KeyL':
        e.preventDefault();
        currentRate = window.youtubePlayer.getPlaybackRate();
        if (currentRate < 2.0) {
          if (currentRate < 1) currentRate = 1.0;
          else {
            const speeds = [1.25, 1.5, 1.75, 2];
            let index = speeds.findIndex(rate => rate > currentRate);
            if (index === -1) index = 0;
            currentRate = speeds[index];
          }
          window.youtubePlayer.setPlaybackRate(currentRate);
          const playbackSpeedDisplay = document.getElementById('playbackSpeedDisplay');
          if (playbackSpeedDisplay) playbackSpeedDisplay.textContent = currentRate.toFixed(2) + 'x';
          showSpeedMessage(currentRate.toFixed(2));
        }
        break;
      case 'KeyJ':
        e.preventDefault();
        currentRate = window.youtubePlayer.getPlaybackRate();
        if (currentRate > 0.25) {
          if (currentRate > 1) currentRate = 1.0;
          else {
            const speeds = [0.75, 0.5, 0.25];
            let index = speeds.findIndex(rate => rate < currentRate);
            if (index === -1) index = 0;
            currentRate = speeds[index];
          }
          window.youtubePlayer.setPlaybackRate(currentRate);
          const playbackSpeedDisplay = document.getElementById('playbackSpeedDisplay');
          if (playbackSpeedDisplay) playbackSpeedDisplay.textContent = currentRate.toFixed(2) + 'x';
          showSpeedMessage(currentRate.toFixed(2));
        }
        break;
      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          closeVideoModal();
        }
        break;
    }
  });
}

// Upravená funkcia vytvorLoggedInContainer
function vytvorLoggedInContainer() {
  const container = document.createElement('div');
  container.id = 'loggedInContainer';
  container.style.display = 'none';
  
  const adminButtons = document.createElement('div');
  adminButtons.id = 'adminButtons';
  adminButtons.style.display = 'none';
  
  const btnAplikacia = document.createElement('button');
  btnAplikacia.id = 'btnAplikacia';
  btnAplikacia.textContent = 'Aplikácia';
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
  btnPouzivatelia.textContent = 'Používatelia';
  btnPouzivatelia.style.padding = '10px 20px';
  btnPouzivatelia.style.border = 'none';
  btnPouzivatelia.style.borderRadius = '4px';
  btnPouzivatelia.style.fontSize = '14px';
  btnPouzivatelia.style.cursor = 'pointer';
  btnPouzivatelia.style.backgroundColor = '#e0e0e0';
  btnPouzivatelia.style.color = '#333';
  btnPouzivatelia.style.transition = 'background-color 0.3s';
  btnPouzivatelia.onclick = window.zobrazPouzivatelovAdmin;
  
  const btnVidea = document.createElement('button');
  btnVidea.id = 'btnVidea';
  btnVidea.textContent = '🎥 Spravovať videá';
  btnVidea.style.padding = '10px 20px';
  btnVidea.style.border = 'none';
  btnVidea.style.borderRadius = '4px';
  btnVidea.style.fontSize = '14px';
  btnVidea.style.cursor = 'pointer';
  btnVidea.style.backgroundColor = '#e0e0e0';
  btnVidea.style.color = '#333';
  btnVidea.style.transition = 'background-color 0.3s';
  btnVidea.onclick = window.zobrazSpravuVidei;
  
  adminButtons.appendChild(btnAplikacia);
  adminButtons.appendChild(btnPouzivatelia);
  adminButtons.appendChild(btnVidea);
  container.appendChild(adminButtons);
  
  const approvalMessage = document.createElement('div');
  approvalMessage.id = 'approvalMessage';
  approvalMessage.style.display = 'none';
  
  const approvalTitle = document.createElement('h3');
  approvalTitle.textContent = 'Čakáte na schválenie';
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
  
  const contentArea = document.createElement('div');
  contentArea.id = 'contentArea';
  contentArea.style.display = 'none';
  
  // Kontajner pre videá v contentArea
  const videaContainer = document.createElement('div');
  videaContainer.id = 'videaPrePouzivatelov';
  contentArea.appendChild(videaContainer);
  
  container.appendChild(contentArea);
  
  const adminPanel = document.createElement('div');
  adminPanel.id = 'adminPanel';
  adminPanel.style.display = 'none';
  
  // Admin title
  const adminTitle = document.createElement('h3');
  adminTitle.id = 'adminPanelTitle';
  adminTitle.textContent = 'Správa používateľov';
  adminTitle.style.margin = '0 0 15px 0';
  adminTitle.style.color = '#e65100';
  adminPanel.appendChild(adminTitle);
  
  // Tlačidlo na pridanie videa v admin paneli
  const addVideoBtn = document.createElement('button');
  addVideoBtn.id = 'addVideoBtn';
  addVideoBtn.textContent = '➕ Pridať nové video';
  addVideoBtn.style.padding = '12px 24px';
  addVideoBtn.style.backgroundColor = '#4CAF50';
  addVideoBtn.style.color = 'white';
  addVideoBtn.style.border = 'none';
  addVideoBtn.style.borderRadius = '4px';
  addVideoBtn.style.fontSize = '14px';
  addVideoBtn.style.cursor = 'pointer';
  addVideoBtn.style.marginBottom = '20px';
  addVideoBtn.style.transition = 'background-color 0.3s';
  addVideoBtn.onclick = window.otvorModalPridaniaVidea;
  addVideoBtn.style.display = 'none';
  adminPanel.appendChild(addVideoBtn);
  
  // Kontajner pre zoznam videí v admin paneli
  const videaList = document.createElement('div');
  videaList.id = 'videaList';
  videaList.style.display = 'none';
  adminPanel.appendChild(videaList);
  
  // Kontajner pre zoznam používateľov
  const usersList = document.createElement('div');
  usersList.id = 'usersList';
  usersList.style.display = 'block';
  adminPanel.appendChild(usersList);
  
  container.appendChild(adminPanel);
  
  document.body.appendChild(container);
  
  // Vytvoriť video prehrávač
  vytvorVideoPlayer();
  
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
        // Zavrieť video modal ak je otvorený
        closeVideoModal();
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

function vytvorAuthContainer() {
  const container = document.createElement('div');
  container.id = 'authContainer';
  container.style.display = 'none';
  
  const authCard = document.createElement('div');
  authCard.className = 'auth-card';
  
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
