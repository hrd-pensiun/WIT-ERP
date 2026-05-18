# Commercial Feature 

## 1. Overview & Business Purpose

### Apa yang dilakukan fitur ini?
Fitur Commercial adalah modul **pricing & project tracking** untuk perusahaan IT consulting/services. Terdiri dari 3 sub-fitur:

| Sub-fitur | URL | Tujuan |
|---|---|---|
| **Calculator** | `/commercial` | Hitung HPP, Publish Rate, dan margin keuntungan per project berdasarkan komposisi manpower |
| **Projects** | `/commercial/projects` | Dashboard semua project yang pernah dihitung, dengan filter, chart analitik, dan export Excel |
| **Rate Cards** | `/commercial/rate-cards` | Master data harga per role (HPP, Special Rate, Publish Rate) yang dipakai Calculator |

### Business Logic Utama
- **3 tier harga**: HPP (biaya internal) → Special Rate (harga diskon) → Publish Rate (harga normal)
- **Deductions** dari Publish Rate: Pajak (default 11%) + Founder Fee (3%) + Management Fee (2%) + SE Fee (0%)
- **TOPP Allocation**: Sisa setelah deductions dibagi ke COGS (25%) dan OPEX (75%)
- **Project Code Auto-gen**: Format `CMP-YYYY-NNNN` via database trigger
- **Margin Analysis**: Profit vs HPP, Margin %, Discount vs Publish, Variance antara Quotation vs Actual Deal

---

## 2. Architecture & Folder Structure

```
apps/web/
├── app/
│   ├── commercial/
│   │   ├── layout.tsx                    # SidebarProvider + breadcrumb wrapper
│   │   ├── page.tsx                      # Calculator page (main UI)
│   │   ├── projects/
│   │   │   ├── page.tsx                  # Project list + analytics dashboard
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx          # Edit existing project (loads into Calculator)
│   │   └── rate-cards/
│   │       └── page.tsx                  # Rate card CRUD management
│   └── api/
│       ├── commercial-projects/
│       │   └── route.ts                  # GET/POST/PUT/DELETE for projects + manpower
│       └── commercial-rate-cards/
│           └── route.ts                  # GET/POST/PUT/DELETE for rate cards
├── lib/
│   └── commercial-data.ts                # Interfaces, utility functions, static RATE_CARD fallback
└── components/
    └── app-sidebar.tsx                   # Sidebar nav entry (Commercial section)

supabase/migrations/
├── 20260511_002_commercial_tables_fix.sql        # Tables + View + RLS policies
├── 20260512_003_commercial_project_code.sql      # Add project_code column + recreate view
└── 20260512150000_commercial_project_auto_code.sql # Trigger for auto project_code
```

---

## 3. Database Schema (Supabase)

### Prerequisites
Pastikan sudah ada:
- `public.tenants` table dengan column `id uuid`
- `public.user_profiles` table dengan columns `id uuid, tenant_id uuid`
- Function `public.update_updated_at_column()` (standard updated_at trigger function)

---

### Table 1: `commercial_rate_cards`

```sql
CREATE TABLE public.commercial_rate_cards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type          text NOT NULL,          -- 'Consultant' | 'Networking' | 'Project' | 'Web' | 'WMS'
  group_name    text NOT NULL,          -- e.g. 'AA', 'JUN-PROJ', 'MED-NET'
  role_name     text NOT NULL,          -- e.g. 'Backend', 'PM / SA'
  hpp           numeric(15,2) NOT NULL DEFAULT 0,
  special_rate  numeric(15,2) NOT NULL DEFAULT 0,
  publish_rate  numeric(15,2) NOT NULL DEFAULT 0,
  is_active     boolean DEFAULT true,
  notes         text,
  display_id    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Partial unique: 1 active record per tenant+type+group+role
CREATE UNIQUE INDEX idx_rate_cards_unique_active
  ON public.commercial_rate_cards (tenant_id, type, group_name, role_name)
  WHERE is_active = true;

CREATE INDEX idx_rate_cards_tenant ON public.commercial_rate_cards(tenant_id);
CREATE INDEX idx_rate_cards_type   ON public.commercial_rate_cards(type);
```

