// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MotionCanvas from '../common/MotionCanvas';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen font-body text-ink selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-950">
      {/* Fixed, full-viewport ambient spatial canvas */}
      <MotionCanvas />

      <div className="relative z-10 flex min-h-screen flex-col">
        {isAuthenticated && <Navbar />}

        <main
          className={`flex-1 ${
            isAuthenticated
              ? 'mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'
              : 'w-full flex items-center justify-center'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}