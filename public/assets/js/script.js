// ===== Firebase Initialization =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-ABCDEF123"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== DOM Elements =====
const pdfList = document.getElementById('pdf-list');
const searchInput = document.getElementById('search');
const pdfPreview = document.getElementById('pdf-preview');
const darkModeToggle = document.getElementById('darkModeToggle');
const adminToggle = document.getElementById('adminToggle');
const adminPanel = document.getElementById('adminPanel');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const tabs = document.querySelectorAll('.tab');
const commentsList = document.getElementById('commentsList');
const commentInput = document.getElementById('commentInput');
const postCommentBtn = document.getElementById('postCommentBtn');
const stars = document.querySelectorAll('.stars span');

// ===== Global Variables =====
let currentPDF = null;
let currentRating = 0;

// ===== PDF Database (Sample Data) =====
const pdfDatabase = [
  { 
    name: 'JavaScript Tutorial', 
    file: 'javascript-tutorial.pdf',
    category: 'tutorial',
    password: null
  },
  { 
    name: 'Git Guide', 
    file: 'git-guide.pdf',
    category: 'tutorial',
    password: null
  },
  { 
    name: 'CSS Cheatsheet', 
    file: 'css-cheatsheet.pdf',
    category: 'cheatsheet',
    password: 'secret123' // Password protected
  }
];

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.dataset.theme = savedTheme;
  
  // Render PDFs
  renderPDFList(pdfDatabase);
  
  // Initialize Firebase Analytics
  logEvent('page_view', { page_title: 'Home' });
  
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceWorker.js')
      .then(registration => {
        console.log('ServiceWorker registered');
      });
  }
});

// ===== Dark Mode Toggle =====
darkModeToggle.addEventListener('click', () => {
  const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
  logEvent('dark_mode_toggle', { mode: newTheme });
});

// ===== Admin Mode Toggle =====
adminToggle.addEventListener('click', () => {
  auth.signInAnonymously()
    .then(() => {
      adminPanel.style.display = adminPanel.style.display === 'block' ? 'none' : 'block';
      logEvent('admin_toggle', { state: adminPanel.style.display });
    })
    .catch(error => {
      console.error('Authentication error:', error);
    });
});

// ===== PDF List Rendering =====
function renderPDFList(pdfs) {
  pdfList.innerHTML = '';
  
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
    pdfList.appendChild(listItem);
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

// ===== PDF Preview =====
function showPDFPreview(pdf) {
  const pdfPath = `pdfs/${pdf.file}`;
  
  pdfPreview.innerHTML = `
    <div class="pdf-container">
      <embed src="${pdfPath}" type="application/pdf" width="100%" height="500px">
      <div class="metadata">
        <p><strong>📄 ${translations[currentLang].pages || 'Pages'}:</strong> ${pdf.pages || 'N/A'}</p>
        <p><strong>📦 ${translations[currentLang].size || 'Size'}:</strong> ${pdf.size || 'N/A'}</p>
        <p><strong>📅 ${translations[currentLang].uploaded || 'Uploaded'}:</strong> ${pdf.uploadedAt || 'N/A'}</p>
      </div>
    </div>
  `;
  
  downloadBtn.onclick = () => {
    logDownload(pdf.name);
    window.open(pdfPath, '_blank');
  };
  
  shareBtn.onclick = () => sharePDF(pdf.name, pdfPath);
  
  // Load comments for this PDF
  loadComments();
}

// ===== Search Functionality =====
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.toLowerCase();
  const filtered = pdfDatabase.filter(pdf => 
    pdf.name.toLowerCase().includes(searchTerm)
  );
  renderPDFList(filtered);
});

// ===== Tab System =====
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const category = tab.dataset.category;
    const filtered = category === 'all' 
      ? pdfDatabase 
      : pdfDatabase.filter(pdf => pdf.category === category);
    
    renderPDFList(filtered);
    logEvent('filter_pdfs', { category });
  });
});

// ===== Drag & Drop Upload =====
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.backgroundColor = '';
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.backgroundColor = '';
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});

function handleFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type !== 'application/pdf') continue;
    
    const reader = new FileReader();
    
    reader.onprogress = (e) => {
      const percent = Math.round((e.loaded / e.total) * 100);
      uploadProgress.value = percent;
    };
    
    reader.onload = (e) => {
      // Simulate upload to database
      setTimeout(() => {
        pdfDatabase.push({
          name: file.name.replace('.pdf', ''),
          file: file.name,
          category: 'tutorial',
          password: null
        });
        
        renderPDFList(pdfDatabase);
        uploadProgress.value = 0;
        logEvent('upload_pdf', { file_name: file.name });
      }, 1000);
    };
    
    reader.readAsDataURL(file);
  }
}

// ===== Share Functionality =====
function sharePDF(name, url) {
  if (navigator.share) {
    navigator.share({
      title: `Download ${name}`,
      text: 'Check out this PDF!',
      url: window.location.href + url,
    }).then(() => {
      logEvent('share_pdf', { pdf_name: name });
    });
  } else {
    // Fallback for browsers without Web Share API
    prompt('Copy this link to share:', url);
  }
}

// ===== Star Rating Interaction =====
stars.forEach(star => {
  star.addEventListener('click', () => {
    currentRating = parseInt(star.dataset.rating);
    updateStarDisplay();
  });
});

function updateStarDisplay() {
  stars.forEach((star, index) => {
    star.style.color = index < currentRating ? '#ffc107' : '#ccc';
  });
}

// ===== Post Comment =====
postCommentBtn.addEventListener('click', async () => {
  const commentText = commentInput.value.trim();
  
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
    
    commentInput.value = "";
    currentRating = 0;
    updateStarDisplay();
    loadComments();
  } catch (error) {
    console.error("Error posting comment:", error);
    alert("Failed to post comment. Please try again.");
  }
});

// ===== Load Comments =====
async function loadComments() {
  commentsList.innerHTML = '<div class="loading">Loading comments...</div>';
  
  try {
    const q = query(collection(db, "comments"), where("pdf", "==", currentPDF.name));
    const querySnapshot = await getDocs(q);
    
    commentsList.innerHTML = '';
    
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
      commentsList.appendChild(commentEl);
    });
  } catch (error) {
    console.error("Error loading comments:", error);
    commentsList.innerHTML = '<div class="error">Failed to load comments.</div>';
  }
}

// ===== Firebase Analytics =====
function logEvent(eventName, params) {
  if (typeof firebase !== 'undefined') {
    analytics.logEvent(eventName, params);
  }
}

function logDownload(pdfName) {
  logEvent('download_pdf', { pdf_name: pdfName });
}
