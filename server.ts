import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // TMDB Proxy
  app.get("/api/tmdb/*", async (req, res) => {
    try {
      const tmdbKey = process.env.TMDB_API_KEY;
      if (!tmdbKey) {
        return res.status(500).json({ error: "TMDB_API_KEY is not configured" });
      }

      const endpoint = req.params[0];
      const params = { ...req.query, api_key: tmdbKey };
      
      const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, { params });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Internal Server Error" });
    }
  });

  // List Scraper API
  app.post("/api/parse-list", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const titles: string[] = [];
      const isLetterboxd = url.includes("letterboxd.com");
      const isImdb = url.includes("imdb.com");

      if (!isLetterboxd && !isImdb) {
        return res.status(400).json({ error: "Invalid URL. Only Letterboxd and IMDb lists are supported." });
      }

      // Simple scraper logic - can be expanded for pagination
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);

      if (isLetterboxd) {
        // Letterboxd: Movie tiles have data-film-slug or alt text in img
        $('.poster-container .poster img').each((_, el) => {
          const title = $(el).attr('alt');
          if (title) titles.push(title);
        });
        
        // If it's a grid list without img alt sometimes
        if (titles.length === 0) {
          $('.film-poster').each((_, el) => {
             const title = $(el).find('img').attr('alt') || $(el).attr('data-film-slug')?.split('-').join(' ');
             if (title) titles.push(title);
          });
        }
      } else if (isImdb) {
        // IMDb List
        $('.ipc-metadata-list-summary-item .ipc-title__text').each((_, el) => {
          const text = $(el).text();
          // IMDb titles often have "1. Title" format
          const title = text.replace(/^\d+\.\s+/, '');
          if (title) titles.push(title);
        });
      }

      // De-duplicate
      const uniqueTitles = Array.from(new Set(titles));

      res.json({ count: uniqueTitles.length, titles: uniqueTitles });
    } catch (error: any) {
      console.error("Scraping error:", error.message);
      res.status(500).json({ error: "Failed to parse list. The URL might be private or invalid." });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
