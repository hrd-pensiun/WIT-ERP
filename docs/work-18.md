This system is an enhancement module for an existing HRIS used by an IT Consulting company.

IMPORTANT:
The existing HRIS already has:
- authentication
- employee database
- organization structure
- department structure
- role management

DO NOT rebuild HRIS core functionality.

==================================================
MAIN OBJECTIVE
==================================================

Current objective is ONLY:

UI/UX FLOW VALIDATION

NOT backend implementation.

This means:
- focus on frontend flow
- focus on enterprise dashboard UX
- focus on navigation hierarchy
- focus on role-based visibility
- focus on workflow simulation
- focus on reusable components
- focus on responsive layout

DO NOT create:
- database schema
- migration
- backend API
- authentication logic
- ORM
- microservice architecture
- production backend

==================================================
BUSINESS CONTEXT
==================================================

This company is an IT Consulting company.

Some employees work on client projects.
Some employees work on operational/internal tasks.

Example:
- Developers mostly work on projects
- HR mostly work on operational tasks
- Support teams work on adhoc tasks
- PM handles delivery
- Commercial handles client/business side

Because of this:
NOT all work should be treated as “project”.

That is why the core concept is:

WORK ITEM

Every activity is treated as a Work Item.

==================================================
WORK ITEM TYPES
==================================================

The system must support:

1. Project Task
2. Operational Task
3. Support Task
4. Improvement Task
5. Incident Task

==================================================
MAIN SYSTEM MODULES
==================================================

The platform has 2 major domains:

1. Workforce Management
2. Project Management

==================================================
WORKFORCE MANAGEMENT
==================================================

Purpose:
Monitor manpower visibility across the company.

Main features:
- workload monitoring
- utilization tracking
- timesheet
- employee allocation
- overtime monitoring
- capacity planning
- resource visibility

Dashboard examples:
- active workload
- overloaded employees
- idle employees
- utilization rate
- manpower allocation
- delayed task

==================================================
PROJECT MANAGEMENT
==================================================

Project Management is divided into TWO separate perspectives.

==================================================
A. COMMERCIAL LAYER
==================================================

Used by:
- Sales
- Account Manager
- Business Development

Focus:
- client management
- quotation
- contract
- project scope
- milestone
- business visibility

Commercial users SHOULD NOT see:
- technical task detail
- sprint detail
- developer bug tracking
- engineering workflow

Commercial only needs:
- project health
- milestone
- progress summary
- risk visibility

Workflow:
Lead
→ Negotiation
→ Won
→ Assign PM
→ Delivery

==================================================
B. DELIVERY LAYER
==================================================

Used by:
- PM
- PIC
- Developer
- QA

Focus:
- sprint management
- task assignment
- workload balancing
- issue tracking
- project delivery
- progress monitoring

Workflow:
Create Sprint
→ Breakdown Task
→ Assign Developer
→ Monitor Progress
→ Delivery

==================================================
IMPORTANT UX PRINCIPLES
==================================================

The UI should feel like:
modern enterprise SaaS.

Style direction:
- clean
- minimal clutter
- easy scanning
- dashboard-first
- modern corporate look
- highly readable
- professional
- scalable

==================================================
UI STYLE REQUIREMENTS
==================================================

Use:
- React
- NextJS
- TailwindCSS
- shadcn/ui

Design style:
- rounded 2xl cards
- soft shadow
- clean spacing
- reusable components
- responsive layout
- modern sidebar navigation
- KPI cards
- dashboard widgets
- enterprise tables
- kanban board
- modular layout

==================================================
ROLE-BASED DASHBOARD
==================================================

The system must support different dashboard experiences.

==================================================
1. Commercial Dashboard
==================================================

Focus:
- project health
- milestone
- client visibility
- project risk
- delivery summary

==================================================
2. PM Dashboard
==================================================

Focus:
- sprint progress
- team workload
- delayed task
- blocked issue
- allocation monitoring

==================================================
3. Developer Dashboard
==================================================

Focus:
- my tasks
- due date
- active sprint
- worklog
- task priority

Keep developer workflow SIMPLE.

==================================================
4. HR Dashboard
==================================================

Focus:
- utilization
- workforce monitoring
- workload distribution
- overtime trend
- manpower visibility

==================================================
5. Executive Dashboard
==================================================

Focus:
- KPI summary
- profitability visibility
- project performance
- company utilization
- operational visibility

==================================================
MAIN PAGES TO BUILD
==================================================

Build these pages incrementally:

1. Main Layout
2. Sidebar Navigation
3. Dashboard Overview
4. Workforce Dashboard
5. Project Dashboard
6. Task Management
7. Sprint Board
8. Resource Allocation
9. Timesheet
10. Workload Monitoring
11. Project Detail
12. Work Item Detail
13. Executive Dashboard

==================================================
TASK MANAGEMENT UI
==================================================

Task fields:
- task name
- project
- assigned PIC
- priority
- status
- due date
- work type
- estimated hours
- actual hours

Statuses:
- Pending
- In Progress
- Review
- Done
- Blocked

==================================================
RESOURCE ALLOCATION
==================================================

The platform MUST support resource allocation monitoring.

Example:
- Andi = 120% allocation (overloaded)
- Budi = 85%
- Citra = 45%

This is IMPORTANT.

==================================================
CURRENT DEVELOPMENT PHASE
==================================================

PHASE 1 ONLY:
UI/UX PROTOTYPE

Build:
- static pages
- reusable components
- mock data
- frontend interaction
- visual hierarchy

DO NOT jump to backend.

==================================================
DO NOT IMPLEMENT YET
==================================================

- Database
- ORM
- API
- Authentication
- Backend logic
- Migration
- Microservice
- Queue system
- Websocket
- Real analytics engine

==================================================
SUCCESS CRITERIA
==================================================

The implementation is successful if:
- business flow is clear
- role separation is clear
- commercial vs delivery separation is clear
- UI feels enterprise-grade
- dashboard hierarchy is easy to understand
- workforce monitoring is intuitive
- PM workflow is efficient
- developer workflow is simple
- scalable for future backend integration

==================================================
FINAL INSTRUCTION
==================================================

Think like a senior SaaS product designer + enterprise frontend architect.

Do NOT over-engineer.

Focus on:
- UX clarity
- clean hierarchy
- maintainable components
- scalable frontend structure
- business workflow accuracy

Build incrementally starting from:
1. App Layout
2. Sidebar
3. Dashboard
4. Workforce Module
5. Project Module