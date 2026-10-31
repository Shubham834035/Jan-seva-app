const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: "CITIZEN" | "AUTHORITY_OFFICER" | "PLATFORM_ADMIN";
  preferred_language: string;
  assignments?: {
    id: string;
    department_id: string;
    department_name?: string;
    office_id: string;
    office_name?: string;
    designation: string;
  }[];
}

export interface ProblemCategory {
  id: string;
  code: string;
  name_en: string;
  name_hi: string;
  description?: string;
  icon: string;
  default_priority: string;
}

export interface GeographicArea {
  id: string;
  name: string;
  name_hi?: string;
  area_type: string;
  parent_id?: string;
  pincode?: string;
  center_latitude: number;
  center_longitude: number;
}

export interface TimelineEvent {
  id: string;
  actor_name: string;
  actor_role: string;
  old_status?: string;
  new_status: string;
  action_title: string;
  action_note?: string;
  is_external_confirmed: boolean;
  resolution_evidence_url?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  tracking_number: string;
  title: string;
  description: string;
  category_id: string;
  category?: ProblemCategory;
  geographic_area_id?: string;
  state: string;
  district: string;
  city: string;
  locality_landmark: string;
  latitude?: number;
  longitude?: number;
  status: string;
  priority: string;
  routing_status: string;
  routing_notes?: string;
  assigned_department_id?: string;
  assigned_department?: { name_en: string; name_hi: string };
  assigned_office_id?: string;
  assigned_office?: { name: string; name_hi?: string; contact_phone?: string };
  common_problem_id?: string;
  duplicate_review_status: string;
  duplicate_confidence?: number;
  duplicate_notes?: string;
  is_disputed: boolean;
  dispute_reason?: string;
  created_at: string;
  updated_at: string;
  attachments?: {
    id: string;
    file_path: string;
    original_filename: string;
    mime_type: string;
    attachment_type: string;
    uploaded_at: string;
  }[];
  timeline?: TimelineEvent[];
  common_problem?: CommonProblem;
}

export interface CommonProblem {
  id: string;
  title: string;
  description?: string;
  category_id: string;
  category?: ProblemCategory;
  geographic_area_id?: string;
  generalized_latitude: number;
  generalized_longitude: number;
  locality_name: string;
  status: string;
  report_count: number;
  first_reported_at: string;
  last_reported_at: string;
  resolved_at?: string;
  linked_reports?: {
    tracking_number: string;
    reported_at: string;
    status: string;
  }[];
}

export interface AppNotification {
  id: string;
  complaint_id?: string;
  title: string;
  title_hi?: string;
  message: string;
  message_hi?: string;
  is_read: boolean;
  created_at: string;
}

// Token Helpers
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jan_seva_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("jan_seva_token", token);
  }
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("jan_seva_token");
    localStorage.removeItem("jan_seva_user");
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("jan_seva_user");
  return userStr ? JSON.parse(userStr) : null;
}

export function setCurrentUser(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem("jan_seva_user", JSON.stringify(user));
  }
}

// Base Fetcher
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = "An error occurred";
    try {
      const errJson = await res.json();
      errorMsg = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorMsg = res.statusText || String(res.status);
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: any) => apiRequest<{ access_token: string; user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  login: (data: any) => apiRequest<{ access_token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getMe: () => apiRequest<User>("/auth/me"),

  // Complaints
  submitComplaint: (formData: FormData) => apiRequest<Complaint>("/complaints/", {
    method: "POST",
    body: formData,
  }),
  getMyComplaints: () => apiRequest<Complaint[]>("/complaints/my"),
  getComplaintDetails: (id: string) => apiRequest<Complaint>(`/complaints/${id}`),
  disputeComplaint: (id: string, dispute_reason: string) => apiRequest<Complaint>(`/complaints/${id}/dispute`, {
    method: "POST",
    body: JSON.stringify({ dispute_reason }),
  }),

  // Common Problems (Public)
  listCommonProblems: (params?: { category_id?: string; area_id?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiRequest<CommonProblem[]>(`/common-problems/?${q}`);
  },
  findNearbyCommonProblems: (lat: number, lon: number, radiusMeters = 2000) => {
    return apiRequest<CommonProblem[]>(`/common-problems/nearby?latitude=${lat}&longitude=${lon}&radius_meters=${radiusMeters}`);
  },
  getCommonProblemDetail: (id: string) => apiRequest<CommonProblem>(`/common-problems/${id}`),

  // Officer
  listAssignedComplaints: (status?: string, category_id?: string) => {
    const params = new URLSearchParams();
    if (status) params.append("status_filter", status);
    if (category_id) params.append("category_id", category_id);
    return apiRequest<Complaint[]>(`/officer/assigned?${params.toString()}`);
  },
  updateOfficerStatus: (complaintId: string, formData: FormData) => apiRequest<Complaint>(`/officer/${complaintId}/status`, {
    method: "POST",
    body: formData,
  }),

  // Admin
  getUncertainRoutingQueue: () => apiRequest<Complaint[]>("/admin/uncertain-routing"),
  reassignComplaint: (id: string, data: { department_id: string; office_id: string; reassignment_reason: string }) =>
    apiRequest<Complaint>(`/admin/complaints/${id}/reassign`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getDuplicateReviewQueue: () => apiRequest<Complaint[]>("/admin/duplicate-review"),
  resolveDuplicateReview: (id: string, data: { action: string; target_common_problem_id?: string; admin_notes?: string }) =>
    apiRequest<Complaint>(`/admin/complaints/${id}/duplicate-review`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listMappings: () => apiRequest<any[]>("/admin/mappings"),
  createMapping: (data: any) => apiRequest<any>("/admin/mappings", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getDepartments: () => apiRequest<{ id: string; name_en: string; name_hi: string; code: string }[]>("/admin/departments"),
  getOffices: (departmentId?: string) => {
    const q = departmentId ? `?department_id=${departmentId}` : "";
    return apiRequest<{ id: string; name: string; name_hi?: string; department_id: string; department_name?: string }[]>(`/admin/offices${q}`);
  },
  getAuditLogs: () => apiRequest<any[]>("/admin/audit-logs"),

  // Reference Data
  getCategories: () => apiRequest<ProblemCategory[]>("/categories/"),
  getAreas: () => apiRequest<GeographicArea[]>("/areas/"),
  getAnalyticsOverview: () => apiRequest<any>("/analytics/overview"),

  // Notifications
  getNotifications: () => apiRequest<AppNotification[]>("/notifications/"),
  markNotificationRead: (id: string) => apiRequest<AppNotification>(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => apiRequest<any>("/notifications/read-all", { method: "POST" }),
};
