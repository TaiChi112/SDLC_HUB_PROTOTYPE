"use client";
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void;
      contentLoaded: () => void;
    };
  }
}

const MermaidDiagram = ({ code }: { code: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;

    if (!window.mermaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
      script.onload = () => {
        if (window.mermaid) {
          window.mermaid.initialize({ startOnLoad: true, theme: 'default' });
        }
        setIsLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(() => setIsLoaded(true), 0);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && containerRef.current && window.mermaid) {
      containerRef.current.innerHTML = `<div class="mermaid">${code}</div>`;
      try {
        window.mermaid.contentLoaded();
      } catch {}
    }
  }, [isLoaded, code]);

  return (
    <div
      className="w-full overflow-x-auto bg-white p-4 rounded-lg border border-slate-100 flex justify-center min-h-25"
      ref={containerRef}
    >
      <div className="animate-pulse flex space-x-4 w-full justify-center opacity-50">
        Loading Diagram...
      </div>
    </div>
  );
};

export default MermaidDiagram;
