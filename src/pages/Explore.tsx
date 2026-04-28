import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Filter, Search, Loader2 } from "lucide-react";
import axios from "axios";
import { cn, getTMDBImageUrl } from "../lib/utils";
import type { Movie, Genre, TMDBResponse } from "../types";

export default function Explore() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch Genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axios.get<{ genres: Genre[] }>("/api/tmdb/genre/movie/list");
        setGenres(res.data.genres);
      } catch (err) {
        console.error("Failed to fetch genres", err);
      }
    };
    fetchGenres();
  }, []);

  // Fetch Movies
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const endpoint = searchQuery ? "search/movie" : "movie/popular";
        const res = await axios.get<TMDBResponse<Movie>>(`/api/tmdb/${endpoint}`, {
          params: { 
            page, 
            with_genres: selectedGenre || undefined,
            query: searchQuery || undefined 
          }
        });
        
        setMovies(prev => page === 1 ? res.data.results : [...prev, ...res.data.results]);
        setHasMore(res.data.page < res.data.total_pages);
      } catch (err) {
        console.error("Failed to fetch movies", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [page, selectedGenre, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setMovies([]);
  };

  const downloadPoster = async (posterPath: string | null, title?: string) => {
    if (!posterPath) return;
    try {
      const url = getTMDBImageUrl(posterPath, "original");
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'image/jpeg' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${(title || 'poster').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <div className="space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="w-full md:w-auto">
          <h1 className="display-text mb-4">EXPLORE.</h1>
          <p className="text-xl font-light text-zinc-400">Hand-picked posters from the worldwide cinema database.</p>
        </div>

        <form onSubmit={handleSearch} className="w-full md:w-96 flex gap-2 p-2 glass-card rounded-xl">
           <input 
            type="text" 
            placeholder="Search movies..."
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 font-medium text-white placeholder-zinc-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
           />
           <button type="submit" className="bg-white text-black p-3 rounded-lg hover:bg-[#FF3E3E] hover:text-white transition-all">
             <Search size={18} />
           </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 py-6 border-y border-white/5">
        <FilterButton 
          active={selectedGenre === null} 
          onClick={() => { setSelectedGenre(null); setPage(1); }}
        >
          All Genres
        </FilterButton>
        {genres.map(genre => (
          <FilterButton
            key={genre.id}
            active={selectedGenre === genre.id}
            onClick={() => { setSelectedGenre(genre.id); setPage(1); }}
          >
            {genre.name}
          </FilterButton>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
        {movies.map((movie, index) => {
          const isLastElement = movies.length === index + 1;
          return (
            <div 
              key={`${movie.id}-${index}`} 
              ref={isLastElement ? lastMovieElementRef : null}
              className="group flex flex-col h-full"
            >
              <div className="poster-thumb rounded-xl overflow-hidden group-hover:-translate-y-2">
                <img 
                  src={getTMDBImageUrl(movie.poster_path, "w500")}
                  alt={movie.title || movie.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                  <div className="micro-label text-[#FF3E3E] mb-2">
                    {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0] || 'N/A'}
                  </div>
                  <h3 className="text-lg font-black leading-tight uppercase mb-6 line-clamp-2">
                    {movie.title || movie.name}
                  </h3>
                  <div className="flex flex-col gap-2 w-full">
                    <button 
                      onClick={() => downloadPoster(movie.poster_path, movie.title || movie.name)}
                      className="w-full bg-white text-black py-3 micro-label text-center hover:bg-[#FF3E3E] hover:text-white transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between items-start">
                <div>
                   <h3 className="font-bold text-sm tracking-tight uppercase line-clamp-1">
                    {movie.title || movie.name}
                  </h3>
                  <p className="micro-label mt-1 text-[9px]">{movie.vote_average.toFixed(1)} Rating</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin w-12 h-12 text-[#FF3E3E]" />
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  key?: React.Key;
}

function FilterButton({ children, active, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2 micro-label transition-all border rounded-full",
        active 
          ? "bg-white text-black border-white" 
          : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500"
      )}
    >
      {children}
    </button>
  );
}
