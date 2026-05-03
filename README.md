# WIT-ERP

> **WIT.ID ERP System** — Digital Agency Management dengan Multi-Entitas, Talent Pooling, dan Payroll BOPP/TOPP.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local dengan credentials InsForge Anda

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📁 Project Structure

```
my-app/
├── app/
│   ├── (dashboard)/           # Dashboard routes with layout
│   │   ├── master-data/       # Master data configuration
│   │   │   └── entity/        # Entity management
│   │   ├── hr/                # HR module
│   │   ├── crm/               # CRM module
│   │   ├── project/           # Project module
│   │   ├── finance/           # Finance module
│   │   ├── page.tsx           # Dashboard home
│   │   └── layout.tsx         # Dashboard layout
│   ├── page.tsx               # Root redirect
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Design system (dark mode default)
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── layout/                # Layout components
│       ├── sidebar.tsx        # Navigation sidebar
│       └── header.tsx         # Top header
├── lib/
│   ├── insforge.ts            # InsForge client
│   └── utils.ts               # Utility functions
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript types
└── docs/                      # Symlink to Obsidian documentation
```

---

## 🎨 Design System

**Dark Mode Default**
- Background: `slate-950` (#020617)
- Surface: `slate-900` (#0f172a)
- Primary: `emerald-600` (#059669)
- Accent: `cyan-400` (#22d3ee)
- Text: `slate-100` / `slate-400`
- Border: `slate-800`

**Font**: Geist Sans (via shadcn/ui Nova preset)

---

## 🗄️ Database Schema

Dokumentasi lengkap: `docs/14-PRD-Data-Model.md`

**Core Tables:**
- `tenants` — Multi-tenant root
- `entities` — Cabang/unit bisnis
- `departments` — Struktur organisasi
- `user_profiles` — Data karyawan
- `payroll_slips` — Payroll bulanan
- `projects` — Project management
- `crm_leads` — CRM pipeline

---

## 🔄 Sprint Plan

| Sprint | Fokus | Status |
|--------|-------|--------|
| **0** | Setup & Foundation | ✅ Complete |
| **1** | Master Data (Entity, Org, Calendar) | 🔄 Ready |
| **2** | Employee Management | ⏳ Pending |
| **3** | Attendance & Leave | ⏳ Pending |
| **4** | Payroll Core | ⏳ Pending |
| **5** | BOPP/TOPP | ⏳ Pending |
| **6** | CRM | ⏳ Pending |
| **7** | Project & Time Tracking | ⏳ Pending |
| **8** | Finance | ⏳ Pending |

---

## 🔧 Environment Variables

```bash
# Required
NEXT_PUBLIC_INSFORGE_URL=https://your-project.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key

# Optional (server-side only)
INSFORGE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📚 Documentation

Semua PRD tersedia di Obsidian vault via symlink:

```bash
cd docs/
ls -la  # Menampilkan semua file .md dari Obsidian
```

**Key Documents:**
- `13-PRD-Arsitektur.md` — Tech stack & architecture
- `14-PRD-Data-Model.md` — Database schema
- `15-PRD-Modul-HR.md` — HR business logic
- `SYSTEM-PROMPT-ERP.md` — Coding guidelines

---

## 🤝 Contributing

1. Pastikan fitur ada landasan di PRD
2. Ikuti pattern layer: DB → Types → Hooks → Components → Pages
3. Selalu gunakan TypeScript types dari schema
4. Tidak boleh ada data dummy/hardcode
5. Error handling wajib di setiap DB operation

---

## 📄 License

Private — WIT.ID Internal Use Only