---

### Table 2: `commercial_projects`

```sql
CREATE TABLE public.commercial_projects (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_code              text NULL,          -- auto-generated: CMP-YYYY-NNNN
  project_name              text NOT NULL,
  pic                       text,               -- nama PIC (free text)
  status                    text NOT NULL DEFAULT 'Draft'
                            CHECK (status IN ('Draft','Submitted','Negotiation','Won','Lost','On Hold')),
  project_type              text NOT NULL,      -- same values as rate_cards.type

  -- Pricing
  quotation_publish         numeric(15,2) DEFAULT 0,
  actual_deal               numeric(15,2) DEFAULT 0,

  -- Deductions (stored as percentages)
  deduction_pajak           numeric(5,2) DEFAULT 11,
  deduction_founder_fee     numeric(5,2) DEFAULT 3,
  deduction_management_fee  numeric(5,2) DEFAULT 2,
  deduction_se_fee          numeric(5,2) DEFAULT 0,

  -- TOPP split (stored as percentages, should sum to 100)
  topp_cogs_pct             numeric(5,2) DEFAULT 25,
  topp_opex_pct             numeric(5,2) DEFAULT 75,

  -- Future linkages (nullable foreign keys)
  quotation_id              uuid,
  project_id                uuid,
  invoice_id                uuid,

  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now(),
  created_by                uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_commercial_projects_code
  ON public.commercial_projects(tenant_id, project_code)
  WHERE project_code IS NOT NULL;

CREATE INDEX idx_commercial_projects_tenant    ON public.commercial_projects(tenant_id);
CREATE INDEX idx_commercial_projects_status    ON public.commercial_projects(status);
CREATE INDEX idx_commercial_projects_type      ON public.commercial_projects(project_type);
CREATE INDEX idx_commercial_projects_quotation ON public.commercial_projects(quotation_id)
  WHERE quotation_id IS NOT NULL;
```

---

### Table 3: `commercial_project_manpower`

```sql
CREATE TABLE public.commercial_project_manpower (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_project_id uuid NOT NULL
    REFERENCES public.commercial_projects(id) ON DELETE CASCADE,
  rate_card_id          uuid
    REFERENCES public.commercial_rate_cards(id) ON DELETE SET NULL,
  group_name            text NOT NULL,
  role_name             text NOT NULL,
  employee_name         text,
  qty                   integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  months                integer NOT NULL DEFAULT 1 CHECK (months > 0),

  -- ⚠️ SNAPSHOT RATES (isolated from master rate card changes)
  hpp_rate              numeric(15,2) NOT NULL DEFAULT 0,
  special_rate          numeric(15,2) NOT NULL DEFAULT 0,
  publish_rate          numeric(15,2) NOT NULL DEFAULT 0,

  created_at            timestamptz DEFAULT now()
);

CREATE INDEX idx_manpower_project   ON public.commercial_project_manpower(commercial_project_id);
CREATE INDEX idx_manpower_rate_card ON public.commercial_project_manpower(rate_card_id)
  WHERE rate_card_id IS NOT NULL;
```

---

### View: `v_commercial_project_summary`

