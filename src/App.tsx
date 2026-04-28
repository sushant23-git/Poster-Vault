import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Image as ImageIcon, Menu, X } from "lucide-react";
import { cn } from "./lib/utils";
import Home from "./pages/Home";
import Explore from "./pages/Explore";

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF3E3E] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <span className="bg-[#FF3E3E] p-1 px-2 rounded-sm text-black">PV</span>
            POSTERVAULT
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <NavLink to="/">Downloader</NavLink>
            <NavLink to="/explore">Explore</NavLink>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 bg-[#050505] pt-28 px-8 md:hidden"
          >
            <div className="flex flex-col gap-8">
              <Link to="/" className="text-5xl font-black tracking-tighter uppercase" onClick={() => setIsMenuOpen(false)}>Downloader</Link>
              <Link to="/explore" className="text-5xl font-black tracking-tighter uppercase" onClick={() => setIsMenuOpen(false)}>Explore</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="pt-32 pb-20 px-8 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
        </Routes>
      </main>

        {/* Footer */}
        <footer className="py-20 border-t border-white/5 bg-[#050505] overflow-hidden">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
              {/* About Section */}
              <div className="text-center md:text-left">
                <h3 className="micro-label text-white mb-6">About PosterVault</h3>
                <p className="text-zinc-400 text-sm leading-relaxed font-light">
                  PosterVault is your high-quality cinematic archive. 
                  Instantly batch-download posters from Letterboxd and IMDb 
                  lists to build your local collection or digital library.
                </p>
              </div>
              
              {/* Social Links Section */}
              <div className="text-center">
                <h3 className="micro-label text-white mb-6">Connect</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <a href="https://github.com/sushant23-git" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                    <span className="sr-only">GitHub</span>
                    GH
                  </a>
                  <a href="https://www.linkedin.com/in/sushant-gajbhiye-2057213b0/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                    <span className="sr-only">LinkedIn</span>
                    LI
                  </a>
                  <a href="https://www.instagram.com/sushaannnnttttttt/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                    <span className="sr-only">Instagram</span>
                    IG
                  </a>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="text-center md:text-right">
                <h3 className="micro-label text-white mb-6">Powered By</h3>
                <div className="space-y-3 micro-label text-zinc-500">
                  <p className="hover:text-white transition-colors cursor-default">The Movie Database (TMDb)</p>
                  <p className="hover:text-white transition-colors cursor-default">IMDb / Letterboxd</p>
                </div>
              </div>
            </div>
            
            {/* Copyright Notice */}
            <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="micro-label opacity-30">
                © 2026 POSTERVAULT. ALL RIGHTS RESERVED TO SUSHANT GAJBHIYE.
              </p>
              <div className="flex gap-8 micro-label opacity-30">
                <span className="hover:opacity-100 transition-opacity cursor-default">v1.0.0</span>
                <span className="hover:opacity-100 transition-opacity cursor-default">Grid System</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "micro-label transition-all hover:text-white",
        isActive ? "text-white border-b border-[#FF3E3E]" : "text-zinc-500"
      )}
    >
      {children}
    </Link>
  );
}
