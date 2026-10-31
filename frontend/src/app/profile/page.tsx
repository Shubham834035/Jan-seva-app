"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, Mail, Phone, ShieldCheck, Briefcase, 
  Globe, LogOut, Check, ArrowRight, ShieldAlert 
} from "lucide-react";
import { getCurrentUser, removeToken, User } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import PrototypeNoticeBanner from "@/components/PrototypeNoticeBanner";

export default function ProfilePage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.push("/login?redirect=/profile");
      return;
    }
    setUser(u);
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push("/");
  };

  if (!user) {
    return null;
  }

  const assignment = user.assignments?.[0];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === "hi" ? "उपयोगकर्ता प्रोफ़ाइल व प्राथमिकताएं" : "User Profile & Settings"}
            </h1>
            <p className="mt-1 text-slate-400 text-sm">
              {language === "hi" ? "व्यक्तिगत खाता विवरण व भाषा चयन" : "Account credentials, authority roles, and preferences"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-semibold border border-rose-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{language === "hi" ? "लॉग आउट" : "Sign Out"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <PrototypeNoticeBanner />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-2xl font-black">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">{user.full_name}</h2>
            <p className="text-xs text-slate-500">{user.email}</p>

            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  user.role === "PLATFORM_ADMIN"
                    ? "bg-purple-100 text-purple-800"
                    : user.role === "AUTHORITY_OFFICER"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {user.role === "PLATFORM_ADMIN"
                    ? "Platform Administrator"
                    : user.role === "AUTHORITY_OFFICER"
                    ? "Authority Officer"
                    : "Verified Citizen"}
                </span>
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
              {user.role === "AUTHORITY_OFFICER" && (
                <Link
                  href="/officer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>{language === "hi" ? "अधिकारी पोर्टल खोलें" : "Open Officer Workspace"}</span>
                </Link>
              )}
              {user.role === "PLATFORM_ADMIN" && (
                <Link
                  href="/admin"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === "hi" ? "प्रशासन पोर्टल खोलें" : "Open Admin Portal"}</span>
                </Link>
              )}
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <span>{language === "hi" ? "नागरिक डैशबोर्ड" : "Citizen Dashboard"}</span>
              </Link>
            </div>
          </div>

          {/* Details & Preferences */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-600" />
                <span>{language === "hi" ? "खाता विवरण" : "Personal Information"}</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{language === "hi" ? "पूरा नाम" : "Full Name"}</span>
                  <span className="text-slate-900 font-semibold">{user.full_name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{language === "hi" ? "ईमेल पता" : "Email Address"}</span>
                  <span className="text-slate-900 font-semibold">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{language === "hi" ? "मोबाइल नंबर" : "Phone Number"}</span>
                  <span className="text-slate-900 font-semibold">{user.phone_number || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 font-medium">{language === "hi" ? "उपयोगकर्ता भूमिका" : "System Role"}</span>
                  <span className="text-slate-900 font-semibold">{user.role}</span>
                </div>
              </div>
            </div>

            {/* Officer Assignment Details (if applicable) */}
            {user.role === "AUTHORITY_OFFICER" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>{language === "hi" ? "विभागीय अधिकार क्षेत्र आवंटन" : "Jurisdictional Authority Assignment"}</span>
                </h3>

                {assignment ? (
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">{language === "hi" ? "पदनाम" : "Designation"}</span>
                      <span className="text-emerald-700 font-bold">{assignment.designation}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">{language === "hi" ? "विभाग" : "Department"}</span>
                      <span className="text-slate-900 font-semibold">{assignment.department_name || "Public Works"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-500 font-medium">{language === "hi" ? "कार्यालय" : "Responsible Office"}</span>
                      <span className="text-slate-900 font-semibold">{assignment.office_name || "Zone Office"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No active office assignment found for this officer account.
                  </p>
                )}
              </div>
            )}

            {/* Language Preference */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>{language === "hi" ? "भाषा प्राथमिकता" : "Language Preference"}</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    language === "en"
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">English</div>
                  <div className="text-xs text-slate-500 mt-1">Default application language</div>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    language === "hi"
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">हिन्दी (Hindi)</div>
                  <div className="text-xs text-slate-500 mt-1">भारतीय नागरिकों के लिए अनुकूलित</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