```sql
-- Final version (after migration 20260512_003)
CREATE OR REPLACE VIEW public.v_commercial_project_summary AS
WITH manpower_calc AS (
  SELECT
    m.commercial_project_id,
    SUM(m.publish_rate * m.qty * m.months) AS total_publish_snapshot,
    SUM(m.hpp_rate    * m.qty * m.months) AS total_hpp_snapshot,
    SUM(m.special_rate * m.qty * m.months) AS total_special_snapshot,
    MAX(m.months) AS max_months
  FROM public.commercial_project_manpower m
  GROUP BY m.commercial_project_id
)
SELECT
  p.id, p.tenant_id, p.project_code, p.project_name, p.pic,
  p.status, p.project_type AS type,
  p.quotation_publish, p.actual_deal,
  COALESCE(mc.total_hpp_snapshot, 0)     AS total_hpp,
  COALESCE(mc.total_publish_snapshot, 0) AS total_publish,
  COALESCE(mc.total_special_snapshot, 0) AS total_special,
  COALESCE(mc.max_months, 0)             AS max_months,
  -- Deduction total amount
  COALESCE(mc.total_publish_snapshot, 0)
    * (p.deduction_pajak + p.deduction_founder_fee + p.deduction_management_fee + p.deduction_se_fee) / 100
    AS total_deductions,
  -- Sales Project (after deductions)
  COALESCE(mc.total_publish_snapshot, 0)
    - (COALESCE(mc.total_publish_snapshot, 0)
       * (p.deduction_pajak + p.deduction_founder_fee + p.deduction_management_fee + p.deduction_se_fee) / 100)
    AS sales_project,
  -- Profit vs HPP
  COALESCE(mc.total_publish_snapshot, 0) - COALESCE(mc.total_hpp_snapshot, 0) AS profit_publish,
  CASE WHEN COALESCE(mc.total_publish_snapshot, 0) > 0
    THEN ((COALESCE(mc.total_publish_snapshot, 0) - COALESCE(mc.total_hpp_snapshot, 0))
          / COALESCE(mc.total_publish_snapshot, 0)) * 100
    ELSE 0 END AS margin_publish_pct,
  -- Profit vs Actual Deal
  p.actual_deal - COALESCE(mc.total_hpp_snapshot, 0) AS profit_actual,
  CASE WHEN p.actual_deal > 0
    THEN ((p.actual_deal - COALESCE(mc.total_hpp_snapshot, 0)) / p.actual_deal) * 100
    ELSE 0 END AS margin_actual_pct,
  -- Variance
  p.quotation_publish - p.actual_deal AS variance,
  CASE WHEN p.quotation_publish > 0
    THEN ((p.quotation_publish - p.actual_deal) / p.quotation_publish) * 100
    ELSE 0 END AS variance_pct,
  -- TOPP
  COALESCE(mc.total_publish_snapshot, 0)
    * (100 - (p.deduction_pajak + p.deduction_founder_fee + p.deduction_management_fee + p.deduction_se_fee)) / 100
    * p.topp_cogs_pct / 100 AS cogs_amount,
  COALESCE(mc.total_publish_snapshot, 0)
    * (100 - (p.deduction_pajak + p.deduction_founder_fee + p.deduction_management_fee + p.deduction_se_fee)) / 100
    * p.topp_opex_pct / 100 AS opex_amount,
  p.created_at, p.updated_at
FROM public.commercial_projects p
LEFT JOIN manpower_calc mc ON mc.commercial_project_id = p.id;
```

---

### Auto Project Code Trigger

```sql
-- Function to get next sequence
CREATE OR REPLACE FUNCTION public.get_next_project_code(p_tenant_id uuid, p_year integer)
RETURNS TEXT AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(project_code FROM 'CMP-[0-9]{4}-([0-9]+)$') AS INTEGER)
  ), 0) + 1
  INTO next_seq
  FROM public.commercial_projects
  WHERE tenant_id = p_tenant_id
    AND project_code LIKE 'CMP-' || p_year || '%';
  RETURN 'CMP-' || p_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger function
CREATE OR REPLACE FUNCTION public.trg_assign_project_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    NEW.project_code := public.get_next_project_code(
      NEW.tenant_id,
      EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW()))::INTEGER
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_project_code ON public.commercial_projects;
CREATE TRIGGER trg_assign_project_code
  BEFORE INSERT ON public.commercial_projects
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_project_code();
```

---

### RLS Policies

Semua 3 table menggunakan pattern yang sama — check `tenant_id` via `user_profiles`:

