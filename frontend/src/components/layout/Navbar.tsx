"use client";

import React from "react";
import { Flame, ShieldCheck, RefreshCw, Layers, Cpu } from "lucide-react";

interface NavbarProps {
  onReset: () => void;
  isResetting: boolean;
  razorpayMode: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset, isResetting, razorpayMode }) => {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-950/50">
            <Flame className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">PayFire</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
                Chaos Lab
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">
              Break payments before they break your revenue.
            </p>
          </div>
        </div>

        {/* Merchant & System Status Badges */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-gray-400">Merchant:</span>
            <span className="font-semibold text-gray-200">FlashCart (₹2.0 Cr GMV)</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-400 hidden sm:inline">Guardrails:</span>
            <span className="font-semibold text-emerald-400">8 Enforced</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-gray-400 hidden sm:inline">Engine:</span>
            <span className="font-mono text-purple-300 uppercase">{razorpayMode}</span>
          </div>

          {/* Reset Baseline Action */}
          <button
            onClick={onReset}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-all disabled:opacity-50"
            title="Reset system back to 100% nominal healthy state"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-300 ${isResetting ? "animate-spin" : ""}`} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
