"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  src: string;
  alt: string;
  isPdf?: boolean;
  onClose: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export default function CertificateLightbox({ src, alt, isPdf = false, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
      if (e.key === "-") setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
      if (e.key === "0") { setZoom(1); setOffset({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Reset offset when zoom resets to 1
  useEffect(() => {
    if (zoom === 1) setOffset({ x: 0, y: 0 });
  }, [zoom]);

  const zoomIn = () => setZoom((z) => Math.min(+(z + ZOOM_STEP).toFixed(2), MAX_ZOOM));
  const zoomOut = () => setZoom((z) => Math.max(+(z - ZOOM_STEP).toFixed(2), MIN_ZOOM));
  const resetZoom = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  // Mouse drag to pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => Math.min(Math.max(+(z + delta).toFixed(2), MIN_ZOOM), MAX_ZOOM));
  };

  const zoomPct = Math.round(zoom * 100);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" role="dialog" aria-modal="true" aria-label={alt}>
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--nav-bg)", backdropFilter: "blur(16px)" }}>
        <p className="text-sm font-medium truncate max-w-xs text-slate-700 dark:text-white/80">{alt}</p>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="Zoom out (–)"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-black/[0.05] hover:bg-black/[0.10] border border-black/[0.09] text-slate-500 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/60 dark:hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
            </svg>
          </button>

          <button
            onClick={resetZoom}
            title="Reset zoom (0)"
            className="min-w-[3.5rem] h-8 flex items-center justify-center rounded-lg transition-all text-xs font-mono bg-black/[0.05] hover:bg-black/[0.10] border border-black/[0.09] text-slate-500 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/60 dark:hover:text-white"
          >
            {zoomPct}%
          </button>

          <button
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom in (+)"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-black/[0.05] hover:bg-black/[0.10] border border-black/[0.09] text-slate-500 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/60 dark:hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
          </button>

          <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

          {/* Open original */}
          {!isPdf && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              title="Open original"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all bg-black/[0.05] hover:bg-black/[0.10] border border-black/[0.09] text-slate-500 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/60 dark:hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all bg-black/[0.05] hover:bg-red-500/10 border border-black/[0.09] hover:border-red-500/30 text-slate-500 hover:text-red-600 dark:bg-white/5 dark:hover:bg-red-500/20 dark:border-white/10 dark:hover:border-red-500/30 dark:text-white/60 dark:hover:text-red-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image / PDF area */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
        style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
      >
        {isPdf ? (
          <iframe
            src={src}
            title={alt}
            className="relative z-10 w-full h-full"
            style={{
              transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
              transformOrigin: "center center",
              transition: dragging ? "none" : "transform 0.15s ease",
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            draggable={false}
            onMouseDown={handleMouseDown}
            className="relative z-10 max-w-full max-h-full object-contain select-none rounded-lg shadow-2xl"
            style={{
              transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
              transformOrigin: "center center",
              transition: dragging ? "none" : "transform 0.15s ease",
            }}
          />
        )}
      </div>

      {/* Bottom hint bar */}
      <div className="relative z-10 flex items-center justify-center gap-6 py-2.5 shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--nav-bg)", backdropFilter: "blur(16px)" }}>
        <span className="text-xs flex items-center gap-1.5 text-slate-400 dark:text-white/25">
          <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-black/[0.06] border border-black/[0.09] text-slate-500 dark:bg-white/8 dark:border-white/10 dark:text-white/40">scroll</kbd>
          Zoom
        </span>
        <span className="text-xs flex items-center gap-1.5 text-slate-400 dark:text-white/25">
          <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-black/[0.06] border border-black/[0.09] text-slate-500 dark:bg-white/8 dark:border-white/10 dark:text-white/40">drag</kbd>
          Pan
        </span>
        <span className="text-xs flex items-center gap-1.5 text-slate-400 dark:text-white/25">
          <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-black/[0.06] border border-black/[0.09] text-slate-500 dark:bg-white/8 dark:border-white/10 dark:text-white/40">Esc</kbd>
          Close
        </span>
        <span className="text-xs flex items-center gap-1.5 text-slate-400 dark:text-white/25">
          <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-black/[0.06] border border-black/[0.09] text-slate-500 dark:bg-white/8 dark:border-white/10 dark:text-white/40">0</kbd>
          Reset
        </span>
      </div>
    </div>
  );
}
