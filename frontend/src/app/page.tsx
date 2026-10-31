"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { api, ProblemCategory } from "@/lib/api";
import {
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
  Users,
  Compass,
  Zap,
  Droplet,
  Trash2,
  Waves,
  Building
} from "lucide-react";

export default function LandingPage() {
  const { lang, t } = useI18n();
  const [categories, setCategories] = useState<ProblemCategory[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getAnalyticsOverview().then(setAnalytics).catch(() => {});
  }, []);

  const getCategoryIcon = (code: string) => {
    switch (code) {
      case "ROADS_POTHOLES": return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case "STREETLIGHTS": return <Zap className="w-6 h-6 text-yellow-600" />;
      case "WATER_SUPPLY": return <Droplet className="w-6 h-6 text-blue-600" />;
      case "DRAINAGE_SEWAGE": return <Waves className="w-6 h-6 text-cyan-600" />;
      case "GARBAGE_WASTE": return <Trash2 className="w-6 h-6 text-emerald-600" />;
      default: return <Building className="w-6 h-6 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/60 to-white pt-16 pb-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Independent Civic Technology Platform for India</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-950 tracking-tight max-w-4xl mx-auto leading-tight">
            {t("heroTitle")}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/submit"
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
            >
              <span>{t("btnReportNow")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/common-problems"
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-lg font-semibold text-sm shadow-sm transition flex items-center justify-center space-x-2"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{t("btnExploreMap")}</span>
            </Link>
          </div>

          {/* Quick Demo Accounts Banner */}
          <div className="pt-6">
            <div className="inline-block bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2.5 text-xs text-gray-600">
              <span className="font-semibold text-gray-900">Testing this Prototype?</span> Pre-configured test accounts for Citizens, PWD Officers & Admin available on the{" "}
              <Link href="/login" className="text-blue-600 font-semibold underline hover:text-blue-800">
                Login Page
              </Link>.
            </div>
          </div>
        </div>
      </section>

      {/* Live Civic Prototype Analytics Counter */}
      {analytics && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-center p-3 border-r border-gray-100 last:border-r-0">
              <div className="text-2xl sm:text-4xl font-extrabold text-blue-600">{analytics.total_complaints}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{t("totalSubmitted")}</div>
            </div>
            <div className="text-center p-3 border-r border-gray-100 last:border-r-0">
              <div className="text-2xl sm:text-4xl font-extrabold text-yellow-600">{analytics.under_review}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{t("underReview")}</div>
            </div>
            <div className="text-center p-3 border-r border-gray-100 last:border-r-0">
              <div className="text-2xl sm:text-4xl font-extrabold text-orange-600">{analytics.in_progress}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{t("inProgress")}</div>
            </div>
            <div className="text-center p-3">
              <div className="text-2xl sm:text-4xl font-extrabold text-emerald-600">{analytics.resolved}</div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{t("resolved")}</div>
            </div>
          </div>
        </section>
      )}

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t("howItWorksTitle")}
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            From mobile report submission to intelligent office assignment and verified resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
            <h3 className="font-bold text-gray-900 text-base">{t("step1Title")}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{t("step1Desc")}</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">2</div>
            <h3 className="font-bold text-gray-900 text-base">{t("step2Title")}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{t("step2Desc")}</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">3</div>
            <h3 className="font-bold text-gray-900 text-base">{t("step3Title")}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{t("step3Desc")}</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">4</div>
            <h3 className="font-bold text-gray-900 text-base">{t("step4Title")}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{t("step4Desc")}</p>
          </div>
        </div>
      </section>

      {/* Common Problem Grouping Feature Highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-8 sm:p-12 shadow-lg space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-800 text-blue-200 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Core Distinctive Feature: Smart Deduplication Without Data Loss</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Collective Civic Voice, Preserved Individual Audit
              </h3>
              <p className="text-sm text-blue-100 leading-relaxed">
                If 50 citizens report the same dangerous pothole on MG Road, typical portals discard duplicate entries or drown officers in 50 separate tickets.
              </p>
              <p className="text-sm text-blue-100 leading-relaxed">
                <strong>Jan Seva solves this:</strong> All 50 individual reports are securely preserved with their own citizen status and timeline. Simultaneously, our smart engine links them into a single <strong>Common Problem</strong>, giving authorities clear visibility into hotspot severity without losing any citizen&apos;s personal voice.
              </p>
              <div className="pt-2">
                <Link
                  href="/common-problems"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-xs font-bold transition"
                >
                  <span>Explore Common Problems Directory</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-slate-800/90 rounded-xl p-5 border border-slate-700 space-y-4 text-xs font-mono text-slate-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <span className="font-semibold text-white">Smart Deduplication Engine</span>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px]">Active Rule</span>
              </div>
              <div className="space-y-2">
                <p className="text-emerald-400">✓ Geospatial Haversine calculation (radius &le; 350m)</p>
                <p className="text-emerald-400">✓ Lexical keyword normalization &amp; Jaccard overlap</p>
                <p className="text-emerald-400">✓ Strict category check (roads stay roads, trash stays trash)</p>
                <p className="text-emerald-400">✓ Multi-factor confidence score &ge; 0.70 triggers automatic grouping</p>
                <p className="text-amber-300">! Medium confidence (0.40 - 0.70) routed to Admin Review</p>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 italic">
                * Public pages show generalized coordinates to guarantee citizen privacy.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Civic Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Supported Problem Categories
          </h2>
          <p className="text-sm text-gray-500">
            Initial focused release for municipal civic issues, extensible to public utilities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition space-y-3"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  {getCategoryIcon(cat.code)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">
                    {lang === "hi" && cat.name_hi ? cat.name_hi : cat.name_en}
                  </h4>
                  <span className="text-[11px] text-gray-400 block font-sans">
                    {lang === "hi" ? cat.name_en : cat.name_hi}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {cat.description}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">Priority: {cat.default_priority}</span>
                <Link
                  href={`/submit?category_id=${cat.id}`}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Report &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
