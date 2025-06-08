// Import Firebase modules
import { auth, db, signInAnonymously, addDoc, query, where, getDocs, logEvent } from './firebase-config.js';

// Import translation system
import { translations, currentLang, setLanguage } from './translations.js';

// ===== DOM Elements =====
const elements = {
  pdfList: document.getElementById('pdf-list'),
  searchInput: document.getElementById('search'),
  pdfPreview: document.getElementById('pdf-preview'),
  darkModeToggle: document.getElementById('darkModeToggle'),
  adminToggle: document.getElementById('adminToggle'),
  adminPanel: document.getElementById('adminPanel'),
  dropZone: document.getElementById('dropZone'),
  fileInput: document.getElementById('fileInput'),
  uploadProgress: document.getElementById('uploadProgress'),
  downloadBtn: document.getElementById('downloadBtn'),
  shareBtn: document.getElementById('shareBtn'),
  tabs: document.querySelectorAll('.tab'),
  commentsList: document.getElementById('commentsList'),
  commentInput: document.getElementById('commentInput'),
  postCommentBtn: document.getElementById('postCommentBtn'),
  stars: document.querySelectorAll('.stars span'),
  languageSelect: document.getElementById('languageSelect')
};

// ===== Global Variables =====
let currentPDF = null;
let currentRating = 0;

// ===== PDF Database (Sample Data) =====
const pdfDatabase = [
  { 
    name: 'JavaScript Tutorial', 
    file: 'javascript-tutorial.pdf',
    category: 'tutorial',
    password: null,
    pages: 42,
    size: '2.4 MB',
    uploadedAt: '2023-10-15'
  },
  { 
    name: 'Git Guide', 
    file: 'git-guide.pdf',
    category: 'tutorial',
    password: null,
    pages: 28,
    size: '1.8 MB',
    uploadedAt: '2023-10-10'
  },
  { 
    name: 'CSS Cheatsheet', 
    file: 'css-cheatsheet.pdf',
    category: 'cheatsheet',
    password: 'secret123',
    pages: 12,
    size: '0.9 MB',
    uploadedAt: '2023-10-05'
  }
];

// ===== Initialize App =====
function initApp() {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.dataset.theme = savedTheme;
  
  // Set language
  setLanguage(currentLang);
  elements.languageSelect.value = currentLang;
  
  // Render PDFs
  renderPDFList(pdfDatabase);
  
  // Initialize event listeners
  setupEventListeners();
  
  // Register Service Worker
  registerServiceWorker();
}

// ===== Event Listeners Setup =====
function setupEventListeners() {
  // Dark Mode Toggle
  elements.darkModeToggle.addEventListener('click', toggleDarkMode);
  
  // Admin Mode Toggle
  elements.adminToggle.addEventListener('click', toggleAdminPanel);
  
  // Search Functionality
  elements.searchInput.addEventListener('input', handleSearch);
  
  // Tab System
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => handleTabClick(tab));
  });
  
  // Drag & Drop Upload
  elements.dropZone.addEventListener('dragover', handleDragOver);
  elements.dropZone.addEventListener('dragleave', handleDragLeave);
  elements.dropZone.addEventListener('drop', handleDrop);
  elements.fileInput.addEventListener('change', handleFileInput);
  
  // PDF Actions
  elements.downloadBtn.addEventListener('click', handleDownload);
  elements.shareBtn.addEventListener('click', handleShare);
  
  // Comments System
  elements.stars.forEach(star => {
    star.addEventListener('click', () => handleStarClick(star));
  });
  elements.postCommentBtn.addEventListener('click', postComment);
  
  // Language Selector
  elements.languageSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });
}

// ===== Core Functions =====

// PDF List Rendering
function renderPDFList(pdfs) {
  elements.pdfList.innerHTML = '';
  
  pdfs.forEach(pdf => {
    const listItem = document.createElement('li');
    listItem.dataset.category = pdf.category;
    
    const link = document.createElement('a');
    link.href = `#`;
    link.textContent = pdf.name;
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentPDF = pdf;
      handlePDFClick(pdf);
    });
    
    listItem.appendChild(link);
    elements.pdfList.appendChild(listItem);
  });
}

function handlePDFClick(pdf) {
  if (pdf.password) {
    const password = prompt(translations[currentLang].passwordPrompt);
    if (password !== pdf.password) {
      alert(translations[currentLang].incorrectPassword);
      return;
    }
  }
  
  showPDFPreview(pdf);
  logEvent('preview_pdf', { pdf_name: pdf.name });
}

// PDF Preview
function showPDFPreview(pdf) {
  const pdfPath = `pdfs/${pdf.file}`;
  
  elements.pdfPreview.innerHTML = `
    <div class="pdf-container">
      <embed src="${pdfPath}" type="application/pdf" width="100%" height="500px">
      <div class="metadata">
        <p><strong>📄 ${translations[currentLang].pages}:</strong> ${pdf.pages || 'N/A'}</p>
        <p><strong>📦 ${translations[currentLang].size}:</strong> ${pdf.size || 'N/A'}</p>
        <p><strong>📅 ${translations[currentLang].uploaded}:</strong> ${pdf.uploadedAt || 'N/A'}</p>
      </div>
    </div>
  `;
  
  // Load comments for this PDF
  loadComments();
}

