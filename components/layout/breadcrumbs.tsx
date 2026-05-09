"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  crm: "CRM",
  leads: "Leads",
  opportunities: "Opportunities",
  pipeline: "Pipeline",
  activities: "Activities",
  hr: "HR Management",
  attendance: "Attendance",
  employees: "Employees",
  leave: "Leave",
  payroll: "Payroll",
  "master-data": "Master Data",
  entity: "Entity",
  organization: "Organization",
  department: "Department",
  division: "Division",
  position: "Job Title",
  grade: "Grade",
  finance: "Finance",
  expenses: "Expenses",
  invoices: "Invoices",
  bopp: "BOPP",
  calculator: "Calculator",
  projects: "Projects",
  tasks: "Tasks",
  kanban: "Kanban",
  time: "Time Tracking",
  reports: "Reports",
  performance: "Performance",
  "360-feedback": "360 Feedback",
  "360": "360 Assessment",
  template: "Template penilaian",
  dashboard: "Dashboard",
  "mapping-penilaian": "Mapping Penilaian",
  konfigurasi: "Konfigurasi",
  settings: "Settings",
  new: "New",
  edit: "Edit",
  generate: "Generate",
  login: "Login",
  // Payroll module
  compensation: "Kompensasi Karyawan",
  processing: "Proses Penggajian",
  approval: "Persetujuan Payroll",
  slips: "Slip Gaji & Pembayaran",
  tax: "Pajak & Potongan",
  analytics: "Analitik Payroll",
};

function isIdentifier(segment: string): boolean {
  return /^[0-9]+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment);
}

function toLabel(segment: string): string {
  if (isIdentifier(segment)) return "Detail";
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const rawSegments = pathname.split("/").filter(Boolean);

  if (rawSegments.length === 0) return null;

  const items = [{ href: "/", label: "Dashboard" }];
  let hrefBuilder = "";

  for (const segment of rawSegments) {
    hrefBuilder += `/${segment}`;
    items.push({ href: hrefBuilder, label: toLabel(segment) });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {isLast ? (
                <span className="font-medium text-slate-300">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-slate-300 transition-colors">
                  {item.label}
                </Link>
              )}
              {!isLast && <span className="text-slate-600">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
