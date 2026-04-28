<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PosterVault

PosterVault is a web application designed for browsing, downloading, and managing movie posters. Built with React, Vite, and Tailwind CSS, it offers a fast, modern, and beautiful interface for movie enthusiasts.

## ✨ Features

- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion for smooth animations.
- **Fast Development**: Powered by Vite and React 19.
- **Backend API**: Integrated Express server for handling data fetching and scraping logic.
- **Responsive Design**: Works perfectly across desktop, tablet, and mobile devices.

## 🚀 Tech Stack

- **Frontend**: React 19, React Router, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Express, Axios, Cheerio
- **Build Tool**: Vite
- **Language**: TypeScript / Node.js

## 📦 Run Locally

**Prerequisites:** Node.js (v18+ recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sushant23-git/Poster-Vault.git
   cd Poster-Vault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`
   - Fill in any necessary API keys or configuration values.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *This starts both the Vite frontend and the Express backend concurrently via `tsx`.*

## 🛠️ Build for Production

To create a production build, run:
```bash
npm run build
```
This command generates static assets in the `dist` folder.

## 📝 Scripts

- `npm run dev`: Starts the application in development mode.
- `npm run build`: Compiles the application for production.
- `npm run preview`: Locally previews the production build.
- `npm run clean`: Removes the `dist` folder.
- `npm run lint`: Runs TypeScript type checking.

## 📄 License

This project is licensed under the MIT License.