```sql
ALTER TABLE public.commercial_rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_project_manpower ENABLE ROW LEVEL SECURITY;

-- Rate Cards: tenant-scoped
CREATE POLICY "tenant_rate_cards_select" ON public.commercial_rate_cards FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_rate_cards_insert" ON public.commercial_rate_cards FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_rate_cards_update" ON public.commercial_rate_cards FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()));
CREATE POLICY "tenant_rate_cards_delete" ON public.commercial_rate_cards FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()));

-- Projects: same pattern (copy above, change table name)

-- Manpower: indirect via project tenant check
CREATE POLICY "tenant_manpower_select" ON public.commercial_project_manpower FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.commercial_projects p
    WHERE p.id = commercial_project_manpower.commercial_project_id
    AND p.tenant_id IN (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
  ));
-- (repeat INSERT/UPDATE/DELETE with same pattern)
```

> **⚠️ API routes bypass RLS** using the Supabase service role key directly — no `auth.uid()` lookup needed in API calls. RLS applies only to client-side queries.

---

## 4. Detailed File Breakdown

### `lib/commercial-data.ts` — Core Business Logic

**Interfaces exported:**
| Interface | Purpose |
|---|---|
| `RateCardEntry` | `{ type, group, role, hpp, specialRate, publishRate }` |
| `ManpowerRow` | `{ id, type, group, roleIndex, nama, qty, months }` |
| `Deductions` | `{ pajak, founderFee, managementFee, seFee }` (all percentages) |
| `ToppAllocation` | `{ cogsPct, opexPct }` (percentages, sum = 100) |
| `ProjectInfo` | `{ projectName, pic, status, type }` |
| `SummaryResult` | Full calculated result with 18 numeric fields |

**Utility functions exported:**
| Function | Signature | Purpose |
|---|---|---|
| `fmtIDR(n)` | `(number) → string` | Format as "IDR 1.234.567" |
| `parseIDR(text)` | `(string) → number` | Parse "IDR 1.234.567" back to number |
| `pct(n)` | `(number) → string` | Format as "12.3%" |
| `getGroups(type)` | `(string) → string[]` | Get unique groups for a type from static RATE_CARD |
| `getRoles(type, group)` | `(string, string) → RateCardEntry[]` | Get roles for type+group |
| `getRoleEntry(type, group, role)` | `→ RateCardEntry \| undefined` | Exact lookup |
| `getEntryByIndex(index)` | `(number) → RateCardEntry \| undefined` | Index-based lookup |
| `calcRow(entry, qty, months)` | `→ { hpp, publish, special }` | Calculate one row |
| `getDeductions(total, d)` | `→ deduction breakdown object` | Calculate all deductions |
| `calculateSummary(rows, d, topp, quotation, actual)` | `→ SummaryResult` | Full summary calculation |

**Static fallback `RATE_CARD[]`**: 41 entries covering 5 types (Consultant, Networking, Project, Web, WMS). Used when API is unavailable.

---

### `app/commercial/layout.tsx` — Module Layout

Standard pattern: `SidebarProvider → AppSidebar → SidebarInset → [sticky header with breadcrumb] → {children}`.

Breadcrumb: Dashboard → Commercial

