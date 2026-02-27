"use client";
import Image from 'next/image';
import { Layers, LogOut, PlusCircle } from 'lucide-react';
import type { UserProfile } from '../types';

const Navbar = ({
  onViewChange,
  user,
  onLoginClick,
  onLogoutClick,
}: {
  onViewChange: (view: 'home' | 'project' | 'request' | 'profile') => void;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}) => (
  <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
    <div className="container mx-auto flex justify-between items-center">
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => onViewChange('home')}
      >
        <Layers className="text-blue-400" size={28} />
        <span className="text-xl font-bold tracking-tight">
          Blueprint<span className="text-blue-400">Hub</span>
        </span>
      </div>
      <div className="flex items-center space-x-6">
        <button
          onClick={() => onViewChange('home')}
          className="hover:text-blue-300 transition text-sm font-medium"
        >
          Explore
        </button>

        <button
          onClick={() => (user ? onViewChange('request') : onLoginClick())}
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition font-medium text-sm shadow-lg shadow-blue-900/20"
        >
          <PlusCircle size={18} />
          <span>Post Idea</span>
        </button>

        {user ? (
          <div className="flex items-center space-x-4 pl-4 border-l border-slate-700">
            <div
              className="flex items-center space-x-3 group cursor-pointer relative"
              onClick={() => onViewChange('profile')}
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-white">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  {user.role}
                </p>
              </div>
              <Image
                src={user.avatar}
                alt="Profile"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full border-2 border-slate-700 group-hover:border-blue-400 transition"
              />
            </div>
            <button
              onClick={onLogoutClick}
              className="text-slate-400 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-2 rounded hover:bg-slate-800"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  </nav>
);

export default Navbar;
