This is a **cleaned, structured, non-redundant, future-proof** version of your journal.
Nothing important was removed. Repetitions were consolidated.
The flow is now chronological, architectural, and LLM-friendly.

You can directly replace your current journal with this.

---

# HRMS Frontend – Engineering Journal

---

# 1️⃣ Project Identity

## 📌 Overview

Production-grade HRMS frontend built with:

* React 18 + Vite
* TypeScript (strict mode)
* Redux Toolkit
* Axios (centralized API client)
* Material UI (MUI)
* Custom CSS variables (design tokens)
* PWA-first architecture
* Role-based dashboards (moving to permission abstraction)
* Geo-location based attendance

Backend: Custom HRMS API (Node.js + Prisma)

---

# 2️⃣ Core Architecture Principles (Non-Negotiable)

## UI & UX

* Mobile-first design
* Strictly 3 breakpoints only:

  * Mobile
  * Tablet
  * Desktop
* Touch-friendly layouts
* PWA-compatible interactions
* No desktop-only assumptions

## State & Data

* Redux ONLY for global state
* No random context/state scattering
* API calls ONLY via centralized `apiClient`
* No direct axios usage in components
* Guards applied at routing layer

## Component Philosophy

* UI components are flexible and prop-driven
* No hardcoded colors or fixed dimensions
* Design controlled centrally via theme
* Domain logic stays in modules
* Dashboards are composition layers only

## Folder Philosophy

* Frontend mirrors backend modules
* Dashboards compose modules
* Modules own domain logic
* UI layer remains reusable and headless

---

# 3️⃣ Project Stations Overview

---

# 🟢 Station 0 – Project Bootstrap

**Goal:** Setup base app + PWA readiness
**Status:** ✅ Completed

### Completed

* [x] Vite + React + TypeScript
* [x] ESLint + Prettier
* [x] PWA plugin setup
* [x] Toast system (react-hot-toast)
* [x] Breakpoints defined
* [x] App shell renders

---

# 🟢 Station 1 – App Foundation

**Goal:** Application infrastructure
**Status:** ✅ Completed

### Execution Order

1. AppProviders
2. Redux skeleton
3. Theme skeleton
4. Routes
5. Guards
6. AppShell layout
7. Placeholder pages

### Completed

* [x] Redux store
* [x] Routing structure
* [x] RequireAuth guard
* [x] RequireRole guard (temporary)
* [x] AppShell
* [x] Login & NotFound

---

# 🟢 Station 2 – API Client & Auth

**Goal:** Secure API foundation
**Status:** ✅ Completed

### Architecture

* Central axios instance
* Auth interceptor
* Company interceptor
* 401 refresh flow with retry queue
* `/auth/me` bootstrap on app load

### Completed

* [x] Axios base client
* [x] Request interceptors
* [x] Response interceptor
* [x] Refresh flow
* [x] Auth API layer
* [x] Auth slice
* [x] Bootstrap hook
* [x] Guard wiring

---

# 🟢 Station 3 – Design System

**Goal:** Stable, scalable UI system
**Status:** ✅ Completed

### Decisions

* `theme.ts` is single source of truth for colors
* CSS variables used for spacing/shadow/radius only
* No CSS vars inside MUI palette (runtime issue)
* Responsive helpers in `utils/responsive.ts`

### Completed

* [x] style-vars.css
* [x] MUI theme mapping
* [x] Responsive utilities
* [x] Base UI components (Button, Card, Container, Modal, Typography, Table, Form)
* [x] Breakpoint validation

---

# 🟢 Station 4 – Attendance (Geo Domain)

**Status:** Logic complete | UI pending

⚠️ Important: Attendance domain exists but admin UI not yet surfaced.

### Execution

1. Geo wrapper
2. Geo error mapping
3. Attendance API
4. Attendance slice
5. Hooks
6. Validation logic

### Completed

* [x] Geo utilities
* [x] Error mapping
* [x] Attendance API
* [x] Redux slice
* [x] Check-in/out hooks
* [x] Edge case handling

---

# 🟡 Station 5 – Dashboards (In Progress)

Structure:

* Phase 5.1 – Employee Dashboard
* Phase 5.2 – Company Admin / HR Dashboard
* Phase 5.3 – Super Admin Dashboard

---

# Phase 5.1 – Employee Dashboard

Status: ✅ Completed

### Scope

* Self profile
* Hierarchy view
* Leave visibility (team + manager)
* Responsive layout

### Completed

* [x] Domain types
* [x] Employee API
* [x] Employee slice
* [x] Hooks
* [x] Bootstrap
* [x] Hierarchy builder
* [x] ProfileCard
* [x] ManagerCard
* [x] PeerList
* [x] ReporteeList
* [x] LeaveStatusBadge
* [x] Mobile/tablet/desktop polish

