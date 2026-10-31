"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building2, Briefcase, CheckCircle2, Clock, AlertCircle, 
  Search, Filter, ArrowUpRight, Camera, X, RefreshCw, 
  FileText, ShieldAlert, Check, HelpCircle 
} from "lucide-react";
import { api, Complaint, ProblemCategory, getCurrentUser, User } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";
import PrototypeNoticeBanner from "@/components/PrototypeNoticeBanner";

export default function OfficerDashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<ProblemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State for Status Update
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>("IN_PROGRESS");
  const [updateNotes, setUpdateNotes] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login?redirect=/officer");
      return;
    }
    if (user.role !== "AUTHORITY_OFFICER" && user.role !== "PLATFORM_ADMIN") {
      router.push("/dashboard");
      return;
    }
    setCurrentUser(user);
    loadData();
  }, [selectedStatus, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [complaintsData, cats] = await Promise.all([
        api.listAssignedComplaints(
          selectedStatus || undefined,
          selectedCategory || undefined
        ),
        api.getCategories().catch(() => [])
      ]);
      setComplaints(complaintsData);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load officer complaints", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setUpdateStatus("IN_PROGRESS");
    setUpdateNotes("");
    setProofFile(null);
    setModalError(null);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!updateNotes.trim()) {
      setModalError(
        language === "hi"
          ? "कृपया स्थिति अद्यतन के लिए कार्रवाई विवरण दर्ज करें।"
          : "Please enter action notes explaining the status change."
      );
      return;
    }

    setUpdating(true);
    setModalError(null);

    try {
      const formData = new FormData();
      formData.append("status", updateStatus);
      formData.append("action_notes", updateNotes.trim());
      if (proofFile) {
        formData.append("evidence_file", proofFile);
      }

      await api.updateOfficerStatus(selectedComplaint.id, formData);
      setSuccessMessage(
        language === "hi"
          ? `शिकायत #${selectedComplaint.tracking_number} की स्थिति सफलतापूर्वक अपडेट की गई!`
          : `Status for Complaint #${selectedComplaint.tracking_number} updated successfully!`
      );
      setSelectedComplaint(null);
      loadData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setModalError(err.message || "Failed to update complaint status.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.tracking_number.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.locality_landmark.toLowerCase().includes(q)
    );
  });

  const assignment = currentUser?.assignments?.[0];

  // Metrics
  const totalAssigned = complaints.length;
  const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;
  const pendingReviewCount = complaints.filter(
    (c) => c.status === "ASSIGNED_PROTOTYPE" || c.status === "UNDER_REVIEW"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Officer Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-3">
                <Briefcase className="w-3.5 h-3.5" />
                <span>
                  {language === "hi" ? "प्राधिकृत अधिकारी पोर्टल" : "Authorized Officer Workspace"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {language === "hi" ? "विभागीय शिकायत प्रबंधन" : "Assigned Complaints Queue"}
              </h1>
              <p className="mt-1 text-slate-300 text-sm">
                {currentUser?.full_name} •{" "}
                <span className="text-emerald-300 font-semibold">
                  {assignment?.designation || "Officer"}
                </span>{" "}
                (
                {assignment?.department_name || "Department of Public Works"} -{" "}
                {assignment?.office_name || "Zonal Office"}
                )
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-600 transition-colors self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{language === "hi" ? "रिफ्रेश करें" : "Refresh Queue"}</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">
                {language === "hi" ? "कुल सौंपी गई" : "Total Assigned"}
              </div>
              <div className="text-2xl font-black text-white mt-1">{totalAssigned}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">
                {language === "hi" ? "लंबित समीक्षा" : "Pending Review"}
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">{pendingReviewCount}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">
                {language === "hi" ? "कार्य प्रगति पर" : "In Progress"}
              </div>
              <div className="text-2xl font-black text-blue-400 mt-1">{inProgressCount}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">
                {language === "hi" ? "हल की गई" : "Resolved"}
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{resolvedCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <PrototypeNoticeBanner />

        {successMessage && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-sm">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  language === "hi"
                    ? "ट्रैकिंग नंबर, शीर्षक या मोहल्ले से खोजें..."
                    : "Search by tracking number, title, locality..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === "hi" ? "सभी स्थितियां" : "All Statuses"}</option>
                <option value="ASSIGNED_PROTOTYPE">
                  {language === "hi" ? "प्रोटोटाइप सौंपा गया" : "Assigned (Prototype)"}
                </option>
                <option value="IN_PROGRESS">
                  {language === "hi" ? "प्रगति पर" : "In Progress"}
                </option>
                <option value="RESOLVED">{language === "hi" ? "हल की गई" : "Resolved"}</option>
                <option value="RETURNED_FOR_CLARIFICATION">
                  {language === "hi" ? "स्पष्टीकरण आवश्यक" : "Returned for Clarification"}
                </option>
                <option value="REJECTED">{language === "hi" ? "अस्वीकृत" : "Rejected"}</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === "hi" ? "सभी श्रेणियां" : "All Categories"}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {language === "hi" ? c.name_hi : c.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                {language === "hi" ? "शिकायतें लोड हो रही हैं..." : "Loading assigned complaints..."}
              </p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="py-16 text-center px-4">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">
                {language === "hi"
                  ? "कोई लंबित शिकायत नहीं मिली"
                  : "No complaints found in this view"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === "hi"
                  ? "आपके अधिकार क्षेत्र के लिए कोई शिकायत मेल नहीं खाती।"
                  : "All complaints assigned to your office have been addressed or match other filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">
                      {language === "hi" ? "ट्रैकिंग नंबर" : "Tracking ID"}
                    </th>
                    <th className="py-3 px-4">{language === "hi" ? "समस्या" : "Issue / Subject"}</th>
                    <th className="py-3 px-4">{language === "hi" ? "श्रेणी" : "Category"}</th>
                    <th className="py-3 px-4">{language === "hi" ? "स्थान" : "Locality"}</th>
                    <th className="py-3 px-4">{language === "hi" ? "प्राथमिकता" : "Priority"}</th>
                    <th className="py-3 px-4">{language === "hi" ? "स्थिति" : "Status"}</th>
                    <th className="py-3 px-4 text-right">
                      {language === "hi" ? "कार्रवाई" : "Action"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                        <Link href={`/complaints/${c.id}`} className="hover:underline">
                          {c.tracking_number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                        {c.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          <span>{c.category?.icon || "🏷️"}</span>
                          <span>
                            {language === "hi"
                              ? c.category?.name_hi || "सामान्य"
                              : c.category?.name_en || "General"}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[150px] truncate text-slate-500">
                        {c.locality_landmark}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.priority === "URGENT"
                              ? "bg-rose-100 text-rose-700"
                              : c.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(c)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs transition-colors"
                        >
                          {language === "hi" ? "अद्यतन करें" : "Update"}
                        </button>
                        <Link
                          href={`/complaints/${c.id}`}
                          className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-medium text-xs transition-colors inline-block"
                        >
                          {language === "hi" ? "देखें" : "View"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {language === "hi" ? "कार्रवाई व स्थिति अद्यतन" : "Log Action & Update Status"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {selectedComplaint.tracking_number}:
              </span>{" "}
              {selectedComplaint.title}
            </div>

            {modalError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === "hi" ? "नई स्थिति चुनें *" : "Select New Status *"}
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="IN_PROGRESS">
                    {language === "hi" ? "प्रगति पर (In Progress)" : "In Progress"}
                  </option>
                  <option value="RESOLVED">
                    {language === "hi" ? "हल की गई (Resolved)" : "Resolved"}
                  </option>
                  <option value="RETURNED_FOR_CLARIFICATION">
                    {language === "hi"
                      ? "नागरिक से स्पष्टीकरण आवश्यक (Return for Clarification)"
                      : "Return for Clarification"}
                  </option>
                  <option value="REJECTED">
                    {language === "hi" ? "अस्वीकृत (Rejected)" : "Rejected"}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === "hi"
                    ? "कार्रवाई विवरण / स्पष्टीकरण (नागरिक को दिखाई देगा) *"
                    : "Action Notes / Explanation (Visible to Citizen) *"}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    language === "hi"
                      ? "उदाहरण: निरीक्षण दल भेजा गया है। मरम्मत कार्य 2 दिनों में पूरा होगा।"
                      : "e.g., Road repair team dispatched with cold mix asphalt. Expected completion in 48 hours."
                  }
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === "hi"
                    ? "समाधान प्रमाण फोटो (वैकल्पिक)"
                    : "Resolution Proof Photo (Optional)"}
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>
                      {proofFile
                        ? proofFile.name
                        : language === "hi"
                        ? "फोटो चुनें..."
                        : "Upload photo..."}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProofFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {proofFile && (
                    <button
                      type="button"
                      onClick={() => setProofFile(null)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      {language === "hi" ? "हटाएं" : "Remove"}
                    </button>
                  )}
                </div>
              </div>

              {/* Prototype Disclaimer */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {language === "hi"
                    ? "यह एक प्रोटोटाइप क्रिया है जो सिमुलेशन टाइमलाइन में एक नया अपरिवर्तनीय इतिहास जोड़ती है।"
                    : "This update will be recorded in the citizen's immutable timeline. External government verification is labelled honestly."}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {language === "hi" ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  {updating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === "hi" ? "अद्यतन सहेजें" : "Save Status"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