```tsx
// Copy this layout verbatim, change breadcrumb label
export default function CommercialLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 w-full bg-background ...">
          {/* SidebarTrigger + Separator + Breadcrumb */}
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

---

### `app/commercial/page.tsx` — Calculator

**State structure:**
```tsx
const [project, setProject]         = useState<ProjectInfo>({ projectName:'', pic:'', status:'Draft', type:'Consultant' })
const [rows, setRows]               = useState<CalculatorRow[]>([...2 empty rows])
const [deductions, setDeductions]   = useState<Deductions>({ pajak:11, founderFee:3, managementFee:0, seFee:0 })
const [topp, setTopp]               = useState<ToppAllocation>({ cogsPct:20, opexPct:80 })
const [rateCards, setRateCards]     = useState<RateCardEntry[]>([])     // fetched from API
const [quotationRaw, setQuotationRaw] = useState('')                     // IDR-formatted string
const [actualDealRaw, setActualDealRaw] = useState('')
const [saveMode, setSaveMode]       = useState<'new'|'update'>('new')
const [savedId, setSavedId]         = useState<string|null>(null)
```

**Key flows:**
1. On mount: `fetch('/api/commercial-rate-cards')` → populate `rateCards` (fallback to static `RATE_CARD`)
2. `selectType(type)` → reset rows to 2 empty rows
3. `updateRow(id, 'group', value)` → reset `role` field on same row
4. `summary` = `useMemo(() => calculateSummary(...), [dataRows, deductions, topp, ...])`
5. `handleSave()` → POST or PUT to `/api/commercial-projects` → toast success
6. `handleReset()` → clear all state, set `saveMode = 'new'`

---

### `app/commercial/projects/page.tsx` — Project List

**Key dependencies:**
```tsx
import * as XLSX from 'xlsx';                    // npm: xlsx
import { BarChart, LineChart, PieChart, ... } from 'recharts';  // npm: recharts
import { toast } from 'sonner';                  // npm: sonner
```

**Features:**
- Fetch `GET /api/commercial-projects` on mount
- Filter by: search text, status, type
- Stats cards: Total Projects, Won, Negotiation, Draft counts + total value
- Charts: Bar chart (projects by status), Pie chart (by type), Line chart (monthly trend)
- Table: columns = Code, Name, PIC, Type, Status, Publish, Actual, Margin%, Actions
- Delete: `DELETE /api/commercial-projects?id=xxx` with confirmation
- Export Excel: `XLSX.utils.aoa_to_sheet()` → `XLSX.writeFile()` → downloads `.xlsx`
- Link to Calculator for edit: `href="/commercial/projects/{id}/edit"`

---

### `app/commercial/projects/[id]/edit/page.tsx` — Edit Project

- On mount: `fetch('/api/commercial-projects?id={id}')` → load full project including manpower
- Pre-populates Calculator state (rows, deductions, topp, project info)
- On save: `PUT /api/commercial-projects` (full replace of manpower)

---

### `app/commercial/rate-cards/page.tsx` — Rate Card CRUD

**Features:**
- Fetch `GET /api/commercial-rate-cards` on mount
- Filter by type tabs + search text
- Table: Type, Group, Role, HPP, Special Rate, Publish Rate, Actions
- Add/Edit dialog with form fields
- Delete with confirmation
- CRUD via `POST/PUT/DELETE /api/commercial-rate-cards`

---

### `app/api/commercial-projects/route.ts` — Projects API

**Pattern:** Direct `createClient(url, SERVICE_ROLE_KEY)` — bypasses RLS.

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { db: { schema: 'public' }, auth: { autoRefreshToken: false, persistSession: false } }
)
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'
```

**Endpoints:**

| Method | Params | Description |
|---|---|---|
| `GET` | `?id=uuid` | Fetch single project (project + manpower + summary via view) |
| `GET` | `?status=X&type=Y&limit=N&offset=N` | List projects via `v_commercial_project_summary` view |
| `POST` | body: `ProjectPayload` | Create project + manpower rows (with rollback on manpower failure) |
| `PUT` | body: `{ id, ...fields, manpower[] }` | Update project + replace all manpower (delete-then-insert) |
| `DELETE` | `?id=uuid` | Delete project (manpower auto-deleted via CASCADE) |

**DB/Client naming mapping (snake_case ↔ camelCase):**

