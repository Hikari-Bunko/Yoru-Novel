// Translation system for multi-language support
const translations = {
  en: {
    title: "PDF Hub Pro",
    searchPlaceholder: "🔍 Search PDFs...",
    darkMode: "🌓 Dark Mode",
    adminMode: "🔒 Admin Mode",
    uploadText: "Drop PDFs here or click to upload",
    all: "All",
    tutorials: "Tutorials",
    cheatsheets: "Cheatsheets",
    preview: "🖥 Preview",
    download: "⬇️ Download",
    share: "🔗 Share",
    passwordPrompt: "This PDF is password protected. Enter password:",
    incorrectPassword: "Incorrect password!",
    comments: "💬 Comments",
    postComment: "Post Comment",
    pages: "Pages",
    size: "Size",
    uploaded: "Uploaded",
    loginSuccess: "Login successful!",
    registerSuccess: "Registration successful!"
  },
  id: {
    title: "PDF Hub Pro",
    searchPlaceholder: "🔍 Cari PDF...",
    darkMode: "🌓 Mode Gelap",
    adminMode: "🔒 Mode Admin",
    uploadText: "Letakkan PDF di sini atau klik untuk mengunggah",
    all: "Semua",
    tutorials: "Tutorial",
    cheatsheets: "Cheatsheet",
    preview: "🖥 Pratinjau",
    download: "⬇️ Unduh",
    share: "🔗 Bagikan",
    passwordPrompt: "PDF ini dilindungi kata sandi. Masukkan kata sandi:",
    incorrectPassword: "Kata sandi salah!",
    comments: "💬 Komentar",
    postComment: "Kirim Komentar",
    pages: "Halaman",
    size: "Ukuran",
    uploaded: "Diunggah",
    loginSuccess: "Login berhasil!",
    registerSuccess: "Registrasi berhasil!"
  }
};

// Set language function
let currentLang = localStorage.getItem('language') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = translations[lang][key] || translations['en'][key];
  });
}

// Export translation system
export { translations, currentLang, setLanguage };

