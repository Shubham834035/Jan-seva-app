"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  Users, MapPin, Calendar, Tag, AlertCircle, Search, 
  Filter, Layers, ArrowRight, ShieldCheck, RefreshCw 
} from "lucide-react";
import { api, CommonProblem, ProblemCategory } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";
import PrototypeNoticeBanner from "@/components/PrototypeNoticeBanner";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">
      Loading Hotspot Map...
    </div>
  ),
});

export default function CommonProblemsPage() {
  const { t, language } = useLanguage();
  const [problems, setProblems] = useState<CommonProblem[]>([]);
  const [categories, setCategories] = useState<ProblemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"map" | "grid" | "both">("both");
  const [selectedProblem, setSelectedProblem] = useState<CommonProblem | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, probs] = await Promise.all([
        api.getCategories().catch(() => []),
        api.listCommonProblems(selectedCategory ? { category_id: selectedCategory } : {}).catch(() => [])
      ]);
      setCategories(cats);
      setProblems(probs);
    } catch (err) {
      console.error("Failed to load common problems", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.locality_name && p.locality_name.toLowerCase().includes(q)) ||
      (p.category && p.category.name_en.toLowerCase().includes(q))
    );
  });

  const mapMarkers = filteredProblems
    .filter((p) => p.generalized_latitude && p.generalized_longitude)
    .map((p) => ({
      id: p.id,
      latitude: p.generalized_latitude,
      longitude: p.generalized_longitude,
      title: p.title,
      description: `${p.report_count} ${language === "hi" ? "नागरिक रिपोर्ट" : "citizen reports"} • ${p.locality_name || "General Area"}`,
      status: p.status,
    }));

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
                <Users className="w-3.5 h-3.5" />
                <span>{language === "hi" ? "सामूहिक समस्या समूह" : "Citizen Hotspot Aggregation"}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {language === "hi" ? "सार्वजनिक सामान्य समस्याएं" : "Common Civic Problems"}
              </h1>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
                {language === "hi"
                  ? "जब कई नागरिक एक ही क्षेत्र में समान समस्या की रिपोर्ट करते हैं, तो मंच व्यक्तिगत गोपनीयता बनाए रखते हुए उन्हें एक सामान्य हॉटस्पॉट में समूहीकृत करता है।"
                  : "When multiple citizens report the same issue in a locality, Jan Seva groups them into a public hotspot while strictly preserving individual complaint records and citizen privacy."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors"
              >
                {language === "hi" ? "नई समस्या रिपोर्ट करें" : "Report a Problem"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <PrototypeNoticeBanner />

        {/* Search & Filters */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === "hi" ? "समस्या का नाम या मोहल्ला खोजें..." : "Search problems, locality, or landmark..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start md:self-auto">
              <button
                onClick={() => setViewMode("both")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === "both" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "hi" ? "मानचित्र + सूची" : "Map + List"}
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === "map" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "hi" ? "मानचित्र" : "Map Only"}
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "hi" ? "सूची" : "List Only"}
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              {language === "hi" ? "श्रेणी:" : "Category:"}
            </span>
            <button
              onClick={() => setSelectedCategory("")}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${
                selectedCategory === ""
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {language === "hi" ? "सभी श्रेणियां" : "All Categories"} ({problems.length})
            </button>
            {categories.map((cat) => {
              const count = problems.filter((p) => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors font-medium flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{language === "hi" ? cat.name_hi : cat.name_en}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="mt-8 text-center py-16 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {language === "hi" ? "सार्वजनिक समस्याएं लोड हो रही हैं..." : "Loading public civic hotspots..."}
            </p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="mt-8 text-center py-16 bg-white rounded-xl border border-slate-200 px-4">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {language === "hi" ? "कोई सार्वजनिक समस्या नहीं मिली" : "No common problems found"}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery || selectedCategory
                ? language === "hi"
                  ? "चयनित फ़िल्टर के लिए कोई परिणाम नहीं मिला। कृपया अन्य फ़िल्टर आज़माएं।"
                  : "No matches found for your current search or category filter."
                : language === "hi"
                ? "वर्तमान में इस क्षेत्र में कोई सामूहिक समस्या दर्ज नहीं है।"
                : "No clustered civic problems have been identified in this area yet."}
            </p>
            <div className="mt-5">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                {language === "hi" ? "पहली शिकायत दर्ज करें" : "Submit First Complaint"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Interactive Map */}
            {(viewMode === "map" || viewMode === "both") && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      {language === "hi" ? "सार्वजनिक समस्या हॉटस्पॉट मानचित्र" : "Civic Hotspot Map"}
                    </h2>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {mapMarkers.length} {language === "hi" ? "हॉटस्पॉट" : "hotspots"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === "hi" ? "गोपनीयता सुरक्षित (सामान्यीकृत स्थान)" : "Privacy Protected (Generalized Coordinates)"}</span>
                  </div>
                </div>

                <div className="h-[380px] rounded-lg overflow-hidden border border-slate-200">
                  <LeafletMap
                    center={[23.2599, 77.4126]} // Devgarh / MP central coordinates
                    zoom={13}
                    markers={mapMarkers}
                    interactive={false}
                    onMarkerClick={(id) => {
                      const match = problems.find((p) => p.id === id);
                      if (match) setSelectedProblem(match);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Problem Cards Grid */}
            {(viewMode === "grid" || viewMode === "both") && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    {language === "hi" ? "सक्रिय सार्वजनिक मुद्दे" : "Active Public Hotspots"}
                    <span className="text-xs font-normal text-slate-500">
                      ({filteredProblems.length} {language === "hi" ? "समस्याएं" : "issues"})
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProblems.map((prob) => (
                    <Link
                      key={prob.id}
                      href={`/common-problems/${prob.id}`}
                      className="group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Category & Status */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-colors">
                            <span>{prob.category?.icon || "🏷️"}</span>
                            <span>
                              {language === "hi"
                                ? prob.category?.name_hi || "सामान्य"
                                : prob.category?.name_en || "General"}
                            </span>
                          </span>
                          <StatusBadge status={prob.status} />
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {prob.title}
                        </h3>

                        {/* Locality */}
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prob.locality_name || "Bhopal / Devgarh Area"}</span>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        {/* Report Count Pill */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {prob.report_count} {language === "hi" ? "नागरिक रिपोर्ट" : "Citizen Reports"}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(prob.first_reported_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