| DB column | Client field |
|---|---|
| `project_name` | `projectName` |
| `project_type` | `type` |
| `project_code` | `projectCode` |
| `quotation_publish` | `quotationPublish` |
| `actual_deal` | `actualDeal` |
| `deduction_pajak` | `deductions.pajak` |
| `deduction_founder_fee` | `deductions.founderFee` |
| `deduction_management_fee` | `deductions.managementFee` |
| `deduction_se_fee` | `deductions.seFee` |
| `topp_cogs_pct` | `topp.cogsPct` |
| `topp_opex_pct` | `topp.opexPct` |
| `group_name` | `group` |
| `role_name` | `role` |
| `employee_name` | `nama` |
| `hpp_rate` | `hppRate` |
| `special_rate` | `specialRate` |
| `publish_rate` | `publishRate` |

**Manpower rate card resolution:**
```typescript
// On POST/PUT, build rate card lookup map first
const rcMap = await getRateCardMap()  // Map<"type|group|role", RateCardEntry>
// Then for each manpower row:
const rc = rcMap.get(`${type}|${m.group}|${m.role}`)
// Snapshot rates into manpower row (isolated from future rate card changes)
```

---

### `app/api/commercial-rate-cards/route.ts` — Rate Cards API

Same Supabase client pattern. Exposes full CRUD:

| Method | Notes |
|---|---|
| `GET` | Filter by `?type=X&group=Y`, returns `{ data[], meta: { types[], groups[] } }` |
| `POST` | Required: `type, group, role, hpp, specialRate, publishRate`. Returns 409 on duplicate. |
| `PUT` | Required: `id`. Partial update of any fields. Returns 409 on duplicate constraint. |
| `DELETE` | `?id=uuid`. Hard delete. |

---

## 5. Duplication Checklist

### Step 1: Install NPM Dependencies
```bash
npm install recharts xlsx sonner
# atau
pnpm add recharts xlsx sonner
```

### Step 2: Run Migrations (in order)
```
1. 20260511_002_commercial_tables_fix.sql     # Tables + View + RLS
2. 20260512_003_commercial_project_code.sql   # project_code column
3. 20260512150000_commercial_project_auto_code.sql  # Auto-code trigger
```

Prerequisite functions/tables required sebelum migrate:
- `public.tenants` table
- `public.user_profiles` table  
- `public.update_updated_at_column()` function

### Step 3: Seed Rate Cards
Jalankan seeder untuk populate `commercial_rate_cards` dengan 41 entries dari `lib/commercial-data.ts` RATE_CARD static array. Contoh script:
```sql
INSERT INTO commercial_rate_cards (tenant_id, type, group_name, role_name, hpp, special_rate, publish_rate)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Consultant', 'AA', 'Consultant Finance', 16775016, 28014277, 30530529),
  -- ... (41 total rows from RATE_CARD array in lib/commercial-data.ts)
```

### Step 4: Copy Files
```
lib/commercial-data.ts                         → copy as-is
app/commercial/layout.tsx                      → copy, adjust breadcrumb if needed
app/commercial/page.tsx                        → copy as-is
app/commercial/projects/page.tsx               → copy as-is
app/commercial/projects/[id]/edit/page.tsx     → copy as-is
app/commercial/rate-cards/page.tsx             → copy as-is
app/api/commercial-projects/route.ts           → copy as-is
app/api/commercial-rate-cards/route.ts         → copy as-is
```



### Step 5: Add to Sidebar
```tsx
// components/app-sidebar.tsx
import { CalculatorIcon } from 'lucide-react'

{
  title: "Commercial",
  url: "#",
  icon: <CalculatorIcon />,
  items: [
    { title: "Calculator", url: "/commercial" },
    { title: "Projects", url: "/commercial/projects" },
    { title: "Master Rate Cards", url: "/commercial/rate-cards" },
  ],
}
```

### Step 7: Verify Sidebar supports `isCategoryHeader` pattern
Check `components/nav-main.tsx` — pastikan ada conditional render untuk `item.isCategoryHeader`.

### Step 8: Verify UI Component Imports
Semua komponen diimport dari `@workspace/ui/components/*`. Pastikan package alias ini tersedia:
```typescript
// tsconfig.json / next.config.mjs path alias
"@workspace/ui/*": ["../../packages/ui/src/*"]
```