// Search Functionality
function handleSearch() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const filtered = pdfDatabase.filter(pdf => 
    pdf.name.toLowerCase().includes(searchTerm)
  );
  renderPDFList(filtered);
}

// Tab System
function handleTabClick(tab) {
  elements.tabs.forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  
  const category = tab.dataset.category;
  const filtered = category === 'all' 
    ? pdfDatabase 
    : pdfDatabase.filter(pdf => pdf.category === category);
  
  renderPDFList(filtered);
  logEvent('filter_pdfs', { category });
}

// File Upload Handling
function handleFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type !== 'application/pdf') continue;
    
    const reader = new FileReader();
    
    reader.onprogress = (e) => {
      const percent = Math.round((e.loaded / e.total) * 100);
      elements.uploadProgress.value = percent;
    };
    
    reader.onload = (e) => {
      // Simulate upload to database
      setTimeout(() => {
        pdfDatabase.push({
          name: file.name.replace('.pdf', ''),
          file: file.name,
          category: 'tutorial',
          password: null,
          pages: 0,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          uploadedAt: new Date().toISOString().split('T')[0]
        });
        
        renderPDFList(pdfDatabase);
        elements.uploadProgress.value = 0;
        logEvent('upload_pdf', { file_name: file.name });
      }, 1000);
    };
    
    reader.readAsDataURL(file);
  }
}

// Dark Mode Toggle
function toggleDarkMode() {
  const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
  logEvent('dark_mode_toggle', { mode: newTheme });
}

// Admin Panel Toggle
function toggleAdminPanel() {
  signInAnonymously(auth)
    .then(() => {
      elements.adminPanel.style.display = elements.adminPanel.style.display === 'block' ? 'none' : 'block';
      logEvent('admin_toggle', { state: elements.adminPanel.style.display });
    })
    .catch(error => {
      console.error('Authentication error:', error);
    });
}

// Drag and Drop Handlers
function handleDragOver(e) {
  e.preventDefault();
  elements.dropZone.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
}

function handleDragLeave() {
  elements.dropZone.style.backgroundColor = '';
}

function handleDrop(e) {
  e.preventDefault();
  elements.dropZone.style.backgroundColor = '';
  handleFiles(e.dataTransfer.files);
}

function handleFileInput() {
  handleFiles(elements.fileInput.files);
}

// PDF Actions
function handleDownload() {
  if (!currentPDF) return;
  const pdfPath = `pdfs/${currentPDF.file}`;
  logDownload(currentPDF.name);
  window.open(pdfPath, '_blank');
}

function handleShare() {
  if (!currentPDF) return;
  const pdfPath = `pdfs/${currentPDF.file}`;
  sharePDF(currentPDF.name, pdfPath);
}

// Comments System
function handleStarClick(star) {
  currentRating = parseInt(star.dataset.rating);
  updateStarDisplay();
}

function updateStarDisplay() {
  elements.stars.forEach((star, index) => {
    star.style.color = index < currentRating ? '#ffc107' : '#ccc';
  });
}

async function postComment() {
  const commentText = elements.commentInput.value.trim();
  
  if (!commentText) {
    alert('Please enter a comment!');
    return;
  }
  
  if (!currentRating) {
    alert('Please select a rating!');
    return;
  }
  
  try {
    await addDoc(collection(db, "comments"), {
      pdf: currentPDF.name,
      text: commentText,
      rating: currentRating,
      user: auth.currentUser?.email || "Anonymous",
      timestamp: new Date()
    });
    
    elements.commentInput.value = "";
    currentRating = 0;
    updateStarDisplay();
    loadComments();
  } catch (error) {
    console.error("Error posting comment:", error);
    alert("Failed to post comment. Please try again.");
  }
}

async function loadComments() {
  elements.commentsList.innerHTML = '<div class="loading">Loading comments...</div>';
  
  try {
    const q = query(collection(db, "comments"), where("pdf", "==", currentPDF.name));
    const querySnapshot = await getDocs(q);
    
    elements.commentsList.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
      const comment = doc.data();
      const commentEl = document.createElement('div');
      commentEl.className = 'comment';
      commentEl.innerHTML = `
        <div class="comment-header">
          <strong>${comment.user}</strong>
          <div class="comment-rating">${'★'.repeat(comment.rating)}</div>
        </div>
        <p>${comment.text}</p>
        <small>${new Date(comment.timestamp?.toDate()).toLocaleString()}</small>
      `;
      elements.commentsList.appendChild(commentEl);
    });
  } catch (error) {
    console.error("Error loading comments:", error);
    elements.commentsList.innerHTML = '<div class="error">Failed to load comments.</div>';
  }
}

// Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceWorker.js')
      .then(registration => {
        console.log('ServiceWorker registered');
      });
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);
