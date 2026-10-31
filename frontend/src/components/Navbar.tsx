"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { getCurrentUser, removeToken, api, AppNotification, User } from "@/lib/api";
import {
  ShieldAlert,
  Bell,
  Menu,
  X,
  Languages,
  LogOut,
  User as UserIcon,
  CheckCircle,
  FileText,
  MapPin,
  ClipboardList
} from "lucide-react";

export default function Navbar() {
  const { lang, setLang, t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      api.getNotifications()
        .then(setNotifications)
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    setUser(null);
    router.push("/login");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                JS
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-gray-900 block leading-tight">
                  {t("appName")}
                </span>
                <span className="text-[10px] text-gray-500 font-medium block">
                  Civic Resolution Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              {t("navHome")}
            </Link>

            {/* Citizen Links */}
            {(!user || user.role === "CITIZEN") && (
              <>
                <Link
                  href="/submit"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  {t("navReport")}
                </Link>
                {user && (
                  <Link
                    href="/complaints"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    {t("navMyComplaints")}
                  </Link>
                )}
              </>
            )}

            {/* Public Issues */}
            <Link
              href="/common-problems"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              {t("navPublicProblems")}
            </Link>

            {/* Officer Portal */}
            {user?.role === "AUTHORITY_OFFICER" && (
              <Link
                href="/officer"
                className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-semibold transition"
              >
                {t("navOfficerDashboard")}
              </Link>
            )}

            {/* Admin Portal */}
            {user?.role === "PLATFORM_ADMIN" && (
              <Link
                href="/admin"
                className="text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-md text-sm font-semibold transition"
              >
                {t("navAdminDashboard")}
              </Link>
            )}

            <Link
              href="/faq"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              {t("navFAQ")}
            </Link>
          </nav>

          {/* Right Action Icons: Language, Notifications, Auth */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Bilingual Switcher */}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              title="Toggle Language"
            >
              <Languages className="w-3.5 h-3.5 text-gray-500" />
              <span>{t("languageToggle")}</span>
            </button>

            {/* Notifications Dropdown (when logged in) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100 transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-blue-600 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-gray-500 py-4 text-center">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-2.5 hover:bg-gray-50 text-xs ${!n.is_read ? "bg-blue-50/50" : ""}`}
                          >
                            <div className="font-semibold text-gray-900">
                              {lang === "hi" && n.title_hi ? n.title_hi : n.title}
                            </div>
                            <div className="text-gray-600 mt-0.5">
                              {lang === "hi" && n.message_hi ? n.message_hi : n.message}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons / User Role Indicator */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/profile"
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-md transition"
                >
                  <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="hidden sm:inline font-semibold">{user.full_name}</span>
                  <span className="text-[10px] px-1 bg-white rounded border border-gray-300 uppercase">
                    {user.role === "AUTHORITY_OFFICER" ? "Officer" : user.role === "PLATFORM_ADMIN" ? "Admin" : "Citizen"}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-gray-700 hover:text-blue-600 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 transition"
                >
                  {t("navLogin")}
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-md shadow-sm transition"
                >
                  {t("navRegister")}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            {t("navHome")}
          </Link>
          {(!user || user.role === "CITIZEN") && (
            <>
              <Link
                href="/submit"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                {t("navReport")}
              </Link>
              {user && (
                <Link
                  href="/complaints"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  {t("navMyComplaints")}
                </Link>
              )}
            </>
          )}
          <Link
            href="/common-problems"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            {t("navPublicProblems")}
          </Link>
          {user?.role === "AUTHORITY_OFFICER" && (
            <Link
              href="/officer"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 bg-blue-50"
            >
              {t("navOfficerDashboard")}
            </Link>
          )}
          {user?.role === "PLATFORM_ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 bg-purple-50"
            >
              {t("navAdminDashboard")}
            </Link>
          )}
          <Link
            href="/faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            {t("navFAQ")}
          </Link>
        </div>
      )}
    </header>
  );
}