---

# Phase 5.2 – Company Admin / HR Dashboard

Status: 🟡 In Progress

### Step 1 – Admin Route & Shell

* [x] /admin route
* [x] CompanyAdminDashboard shell

---

### Step 2 – Employee List (Read-Only)

* [x] Admin hook (no Redux)
* [x] Default active filter
* [x] Optional inactive toggle
* [x] Mobile card view
* [x] Desktop table view
* [x] Loading & error states
* [x] Employee types aligned
* [x] Removed admin-specific domain types

---

### Step 3 – Admin Employee Profile (Pending)

#### Planned Scope

* [ ] Fetch employee by ID
* [ ] Profile view
* [ ] Edit modal (HR/Admin)
* [ ] Active/inactive toggle
* [ ] Hierarchy panel
* [ ] Attendance summary (read-only)
* [ ] Leave summary (read-only)
* [ ] Navigation back to list

#### Important Design Decisions

* Profile edits allowed
* Role change allowed
* Role change is separate action (not inline)
* Confirmation required
* Promotion of job ≠ promotion of system role
* HR cannot change roles
* COMPANY_ADMIN can change roles
* SUPER_ADMIN manages companies only

---

### Step 4–7 (Pending)

* [ ] Leave approvals
* [ ] Attendance management
* [ ] Holidays CRUD
* [ ] Org structure management

---

# 🔐 Authorization Architecture Refactor (Critical Shift)

## Current State

Frontend uses enum-based roles:

```ts
type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'HR'
  | 'EMPLOYEE'
```

Guard:

```tsx
<RequireRole roles={['HR', 'COMPANY_ADMIN']} />
```

### Problem

* UI coupled to role names
* Not SaaS scalable
* No granular permission control
* Adding roles = rewrite

---

# 🎯 Strategic Decision

Move to permission-based authorization abstraction.

Frontend will stop checking roles directly.

---

# New Authorization Model

## Permission Namespaced System

Examples:

```
employee.view
employee.edit
employee.role.change
leave.approve
attendance.override
org.manage
holiday.manage
company.manage
```

---

## Temporary Adapter

Frontend will define:

```ts
ROLE_PERMISSION_MAP
```

Later replaced with:

```ts
user.permissions[]
```

No UI rewrite needed.

---

## New Guard Pattern

Replace:

```
<RequireRole />
```

With:

```
<RequirePermission permission="leave.approve" />
```

And:

```
hasPermission(user, 'employee.edit')
```

---

# 🚫 Hard Rule

Never check:

```ts
user.role === 'HR'
```

Role enum becomes adapter only.

All UI must use permission abstraction.

---

# Backend RBAC Migration Plan (Future)

After dashboards complete:

Backend will introduce:

* Role table
* Permission table
* RolePermission join
* UserRole join
* `/auth/me` returns permissions array

Frontend deletes ROLE_PERMISSION_MAP.

Zero UI rewrite required.

---

# 🟡 Station 6 – Admin UI Surface

Purpose: Ensure no headless features exist.

## Phase 6.1 – Admin Employee Profile Visible

* [ ] Route renders
* [ ] UI visible in browser
* [ ] Edit modal works
* [ ] Active toggle works
* [ ] Attendance summary visible
* [ ] Leave summary visible

---

## Phase 6.2 – Leave & Attendance UI

* [ ] Leave approvals visible
* [ ] Approve/reject works
* [ ] Attendance overview visible
* [ ] Attendance override UI wired

---

## Phase 6.3 – Org & Holidays UI

* [ ] Holiday CRUD visible
* [ ] Department/team/designation UI visible
* [ ] Org navigable

---

# ⏸ Station 7 – Super Admin Dashboard

Not started.

---

# ⏸ Station 8 – UX & Hardening

* Loading skeletons
* Error boundaries
* Accessibility pass
* Empty states polish
* Mobile ergonomics refinement

---

# ⏸ Station 9 – PWA Hardening

* Offline handling
* Install prompt
* Lighthouse optimization

---

# 🧠 Current Project State Snapshot

* Repo: `hrms-fe`
* Backend URL: `http://localhost:4000`
* Auth: JWT + Refresh token (cookie)
* Company isolation: `x-company-id`
* Attendance logic: implemented
* Admin UI: partially surfaced
* Authorization: migrating to permission abstraction
* RBAC backend: planned post-dashboard

---

# 🔎 What Is Immediately Pending

1. Implement permission abstraction layer.
2. Finish Phase 5.2 Step 3 (Admin Employee Profile).
3. Surface admin-facing attendance & leave panels.
4. Replace RequireRole with RequirePermission.

---