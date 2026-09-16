import type { ComponentType } from "react";
import { GraduationCap, Landmark } from "lucide-react";

/**
 * Frontend-only creation templates (US-2.2).
 * `positions` is a preview of what the backend seeds by default — it is NOT
 * sent to the API until `POST /organizations` accepts a `templateId`.
 */
export interface OrganizationTemplate {
  id: string;
  label: string;
  description: string;
  positions: string[];
  icon: ComponentType<{ className?: string }>;
}

export const ORGANIZATION_TEMPLATES: OrganizationTemplate[] = [
  {
    id: "student-org",
    label: "Student Organization",
    description: "For academic orgs, societies and interest clubs.",
    positions: ["President", "Vice President", "Secretary", "Treasurer", "Auditor", "Member"],
    icon: GraduationCap,
  },
  {
    id: "student-council",
    label: "Student Council",
    description: "For SSG/USG and college councils with representatives.",
    positions: [
      "Chairperson",
      "Vice Chairperson",
      "Secretary-General",
      "Finance Officer",
      "Auditor",
      "Representative",
    ],
    icon: Landmark,
  },
];

export const DEFAULT_ORGANIZATION_TEMPLATE_ID = ORGANIZATION_TEMPLATES[0].id;
