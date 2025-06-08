# PDF Hub Pro

![App Screenshot](./assets/screenshots/screenshot1.png)

A Progressive Web App for managing and viewing PDF documents with Firebase integration.

## Features

- 🔍 Search and filter PDFs by categories
- 🌓 Dark/Light mode toggle
- 📄 PDF metadata display (pages, size, etc.)
- ⭐ Rating and comment system
- 🔐 Admin panel for PDF management
- 📲 PWA support (installable and works offline)
- 💬 Multi-language support (English & Indonesian)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pdf-hub-pro.git
   cd pdf-hub-pro



### 📄 **5. `.github/workflows/deploy.yml`**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build project
        run: npm run build
      
      - name: Verify build
        run: |
          ls -la public/
          [ -f public/index.html ] || exit 1
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          force_orphan: true
          keep_files: false
