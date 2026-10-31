"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { 
  Users, MapPin, Calendar, Clock, ArrowLeft, ShieldCheck, 
  Layers, AlertTriangle, CheckCircle, ExternalLink, RefreshCw 
} from "lucide-react";
import { api, CommonProblem } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";
import PrototypeNoticeBanner from "@/components/PrototypeNoticeBanner";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">
      Loading Map...
    </div>
  ),
});

export default function CommonProblemDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { t, language } = useLanguage();
  const [problem, setProblem] = useState<CommonProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCommonProblemDetail(id);
      setProblem(data);
    } catch (err: any) {
      setError(err.message || "Failed to load common problem details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex justify-center items-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            {language === "hi" ? "विवरण लोड हो रहा है..." : "Loading civic hotspot details..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">
            {language === "hi" ? "समस्या नहीं मिली" : "Common Problem Not Found"}
          </h2>
          <p className="text-sm text-slate-500 mt-2">{error || "The requested issue could not be found."}</p>
          <div className="mt-6">
            <Link
              href="/common-problems"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === "hi" ? "सार्वजनिक समस्याओं पर लौटें" : "Back to Common Problems"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mapMarkers = [
    {
      id: problem.id,
      latitude: problem.generalized_latitude,
      longitude: problem.generalized_longitude,
      title: problem.title,
      description: `${problem.report_count} citizen reports aggregated here`,
      status: problem.status,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/common-problems"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === "hi" ? "सभी सार्वजनिक समस्याएं" : "Back to All Common Problems"}</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <span>{problem.category?.icon || "🏷️"}</span>
                  <span>
                    {language === "hi"
                      ? problem.category?.name_hi || "सामान्य"
                      : problem.category?.name_en || "General"}
                  </span>
                </span>
                <StatusBadge status={problem.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {problem.title}
              </h1>
              <p className="mt-2 text-slate-300 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{problem.locality_name || "Bhopal / Devgarh Area"}</span>
              </p>
            </div>

            {/* Aggregated Count Badge */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex items-center gap-4 shrink-0 shadow-inner">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-amber-400">{problem.report_count}</div>
                <div className="text-xs text-slate-400">
                  {language === "hi" ? "नागरिक शिकायतें जुड़ीं" : "Citizen Reports Linked"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <PrototypeNoticeBanner />

        {/* Privacy Notice Pill */}
        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <span className="font-semibold">
              {language === "hi" ? "गोपनीयता सुरक्षा गारंटी: " : "Citizen Privacy Guarantee: "}
            </span>
            {language === "hi"
              ? "यह सार्वजनिक पृष्ठ केवल समूहीकृत जानकारी प्रदर्शित करता है। व्यक्तिगत नागरिकों के नाम, संपर्क नंबर और सटीक आवासीय पते कभी भी सार्वजनिक रूप से प्रकट नहीं किए जाते हैं।"
              : "This public page displays aggregated hotspot data only. Individual citizens' names, contact numbers, and precise residence coordinates are strictly protected and never publicly exposed."}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                {language === "hi" ? "सार्वजनिक समस्या सारांश" : "Issue Overview"}
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {problem.description ||
                  (language === "hi"
                    ? "स्थानीय निवासियों द्वारा इस क्षेत्र में बुनियादी ढांचे की खराबी दर्ज की गई है।"
                    : "Civic infrastructure problem aggregated from multiple individual reports in this locality.")}
              </p>

              {/* Generalized Coordinates & Dates */}
              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">
                    {language === "hi" ? "प्रथम रिपोर्ट" : "First Reported"}
                  </span>
                  <span className="text-slate-800 font-semibold mt-0.5 block">
                    {new Date(problem.first_reported_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    {language === "hi" ? "अंतिम रिपोर्ट" : "Last Activity"}
                  </span>
                  <span className="text-slate-800 font-semibold mt-0.5 block">
                    {new Date(problem.last_reported_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">
                    {language === "hi" ? "सामान्यीकृत निर्देशांक" : "Approx. Coordinates"}
                  </span>
                  <span className="text-slate-800 font-mono text-[11px] mt-0.5 block">
                    {problem.generalized_latitude.toFixed(3)}, {problem.generalized_longitude.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Reports (Sanitized) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  {language === "hi" ? "जुड़ी हुई व्यक्तिगत रिपोर्टें" : "Linked Citizen Reports"}
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                    {problem.linked_reports?.length || problem.report_count}
                  </span>
                </h2>
                <span className="text-[11px] text-slate-400">
                  {language === "hi" ? "पहचान गोपनीय रखी गई" : "Identity Masked"}
                </span>
              </div>

              {problem.linked_reports && problem.linked_reports.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  {problem.linked_reports.map((lr, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex items-center justify-between text-xs bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-mono font-semibold text-slate-800">
                            {lr.tracking_number}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(lr.reported_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={lr.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  {language === "hi"
                    ? `${problem.report_count} रिपोर्टें इस हॉटस्पॉट से जुड़ी हुई हैं।`
                    : `${problem.report_count} reports linked to this common problem.`}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {language === "hi" ? "अनुमानित हॉटस्पॉट क्षेत्र" : "Hotspot Area"}
              </h3>
              <div className="h-56 rounded-lg overflow-hidden border border-slate-200">
                <LeafletMap
                  center={[problem.generalized_latitude, problem.generalized_longitude]}
                  zoom={15}
                  markers={mapMarkers}
                  interactive={false}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400 text-center">
                {language === "hi"
                  ? "सटीक घर का पता छिपाने के लिए निर्देशांक गोल किए गए हैं।"
                  : "Coordinates are generalized to protect individual residential privacy."}
              </p>
            </div>

            {/* CTA: Report Same Problem */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 shadow-sm text-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === "hi" ? "क्या आप भी इस समस्या से प्रभावित हैं?" : "Experiencing the Same Issue?"}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {language === "hi"
                  ? "अपनी शिकायत दर्ज करें। हमारा स्मार्ट सिस्टम स्वचालित रूप से इसे इस हॉटस्पॉट से जोड़ देगा।"
                  : "Submit your own report with photo evidence. Our smart grouping engine will link your complaint to this common problem."}
              </p>
              <div className="mt-4">
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  {language === "hi" ? "समान समस्या की रिपोर्ट करें" : "Report This Issue"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
