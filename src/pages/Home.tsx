import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Search, Loader2, CheckCircle, AlertCircle, FileArchive, ImageIcon } from "lucide-react";
import axios from "axios";
import JSZip from "jszip";
import { getTMDBImageUrl, cn } from "../lib/utils";
import type { Movie, TMDBResponse } from "../types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "parsing" | "fetching" | "zipping" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [postersFound, setPostersFound] = useState<number>(0);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setError("");
    setStatus("parsing");
    setPostersFound(0);
    setProgress({ current: 0, total: 0 });

    try {
      // 1. Parse List
      const parseRes = await axios.post("/api/parse-list", { url });
      const titles = parseRes.data.titles as string[];
      
      if (titles.length === 0) {
        throw new Error("No movies found in this list.");
      }

      setStatus("fetching");
      setProgress({ current: 0, total: titles.length });

      const zip = new JSZip();
      const posterFolder = zip.folder("movie-posters");
      
      let successCount = 0;

      // 2. Fetch TMDB Data for each title
      // Batch processing would be better, but we'll do sequential for now or small concurrency
      const fetchPoster = async (title: string, index: number) => {
        try {
          const searchRes = await axios.get<TMDBResponse<Movie>>(`/api/tmdb/search/multi`, {
            params: { query: title, include_adult: false }
          });

          const result = searchRes.data.results[0];
          if (result && result.poster_path) {
            const imageUrl = getTMDBImageUrl(result.poster_path, "original");
            const imageRes = await axios.get(imageUrl, { responseType: 'blob' });
            
            const extension = result.poster_path.split('.').pop() || 'jpg';
            const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
            
            posterFolder?.file(fileName, imageRes.data);
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to fetch poster for ${title}`, err);
        } finally {
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      };

      // Process in batches of 5 to avoid rate limiting and browser hang
      const batchSize = 5;
      for (let i = 0; i < titles.length; i += batchSize) {
        const batch = titles.slice(i, i + batchSize);
        await Promise.all(batch.map((title, idx) => fetchPoster(title, i + idx)));
      }

      if (successCount === 0) {
        throw new Error("Could not find posters for any of the titles in this list.");
      }

      setPostersFound(successCount);
      setStatus("zipping");

      // 3. Generate ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Posters_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setStatus("done");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An unexpected error occurred.");
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-10 relative overflow-hidden">
      {/* Background Decorative Text */}
      <div className="absolute left-0 top-0 opacity-[0.03] pointer-events-none select-none hidden lg:block">
        <div className="display-text text-[20rem]">FETCH<br />FRAMES</div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl text-center z-10"
      >
        <h1 className="display-text mb-8">
          POSTER<br /><span className="text-[#FF3E3E]">PULL</span>.
        </h1>
        <p className="text-xl font-light text-zinc-400 mb-12 max-w-lg mx-auto leading-relaxed">
          Instant high-resolution poster archives from your Letterboxd or IMDb lists. Paste a URL, download a ZIP.
        </p>

        <form onSubmit={handleProcess} className="relative group mb-16">
          <div className="flex gap-2 p-2 glass-card rounded-xl shadow-2xl items-center">
            <input
              type="text"
              placeholder="Paste Letterboxd or IMDb URL..."
              className="bg-transparent border-none focus:ring-0 flex-1 px-6 py-4 text-white placeholder-zinc-600 font-medium text-lg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status !== "idle" && status !== "done" && status !== "error"}
            />
            <button
              type="submit"
              disabled={status !== "idle" && status !== "done" && status !== "error"}
              className="bg-white text-black px-8 py-4 font-bold uppercase text-xs rounded-lg hover:bg-[#FF3E3E] hover:text-white transition-all disabled:opacity-20 flex items-center gap-2"
            >
              {status === "idle" || status === "done" || status === "error" ? (
                <>Process <Download className="w-4 h-4" /></>
              ) : (
                <Loader2 className="animate-spin w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            {status === "parsing" && (
              <StatusCard 
                icon={<Search className="w-6 h-6 text-[#FF3E3E]" />}
                title="Analyzing List"
                description="Identifying movie titles from your provided URL..."
              />
            )}

            {status === "fetching" && (
              <StatusCard 
                icon={<ImageIcon className="w-6 h-6 text-[#FF3E3E]" />}
                title="Fetching Posters"
                description={`Found movies! Downloading high-res art piece by piece.`}
                progress={progress}
              />
            )}

            {status === "zipping" && (
              <StatusCard 
                icon={<FileArchive className="w-6 h-6 text-[#FF3E3E]" />}
                title="Bundling ZIP"
                description="Almost there! Compiling everything into a single package."
              />
            )}

            {status === "done" && (
              <StatusCard 
                icon={<CheckCircle className="w-6 h-6 text-green-500" />}
                title="All Set!"
                description={`Succesfully packaged ${postersFound} posters into your ZIP file.`}
                isSuccess
                onReset={() => setStatus("idle")}
              />
            )}

            {status === "error" && (
              <StatusCard 
                icon={<AlertCircle className="w-6 h-6 text-red-500" />}
                title="Error Occurred"
                description={error}
                isError
                onReset={() => setStatus("idle")}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="mt-20 flex flex-col items-center gap-6">
          <div className="flex -space-x-3">
             {[1,2,3].map(i => (
               <div key={i} className={cn("w-10 h-10 rounded-full border-2 border-[#050505] bg-zinc-800", `bg-zinc-${9-i}00`)} />
             ))}
          </div>
          <p className="micro-label">Used by 2.4k archivists this week</p>
        </div>
      </motion.div>
    </div>
  );
}

function StatusCard({ 
  icon, 
  title, 
  description, 
  progress, 
  isSuccess, 
  isError,
  onReset 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  progress?: { current: number; total: number };
  isSuccess?: boolean;
  isError?: boolean;
  onReset?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "glass-card p-8 text-left rounded-2xl",
        isError ? "border-red-500/50" : ""
      )}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1">{icon}</div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xl font-bold tracking-tight">{title}</h3>
            {isSuccess && <span className="bg-green-500 text-black px-2 py-0.5 text-[10px] font-black uppercase rounded">Ready</span>}
            {isError && <span className="bg-red-500 text-white px-2 py-0.5 text-[10px] font-black uppercase rounded">Error</span>}
          </div>
          <p className="text-sm font-light text-zinc-400">{description}</p>
          
          {progress && (
            <div className="mt-6">
              <div className="flex justify-between micro-label text-[10px] mb-2">
                <span>{progress.current} / {progress.total} Titles Found</span>
                <span className="text-white">{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full h-[3px] bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  className="h-full bg-[#FF3E3E]"
                />
              </div>
            </div>
          )}

          {(isSuccess || isError) && (
            <button 
              onClick={onReset}
              className="mt-6 micro-label text-zinc-200 hover:text-white underline underline-offset-8 transition-colors"
            >
              Start New List
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
