"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, AlertTriangle, GitFork, MapPin, Building2, 
  Settings, BarChart3, History, Check, X, RefreshCw, 
  ArrowRight, Search, Plus, Layers, UserCheck, CheckCircle2 
} from "lucide-react";
import { 
  api, Complaint, CommonProblem, ProblemCategory, 
  GeographicArea, getCurrentUser, User 
} from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";
import PrototypeNoticeBanner from "@/components/PrototypeNoticeBanner";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"uncertain" | "duplicates" | "mappings" | "audit">("uncertain");

  // Queues & Data
  const [uncertainQueue, setUncertainQueue] = useState<Complaint[]>([]);
  const [duplicateQueue, setDuplicateQueue] = useState<Complaint[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Reference Data for Dropdowns
  const [categories, setCategories] = useState<ProblemCategory[]>([]);
  const [areas, setAreas] = useState<GeographicArea[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [commonProblems, setCommonProblems] = useState<CommonProblem[]>([]);

  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  // 1. Reassign Modal
  const [reassignTarget, setReassignTarget] = useState<Complaint | null>(null);
  const [reassignDept, setReassignDept] = useState<string>("");
  const [reassignOffice, setReassignOffice] = useState<string>("");
  const [reassignReason, setReassignReason] = useState<string>("");
  const [reassigning, setReassigning] = useState<boolean>(false);

  // 2. Duplicate Review Modal
  const [duplicateTarget, setDuplicateTarget] = useState<Complaint | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<"link_to_common" | "create_new">("link_to_common");
  const [duplicateTargetCpId, setDuplicateTargetCpId] = useState<string>("");
  const [duplicateNotes, setDuplicateNotes] = useState<string>("");
  const [resolvingDup, setResolvingDup] = useState<boolean>(false);

  // 3. New Mapping Modal
  const [showMappingModal, setShowMappingModal] = useState<boolean>(false);
  const [newMapCategory, setNewMapCategory] = useState<string>("");
  const [newMapArea, setNewMapArea] = useState<string>("");
  const [newMapDept, setNewMapDept] = useState<string>("");
  const [newMapOffice, setNewMapOffice] = useState<string>("");
  const [newMapNotes, setNewMapNotes] = useState<string>("");
  const [savingMapping, setSavingMapping] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login?redirect=/admin");
      return;
    }
    if (user.role !== "PLATFORM_ADMIN") {
      router.push("/dashboard");
      return;
    }
    setCurrentUser(user);
    loadAllAdminData();
  }, []);

  // Filter offices when selected department changes
  const filteredOffices = offices.filter((o) => !reassignDept || o.department_id === reassignDept);
  const filteredNewMapOffices = offices.filter((o) => !newMapDept || o.department_id === newMapDept);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [uQ, dQ, maps, logs, cats, ars, depts, offs, cps, stats] = await Promise.all([
        api.getUncertainRoutingQueue().catch(() => []),
        api.getDuplicateReviewQueue().catch(() => []),
        api.listMappings().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getCategories().catch(() => []),
        api.getAreas().catch(() => []),
        api.getDepartments().catch(() => []),
        api.getOffices().catch(() => []),
        api.listCommonProblems().catch(() => []),
        api.getAnalyticsOverview().catch(() => null),
      ]);

      setUncertainQueue(uQ);
      setDuplicateQueue(dQ);
      setMappings(maps);
      setAuditLogs(logs);
      setCategories(cats);
      setAreas(ars);
      setDepartments(depts);
      setOffices(offs);
      setCommonProblems(cps);
      setAnalytics(stats);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTarget || !reassignDept || !reassignOffice || !reassignReason.trim()) {
      setErrorMessage("Please complete all required fields for reassignment.");
      return;
    }
    setReassigning(true);
    setErrorMessage(null);
    try {
      await api.reassignComplaint(reassignTarget.id, {
        department_id: reassignDept,
        office_id: reassignOffice,
        reassignment_reason: reassignReason.trim(),
      });
      setSuccessMessage(`Complaint #${reassignTarget.tracking_number} successfully routed!`);
      setReassignTarget(null);
      setReassignDept("");
      setReassignOffice("");
      setReassignReason("");
      loadAllAdminData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reassign complaint.");
    } finally {
      setReassigning(false);
    }
  };

  const handleDuplicateReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateTarget) return;
    if (duplicateAction === "link_to_common" && !duplicateTargetCpId) {
      setErrorMessage("Please select a target Common Problem to link to.");
      return;
    }
    setResolvingDup(true);
    setErrorMessage(null);
    try {
      await api.resolveDuplicateReview(duplicateTarget.id, {
        action: duplicateAction,
        target_common_problem_id: duplicateAction === "link_to_common" ? duplicateTargetCpId : undefined,
        admin_notes: duplicateNotes.trim() || undefined,
      });
      setSuccessMessage(`Duplicate candidate for #${duplicateTarget.tracking_number} resolved!`);
      setDuplicateTarget(null);
      setDuplicateNotes("");
      setDuplicateTargetCpId("");
      loadAllAdminData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to resolve duplicate candidate.");
    } finally {
      setResolvingDup(false);
    }
  };

  const handleCreateMappingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapCategory || !newMapArea || !newMapDept || !newMapOffice) {
      setErrorMessage("All dropdown selections are required to create an authority rule.");
      return;
    }
    setSavingMapping(true);
    setErrorMessage(null);
    try {
      await api.createMapping({
        category_id: newMapCategory,
        geographic_area_id: newMapArea,
        department_id: newMapDept,
        office_id: newMapOffice,
        notes: newMapNotes.trim() || undefined,
      });
      setSuccessMessage("New authority jurisdictional mapping created successfully!");
      setShowMappingModal(false);
      setNewMapCategory("");
      setNewMapArea("");
      setNewMapDept("");
      setNewMapOffice("");
      setNewMapNotes("");
      loadAllAdminData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create authority mapping.");
    } finally {
      setSavingMapping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Platform Governance & Administration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {language === "hi" ? "प्रशासन व रूटिंग नियंत्रण कक्ष" : "Platform Administrator Portal"}
              </h1>
              <p className="mt-1 text-slate-400 text-sm">
                Signed in as <span className="text-white font-medium">{currentUser?.full_name}</span> ({currentUser?.email})
              </p>
            </div>

            <button
              onClick={loadAllAdminData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-600 transition-colors self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Control Queues</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Uncertain Routing Queue</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{uncertainQueue.length}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Duplicate Review Queue</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{duplicateQueue.length}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Configured Mappings</div>
              <div className="text-2xl font-black text-blue-400 mt-1">{mappings.length}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Audit Events Logged</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{auditLogs.length}</div>
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

        {errorMessage && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-900 text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-slate-200">
          <nav className="flex space-x-6 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab("uncertain")}
              className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeTab === "uncertain"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Uncertain Routing Queue</span>
              {uncertainQueue.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  {uncertainQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("duplicates")}
              className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeTab === "duplicates"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>Duplicate Review Queue</span>
              {duplicateQueue.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {duplicateQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("mappings")}
              className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeTab === "mappings"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Authority Mappings</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                {mappings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeTab === "audit"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail & Analytics</span>
            </button>
          </nav>
        </div>

        {/* Tab 1: Uncertain Routing Queue */}
        {activeTab === "uncertain" && (
          <div className="mt-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Automated Routing Ambiguity:</span> When a citizen reports a problem in an unmapped ward or where departmental jurisdiction cannot be automatically established with high confidence, it enters this review queue. An administrator selects the appropriate department and office.
            </div>

            {uncertainQueue.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Uncertain Routing Queue is Empty</h3>
                <p className="text-xs text-slate-500 mt-1">All complaints have been successfully mapped to responsible authorities.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Tracking ID</th>
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Locality / Coordinates</th>
                      <th className="py-3 px-4">Submitted At</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {uncertainQueue.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80">
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
                            <span>{c.category?.name_en || "General"}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <div>{c.locality_landmark}</div>
                          {c.latitude && c.longitude && (
                            <div className="text-[10px] font-mono text-slate-400">
                              {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setReassignTarget(c);
                              setReassignDept("");
                              setReassignOffice("");
                              setReassignReason("");
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs transition-colors"
                          >
                            Assign Authority
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Duplicate Review Queue */}
        {activeTab === "duplicates" && (
          <div className="mt-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">Near-Duplicate Heuristics:</span> Complaints with a multi-factor similarity score between 0.40 and 0.69 are sent here for human-in-the-loop review. You can either confirm linking to an existing Common Problem hotspot (preserving the citizen's individual record) or declare it as a distinct separate problem.
            </div>

            {duplicateQueue.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">Duplicate Review Queue is Clear</h3>
                <p className="text-xs text-slate-500 mt-1">No complaints currently require grouping disambiguation.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Tracking ID</th>
                      <th className="py-3 px-4">Problem Subject</th>
                      <th className="py-3 px-4">Locality</th>
                      <th className="py-3 px-4">Confidence Score</th>
                      <th className="py-3 px-4">System Notes</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {duplicateQueue.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                          <Link href={`/complaints/${c.id}`} className="hover:underline">
                            {c.tracking_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                          {c.title}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{c.locality_landmark}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {c.duplicate_confidence ? `${Math.round(c.duplicate_confidence * 100)}%` : "Moderate"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                          {c.duplicate_notes || "Multi-factor similarity flag"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setDuplicateTarget(c);
                              setDuplicateAction("link_to_common");
                              setDuplicateTargetCpId(c.common_problem_id || (commonProblems[0]?.id ?? ""));
                              setDuplicateNotes("");
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs transition-colors"
                          >
                            Resolve Duplicate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Authority Mappings Manager */}
        {activeTab === "mappings" && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Configured Authority Routing Rules</h2>
                <p className="text-xs text-slate-500">Maps (Category + Ward / Area) to (Department + Responsible Office).</p>
              </div>
              <button
                onClick={() => setShowMappingModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Routing Rule</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Geographic Area</th>
                    <th className="py-3 px-4">Assigned Department</th>
                    <th className="py-3 px-4">Responsible Office</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {m.category_name || "All Categories"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{m.geographic_area_name || "General Area"}</td>
                      <td className="py-3.5 px-4 font-medium text-blue-700">{m.department_name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{m.office_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">{m.notes || "Standard Rule"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Trail & Analytics */}
        {activeTab === "audit" && (
          <div className="mt-6 space-y-6">
            {/* Analytics Cards */}
            {analytics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total Complaints Logged</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{analytics.total_complaints}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Resolved Complaints</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{analytics.resolved_complaints}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Platform Resolution Rate</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">{analytics.resolution_rate_percent}%</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Common Hotspots</div>
                  <div className="text-2xl font-black text-purple-600 mt-1">{analytics.total_common_problems}</div>
                </div>
              </div>
            )}

            {/* Audit Trail Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" />
                    Immutable Administrative Audit Log
                  </h3>
                  <p className="text-xs text-slate-500">Every privileged routing, reassignment, and duplicate action is recorded permanently.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {log.entity_type} #{log.entity_id?.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{log.admin_name}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] font-mono max-w-sm truncate">
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: REASSIGN AUTHORITY */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Manually Assign Department & Office</h3>
              </div>
              <button onClick={() => setReassignTarget(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Complaint:</span> #{reassignTarget.tracking_number} - {reassignTarget.title}
              <div className="mt-1 text-slate-400">Locality: {reassignTarget.locality_landmark}</div>
            </div>

            <form onSubmit={handleReassignSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Department *</label>
                <select
                  value={reassignDept}
                  onChange={(e) => {
                    setReassignDept(e.target.value);
                    setReassignOffice("");
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name_en} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsible Office *</label>
                <select
                  value={reassignOffice}
                  onChange={(e) => setReassignOffice(e.target.value)}
                  disabled={!reassignDept}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  required
                >
                  <option value="">-- Choose Office --</option>
                  {filteredOffices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reassignment Reason / Justification *</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Road belongs to PWD Municipal Zone 1 based on local ward boundary map."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignTarget(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassigning}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  {reassigning && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESOLVE DUPLICATE REVIEW */}
      {duplicateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Resolve Duplicate Grouping Candidate</h3>
              </div>
              <button onClick={() => setDuplicateTarget(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Complaint:</span> #{duplicateTarget.tracking_number} - {duplicateTarget.title}
              <div className="mt-1 text-slate-400">{duplicateTarget.locality_landmark}</div>
            </div>

            <form onSubmit={handleDuplicateReviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grouping Decision *</label>
                <div className="space-y-2 mt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      value="link_to_common"
                      checked={duplicateAction === "link_to_common"}
                      onChange={() => setDuplicateAction("link_to_common")}
                      className="text-indigo-600"
                    />
                    <span>Link to existing Common Problem (Preserves individual complaint record)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      value="create_new"
                      checked={duplicateAction === "create_new"}
                      onChange={() => setDuplicateAction("create_new")}
                      className="text-indigo-600"
                    />
                    <span>Keep separate as a distinct Common Problem</span>
                  </label>
                </div>
              </div>

              {duplicateAction === "link_to_common" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Common Problem *</label>
                  <select
                    value={duplicateTargetCpId}
                    onChange={(e) => setDuplicateTargetCpId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Select Common Problem --</option>
                    {commonProblems.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.title} ({cp.locality_name || "General Area"}) - {cp.report_count} reports
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Notes / Rationale</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Verified that both reports refer to the same pothole cluster on Main Road."
                  value={duplicateNotes}
                  onChange={(e) => setDuplicateNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDuplicateTarget(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolvingDup}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  {resolvingDup && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE NEW AUTHORITY MAPPING */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Configure Jurisdictional Routing Rule</h3>
              </div>
              <button onClick={() => setShowMappingModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMappingSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Problem Category *</label>
                <select
                  value={newMapCategory}
                  onChange={(e) => setNewMapCategory(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_en} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Geographic Area / Ward *</label>
                <select
                  value={newMapArea}
                  onChange={(e) => setNewMapArea(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Geographic Area --</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.area_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                <select
                  value={newMapDept}
                  onChange={(e) => {
                    setNewMapDept(e.target.value);
                    setNewMapOffice("");
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name_en} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsible Office *</label>
                <select
                  value={newMapOffice}
                  onChange={(e) => setNewMapOffice(e.target.value)}
                  disabled={!newMapDept}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  required
                >
                  <option value="">-- Choose Office --</option>
                  {filteredNewMapOffices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Configuration Notes</label>
                <input
                  type="text"
                  placeholder="e.g., Official Municipal Corporation 2026 ward jurisdictional allocation"
                  value={newMapNotes}
                  onChange={(e) => setNewMapNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMappingModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMapping}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  {savingMapping && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Routing Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
