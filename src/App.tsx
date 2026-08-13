import React, { useEffect, useState } from 'react';
import { MancalaSolver } from './components/MancalaSolver';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/whoami')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIsAdmin(Boolean(data?.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#111111] text-[#e0e0e0] flex flex-col font-sans selection:bg-[#d4af37] selection:text-black">
      <main className="flex-1">
        <MancalaSolver />
      </main>

      <footer className="border-t border-[#262626] bg-[#0c0c0c] py-6 text-center text-xs text-[#666]">
        Mancala Solver
        {isAdmin && (
          <>
            {' · '}
            <a href="/admin" className="text-[#d4af37] hover:underline">
              Admin panel
            </a>
          </>
        )}
      </footer>
    </div>
  );
}
