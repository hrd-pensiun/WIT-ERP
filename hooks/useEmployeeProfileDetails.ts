"use client"

import { useCallback } from "react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

type FamilyMember = {
  name: string
  relation: string
  phone: string
  birth_date: string | null
  dependent_for_tax: boolean
  notes: string | null
}

type EducationHistory = {
  level: string
  institution: string
  major: string
  start_year: number | null
  end_year: number | null
  gpa: number | null
  notes: string | null
}

type InformalEducation = {
  name: string
  provider: string
  year: number | null
  certificate: string
  notes: string | null
}

type OrganizationExperience = {
  organization: string
  role: string
  start_year: number | null
  end_year: number | null
  notes: string | null
}

type WorkHistory = {
  company: string
  position: string
  start_date: string | null
  end_date: string | null
  reason_for_leaving: string | null
  notes: string | null
}

type PortfolioItem = {
  title: string
  role: string
  year: number | null
  url: string
  description: string | null
}

type EmployeeProfileDetailsPayload = {
  familyMembers: FamilyMember[]
  educationHistories: EducationHistory[]
  informalEducations: InformalEducation[]
  organizationExperiences: OrganizationExperience[]
  workHistories: WorkHistory[]
  portfolioItems: PortfolioItem[]
}

export function useEmployeeProfileDetails(tenantId: string = getTenantId()) {
  const getProfileDetails = useCallback(
    async (userProfileId: string) => {
      if (!insForge) throw new Error("Database not connected")

      const [family, education, informal, organization, work, portfolio] =
        await Promise.all([
          insForge
            .from("employee_family_members")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("user_profile_id", userProfileId)
            .order("sort_order", { ascending: true }),
          insForge
            .from("employee_education_histories")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("user_profile_id", userProfileId)
            .order("sort_order", { ascending: true }),
          insForge
            .from("employee_informal_education_histories")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("user_profile_id", userProfileId)
            .order("sort_order", { ascending: true }),
          insForge
            .from("employee_organization_experiences")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("user_profile_id", userProfileId)
            .order("sort_order", { ascending: true }),
          insForge
            .from("employee_work_histories")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("user_profile_id", userProfileId)
            .order("sort_order", { ascending: true }),
          insForge
            .from("employee_portfolios")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("user_profile_id", userProfileId)
            .order("sort_order", { ascending: true }),
        ])

      const errors = [
        family.error,
        education.error,
        informal.error,
        organization.error,
        work.error,
        portfolio.error,
      ].filter(Boolean)
      if (errors.length > 0) throw errors[0]

      return {
        familyMembers: family.data ?? [],
        educationHistories: education.data ?? [],
        informalEducations: informal.data ?? [],
        organizationExperiences: organization.data ?? [],
        workHistories: work.data ?? [],
        portfolioItems: portfolio.data ?? [],
      }
    },
    [tenantId]
  )

  const replaceProfileDetails = useCallback(
    async (userProfileId: string, payload: EmployeeProfileDetailsPayload) => {
      if (!insForge) throw new Error("Database not connected")

      const cleanupTargets = [
        "employee_family_members",
        "employee_education_histories",
        "employee_informal_education_histories",
        "employee_organization_experiences",
        "employee_work_histories",
        "employee_portfolios",
      ]

      for (const table of cleanupTargets) {
        const { error } = await insForge
          .from(table)
          .delete()
          .eq("tenant_id", tenantId)
          .eq("user_profile_id", userProfileId)
        if (error) throw error
      }

      const inserts: Array<Promise<{ error: unknown }>> = []

      if (payload.familyMembers.length > 0) {
        inserts.push(
          insForge.from("employee_family_members").insert(
            payload.familyMembers.map((item, idx) => ({
              ...item,
              tenant_id: tenantId,
              user_profile_id: userProfileId,
              sort_order: idx,
            }))
          )
        )
      }
      if (payload.educationHistories.length > 0) {
        inserts.push(
          insForge.from("employee_education_histories").insert(
            payload.educationHistories.map((item, idx) => ({
              ...item,
              tenant_id: tenantId,
              user_profile_id: userProfileId,
              sort_order: idx,
            }))
          )
        )
      }
      if (payload.informalEducations.length > 0) {
        inserts.push(
          insForge.from("employee_informal_education_histories").insert(
            payload.informalEducations.map((item, idx) => ({
              ...item,
              tenant_id: tenantId,
              user_profile_id: userProfileId,
              sort_order: idx,
            }))
          )
        )
      }
      if (payload.organizationExperiences.length > 0) {
        inserts.push(
          insForge.from("employee_organization_experiences").insert(
            payload.organizationExperiences.map((item, idx) => ({
              ...item,
              tenant_id: tenantId,
              user_profile_id: userProfileId,
              sort_order: idx,
            }))
          )
        )
      }
      if (payload.workHistories.length > 0) {
        inserts.push(
          insForge.from("employee_work_histories").insert(
            payload.workHistories.map((item, idx) => ({
              ...item,
              tenant_id: tenantId,
              user_profile_id: userProfileId,
              sort_order: idx,
            }))
          )
        )
      }
      if (payload.portfolioItems.length > 0) {
        inserts.push(
          insForge.from("employee_portfolios").insert(
            payload.portfolioItems.map((item, idx) => ({
              ...item,
              tenant_id: tenantId,
              user_profile_id: userProfileId,
              sort_order: idx,
            }))
          )
        )
      }

      const results = await Promise.all(inserts)
      const insertError = results.map((r) => r.error).find(Boolean)
      if (insertError) throw insertError
    },
    [tenantId]
  )

  return {
    getProfileDetails,
    replaceProfileDetails,
  }
}