---

## 6. Gotchas, Risks & Best Practices

### ⚠️ Gotcha 1: Rate Card Snapshot Pattern
Manpower rows menyimpan **snapshot rates** (hpp_rate, special_rate, publish_rate) saat project dibuat. Ini berarti perubahan Rate Card Master **tidak otomatis** mengubah data project lama. Ini adalah **desain yang disengaja** — historical pricing integrity.

### ⚠️ Gotcha 2: Supabase Client di API Route
API routes menggunakan `createClient(url, SERVICE_ROLE_KEY)` **bukan** `createServerClient` dari `@supabase/ssr`. Ini karena:
- API routes tidak butuh cookie-based auth
- Service role bypasses RLS — cocok untuk server-side trusted operations
- **Jangan** expose SERVICE_ROLE_KEY ke client-side

```typescript
// ✅ Benar untuk API routes
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// ❌ Salah — ini untuk server components dengan auth
import { createAdminClient } from '@/lib/supabase-server'
```

### ⚠️ Gotcha 3: months column — INTEGER not FLOAT
Di database `commercial_project_manpower`, kolom `months` adalah `INTEGER`. Jika user memasukkan 0.5 bulan, API akan truncate ke 0 (lalu CHECK constraint `months > 0` akan fail). Saat ini, UI membatasi minimum ke 1.

Jika perlu fractional months: alter column ke `numeric(5,1)` dan update CHECK constraint.

### ⚠️ Gotcha 4: Rate Card Map Key Format
Lookup key di API adalah `"type|group_name|role_name"`:
```typescript
map.set(`${rc.type}|${rc.group_name}|${rc.role_name}`, rc)
// Client lookup:
rcMap.get(`${body.type}|${m.group}|${m.role}`)
```
Pastikan tidak ada whitespace tersembunyi di group/role names. `frontendToDb()` melakukan `.trim()`.

### ⚠️ Gotcha 5: View vs Direct Table Query
- List projects → gunakan **view** `v_commercial_project_summary` (sudah include calculated fields)
- Single project detail → fetch dari **tabel langsung** + manpower join (view tidak include manpower rows)
- Edit form → perlu manpower rows → gunakan `getFullProject()` helper

### ⚠️ Gotcha 6: Project Code Auto-gen Race Condition
Trigger `get_next_project_code()` tidak menggunakan sequence (SERIAL), melainkan `MAX() + 1`. Pada high concurrency ini bisa race condition. Untuk production tinggi, ganti dengan `CREATE SEQUENCE`.

### ⚠️ Gotcha 7: Excel Export di Browser
`xlsx` library menggunakan `XLSX.writeFile()` yang trigger browser download. Ini tidak bisa dijalankan di server component. Pastikan page menggunakan `'use client'`.

### 🔒 Best Practice: DEFAULT_TENANT_ID
Saat ini semua API routes hardcode `'00000000-0000-0000-0000-000000000001'`. Untuk multi-tenant production:
1. Implement session-based tenant resolution
2. Extract `tenant_id` dari JWT claims atau session cookie
3. Replace constant dengan `await getTenantId(request)`

---

## 7. Refactoring Recommendations

### Priority 1: Gabungkan Migration Files
Saat ini ada 3 migration files terpisah. Untuk project baru, gabungkan ke satu file:
```
commercial_tables_complete.sql   # tables + view + rls + trigger + seed
```

### Priority 2: Extract API Client Layer
Saat ini logic API (helper functions `manpowerDbToClient`, `projectDbToClient`, dll) ada di dalam route.ts. Pindahkan ke:
```
lib/repositories/commercial.ts   # query functions
lib/types/commercial.ts          # TypeScript interfaces
```

