"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Shield, Info, Heart } from "lucide-react";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-10 pb-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                JS
              </div>
              <span className="text-base font-bold text-white tracking-tight">{t("appName")}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              An independent civic technology initiative designed to streamline citizen problem reporting, intelligent jurisdictional routing, and transparent resolution tracking for Indian cities.
            </p>
          </div>

          {/* Citizen Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Citizens</h4>
            <ul className="space-y-2">
              <li><Link href="/submit" className="hover:text-blue-400 transition">Report a Problem</Link></li>
              <li><Link href="/complaints" className="hover:text-blue-400 transition">Track My Reports</Link></li>
              <li><Link href="/common-problems" className="hover:text-blue-400 transition">Public Issues Map</Link></li>
              <li><Link href="/faq" className="hover:text-blue-400 transition">Help & FAQ</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Administrative</h4>
            <ul className="space-y-2">
              <li><Link href="/officer" className="hover:text-blue-400 transition">Authority Officer Portal</Link></li>
              <li><Link href="/admin" className="hover:text-blue-400 transition">Platform Administrator</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition">Demo Account Access</Link></li>
            </ul>
          </div>

          {/* Honest Prototype Statement */}
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-1">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Independent Platform</span>
            </div>
            <p className="text-slate-400 leading-normal text-[11px]">
              This is an independent startup MVP prototype. It does not claim official endorsement by the Government of India or municipal bodies. Sample data and authority mappings are for demonstration.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Jan Seva Platform. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span>Built with Python FastAPI & Next.js</span>
            <span>•</span>
            <span>Privacy By Default</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
