export interface ManpowerRow {
  role_name: string
  work_mode: string
  qty: number
  months: number
  publish_rate: number
}

export interface QuotationData {
  client_name: string
  company_name: string
  company_address: string | null
  contact_phone: string | null
  quotation_number: string
  project_type: string
  date: string
  valid_days: number
  scope_of_work: string | null
  manpower_rows: ManpowerRow[]
  terms_and_conditions: string | null
}
