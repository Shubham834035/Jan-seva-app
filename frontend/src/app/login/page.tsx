"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api, setToken, setCurrentUser } from "@/lib/api";
import { LogIn, Key, Mail, ShieldAlert, CheckCircle2, User, UserCheck, Shield } from "lucide-react";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.login({ email, password });
      setToken(data.access_token);
      setCurrentUser(data.user);

      // Role-based routing
      if (data.user.role === "AUTHORITY_OFFICER") {
        router.push("/officer");
      } else if (data.user.role === "PLATFORM_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
          JS
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Login to Jan Seva
        </h2>
        <p className="text-xs text-gray-500">
          Access your citizen reports, officer desk, or administration portal.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-200 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="name@example.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
            </button>
          </form>

          {/* Preset Demo Accounts for Evaluators */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block text-center">
              One-Click Demo Test Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials("citizen@example.in", "Citizen@123")}
                className="p-2 border border-blue-200 rounded-lg bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 text-left transition flex items-center space-x-1.5"
              >
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate font-semibold">Citizen Demo</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("citizen2@example.in", "Citizen@123")}
                className="p-2 border border-blue-200 rounded-lg bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 text-left transition flex items-center space-x-1.5"
              >
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate font-semibold">Citizen 2 (Hindi)</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("pwd_officer@demo.gov.in", "Officer@123")}
                className="p-2 border border-purple-200 rounded-lg bg-purple-50/50 hover:bg-purple-100/70 text-purple-900 text-left transition flex items-center space-x-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate font-semibold">PWD Officer</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("waste_officer@demo.gov.in", "Officer@123")}
                className="p-2 border border-emerald-200 rounded-lg bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-900 text-left transition flex items-center space-x-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate font-semibold">Waste Officer</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("admin@janseva.org", "Admin@123")}
                className="col-span-2 p-2 border border-slate-300 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-left transition flex items-center space-x-1.5 justify-center"
              >
                <Shield className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span className="font-semibold">Platform Administrator Demo</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Register as Citizen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
