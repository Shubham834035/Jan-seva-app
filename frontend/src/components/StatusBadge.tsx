import React from "react";

interface StatusBadgeProps {
  status: string;
  isPrototype?: boolean;
}

export default function StatusBadge({ status, isPrototype = false }: StatusBadgeProps) {
  let colorStyles = "bg-gray-100 text-gray-800 border-gray-300";
  let label = status;

  switch (status) {
    case "SUBMITTED":
      colorStyles = "bg-blue-50 text-blue-700 border-blue-200";
      label = "Submitted";
      break;
    case "RECEIVED_BY_PLATFORM":
      colorStyles = "bg-indigo-50 text-indigo-700 border-indigo-200";
      label = "Received (Platform)";
      break;
    case "UNDER_REVIEW":
      colorStyles = "bg-yellow-50 text-yellow-800 border-yellow-200";
      label = "Under Review";
      break;
    case "ASSIGNED_PROTOTYPE":
      colorStyles = "bg-purple-50 text-purple-700 border-purple-200";
      label = "Assigned in Prototype";
      break;
    case "IN_PROGRESS":
      colorStyles = "bg-orange-50 text-orange-800 border-orange-200";
      label = "In Progress";
      break;
    case "RESOLVED":
      colorStyles = "bg-green-50 text-green-700 border-green-200";
      label = "Resolved";
      break;
    case "REJECTED":
      colorStyles = "bg-red-50 text-red-700 border-red-200";
      label = "Rejected";
      break;
    case "RETURNED_FOR_CLARIFICATION":
      colorStyles = "bg-amber-50 text-amber-800 border-amber-200";
      label = "Needs Clarification";
      break;
    case "IDENTIFIED":
      colorStyles = "bg-blue-50 text-blue-700 border-blue-200";
      label = "Identified";
      break;
    default:
      label = status.replace(/_/g, " ");
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyles}`}>
      {label}
    </span>
  );
}

export { StatusBadge };