### Priority 3: Rate Card Loading Strategy
Saat ini Calculator fetch rate cards dari API setiap page load, dengan fallback ke static `RATE_CARD[]`. Untuk performa:
- Tambahkan `cache: 'force-cache'` atau `revalidate` di fetch
- Atau gunakan React Query / SWR dengan staleTime yang panjang

### Priority 4: Fractional Months Support
Ubah `months` column dari `INTEGER` ke `NUMERIC(5,1)` untuk support 0.5 bulan, 1.5 bulan, dll.

### Priority 5: Real-time Project Code
Saat ini project code auto-gen terjadi di database trigger. Jika ingin preview code sebelum save, tambahkan endpoint `GET /api/commercial-projects/preview-code` yang memanggil `get_next_project_code()` tanpa INSERT.

### Priority 6: Proper Multi-Tenant Auth
Replace `DEFAULT_TENANT_ID` hardcode dengan proper JWT/session extraction di semua API routes.

---

## 8. Quick Reference — API Contracts

### POST `/api/commercial-projects`
```typescript
// Request body
{
  projectName: string        // required
  pic?: string
  status: string             // 'Draft' | 'Submitted' | 'Negotiation' | 'Won' | 'Lost' | 'On Hold'
  type: string               // 'Consultant' | 'Networking' | 'Project' | 'Web' | 'WMS'
  quotationPublish?: number
  actualDeal?: number
  deductions?: { pajak: number, founderFee: number, managementFee: number, seFee: number }
  topp?: { cogsPct: number, opexPct: number }
  manpower?: Array<{ group: string, role: string, nama?: string, qty: number, months: number }>
  createdAt?: string         // ISO date string, defaults to now()
}
// Response: full project object with calculated summary
```

### GET `/api/commercial-projects`
```
?id=uuid                     → single project with manpower[] and summary{}
?status=Won&type=Project     → filtered list
?limit=50&offset=0           → pagination
```

### PUT `/api/commercial-projects`
```typescript
{ id: string, ...same fields as POST, manpower: [...] }
// manpower is replaced wholesale (delete-then-insert)
```

### DELETE `/api/commercial-projects?id=uuid`
```
Response: { success: true }
```

### GET `/api/commercial-rate-cards`
```
?type=Consultant&group=AA    → filtered
Response: { success: true, data: RateCard[], meta: { types: string[], groups: string[] } }
```

### POST `/api/commercial-rate-cards`
```typescript
{ type, group, role, hpp, specialRate, publishRate, isActive?, notes? }
// 409 if duplicate type+group+role (per unique index)
```

### PUT `/api/commercial-rate-cards`
```typescript
{ id: string, ...same fields }
```

### DELETE `/api/commercial-rate-cards?id=uuid`

---

## 9. Verification Checklist

Setelah duplikasi selesai, verifikasi:

- [ ] `/commercial` — Calculator renders, rate card dropdown terisi dari API
- [ ] Calculator: pilih type, group, role → HPP/Publish/Special Rate terisi otomatis
- [ ] Calculator: Summary section menghitung dengan benar (Total HPP, Margin, dll)
- [ ] Calculator: Save button → project tersimpan, redirect ke /commercial/projects
- [ ] `/commercial/projects` — List muncul, filter status/type berfungsi
- [ ] Projects: Delete project → konfirmasi, terhapus dari list
- [ ] Projects: Export Excel → file `.xlsx` ter-download
- [ ] `/commercial/projects/{id}/edit` — Form pre-populated dengan data project
- [ ] Edit: Save → data ter-update di database
- [ ] `/commercial/rate-cards` — List rate cards muncul
- [ ] Rate Cards: Add → form dialog, simpan ke DB
- [ ] Rate Cards: Edit → pre-populated form, update ke DB
- [ ] Rate Cards: Delete → terhapus, list refresh
- [ ] Sidebar "Commercial" section: semua 3 links aktif
- [ ] `npm run build` — no TypeScript errors
- [ ] Database: `commercial_projects` auto-generates `project_code` = `CMP-YYYY-NNNN`