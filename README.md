# hrms-fe
Frontend repo for HRMS platform, using React typescript redux and MaterialUI 
src/
├── api/
│   ├── client.ts
│   ├── auth.api.ts
│   ├── employee.api.ts
│   ├── attendance.api.ts
│   ├── leave.api.ts
│   └── organization.api.ts
├── app/
│   ├── App.tsx
│   ├── AuthBootstrap.tsx
│   └── routes.tsx
├── components/
│   ├── AppShell.tsx
│   ├── DataTable.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   └── LoadingState.tsx
├── guards/
│   ├── RequireAuth.tsx
│   └── RequirePermission.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useEmployee.ts
│   ├── useAttendance.ts
│   ├── useLeave.ts
│   └── usePermission.ts
├── pages/
│   ├── AuthGate.tsx
│   ├── Login.tsx
│   ├── EmployeeDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── AdminEmployeeList.tsx
│   ├── AdminEmployeeProfile.tsx
│   ├── SuperAdminDashboard.tsx
│   └── NotFound.tsx
├── store/
│   ├── store.ts
│   └── auth.slice.ts
├── styles/
│   ├── theme.ts
│   ├── style-vars.css
│   └── globals.css
├── types/
│   ├── auth.types.ts
│   ├── employee.types.ts
│   ├── attendance.types.ts
│   ├── leave.types.ts
│   ├── organization.types.ts
│   └── company.types.ts
├── utils/
│   ├── permissions.ts
│   ├── geo.ts
│   ├── geoPolicy.ts
│   ├── responsive.ts
│   └── dashboard.ts
└── main.tsx

# HRMS Frontend – Coding Journal

## 📌 Project Overview
A production-grade HRMS frontend built with:
- React 18 + Vite
- TypeScript (strict)
- Redux Toolkit + RTK Query
- Material UI + Custom CSS variables
- PWA-first (mobile-friendly always)
- Role-based dashboards
- Geo-location based attendance

Backend: Custom HRMS API (Node.js, Prisma)

---

## 🧱 Core Principles (Non-Negotiable)

- Mobile-first, PWA-ready
- 3 breakpoints ONLY:
  - Mobile
  - Tablet
  - Desktop
- UI components are:
  - Flexible
  - Prop-driven
  - No hardcoded styles
- Redux ONLY for global state
- API calls ONLY via centralized client
- Folder structure mirrors backend modules

---

## 🚉 Project Stations & Status

### 🟢 Station 0 – Project Bootstrap
**Goal:** Initialize project, install dependencies, PWA-ready setup

Status: ✅ Completed

Tasks:
- [x] Create Vite + React + TypeScript app
- [x] Install core dependencies
- [x] Setup ESLint + Prettier
- [x] Toast feedback system added (react-hot-toast)
- [x] Setup PWA plugin
- [x] Define breakpoints strategy
- [x] App shell renders successfully

---

### ⏳ Station 1 – App Foundation
Status:  ✅ Completed
execution order:
🔄 Execution Order (STRICT) checklist:
- [x] 1. AppProviders
- [x] 2. Redux skeleton
- [x] 3. Theme skeleton
- [x] 4. Routes
- [x] 5. Guards
- [x] 6. AppShell - Layout // components/layout/AppShell/AppShell.tsx
- [x] 7. Placeholder pages (Login, NotFound)

---


### ⏳ Station 2 – API Client & Auth
Status: ✅ Completed

Execution Order:
1. Axios base client
2. Request interceptors (auth, company)
3. Response interceptor (401 refresh)
4. Auth API layer
5. Auth Redux slice
6. /auth/me bootstrap
7. Guard wiring to real auth & company state

Checklist:
- [x] Axios client created
- [x] Auth interceptor added
- [x] Company interceptor added
- [x] Response interceptor added (401 refresh & retry)
- [x] Refresh-token flow implemented
- [x] Auth API layer completed
- [x] Auth slice wired
- [x] /auth/me bootstrap implemented
- [x] Guards wired to real auth & company state

---

### ⏳ Station 3 – Design System
Status: ✅ Completed

Design tokens file renamed to `style-vars.css`
Reason: clearer intent 

Execution Order:
1. Global CSS tokens
2. MUI theme mapping
3. Responsive utilities
4. Base UI components
5. Design system validation

*Note* Design decision:
- MUI theme is the single source of truth for colors
- CSS variables are used only for spacing, radius, shadow, motion
- Avoid CSS variables in MUI palette (runtime limitation)


responsive utility example usage:
import { useIsMobile } from '../../utils/responsive'

const Example = () => {
  const isMobile = useIsMobile()
  return <div>{isMobile ? 'Mobile' : 'Not Mobile'}</div>
}


Checklist:

- [x] Global style variables created (`style-vars.css`)
- [x] Style variables mapped to MUI theme
- [x] Responsive utilities added (mobile/tablet/desktop helpers)
- [x] Base UI components created (Button, Card, Container, Modal, Typography)
- [x] Form UI primitive added
- [x] Table UI primitive added

- [x] Design system validated across breakpoints (mobile / tablet / desktop sanity checks + rules)

---

### ⏳ Station 4 – Attendance (Geo)
Status: ⏳ In-Progress
(logic mostly done, UI surfacing pending)
⚠️ Note for LLMs: Attendance domain is implemented, but admin-facing UI is not yet surfaced

 Execution Order (STRICT)
  1. Geo-location utilities (browser API wrapper)
  2. Geo permission & error handling
  3. Attendance API layer
  4. Attendance Redux slice
  5. Attendance hooks (check-in / check-out)
  6. Attendance state  Validation & edge cases 

Checklist:
- [x] Geo utilities created
- [x] Geo permission & error handling strategy defined
- [x] Attendance API layer created (typed, backend-aligned)
- [x] Attendance Redux slice created and wired
- [x] Attendance hooks implemented (check-in, check-out, selectors)
- [x] Attendance validation rules defined
- [x] Edge cases handled (double check-in, invalid check-out, geo failure)

Attendance hooks corrected:
- Removed conditional returns from hooks
- Moved validation into callbacks
- Prevented Redux dispatch during render


---

### ⏳ Station 5 – Dashboards
Status: ⏳ In Progress

Structure:
- Phase 5.1 – Employee Dashboard (core)
- Phase 5.2 – Company Admin / HR Dashboard
- Phase 5.3 – Super Admin Dashboard

#### Phase 5.1 - Employee Profile Dashboard
  Execution Order – Phase 5.1 (STRICT)
  0. Employee domain types (visibility-safe models)
  1. Employee API layer
  2. Employee Redux slice
  3. Employee hooks
  4. EmployeeDashboard layout (NO styling polish)
  5. Profile & hierarchy components
  6. Leave-status integration (read-only)

Checklist:
- [x] Employee domain types defined (visibility-safe)
- [x] Employee API layer created (getMe, getById, list)
- [x] Employee Redux slice created and wired
        Employee slice cleanup:
          - Removed unused EmployeeMini import
          - Slice depends only on profile + hierarchy contracts
- [x] Employee hooks implemented
- [x] Profile + hierarchy derived in hooks
- [x] Bootstrap logic added
- [x] EmployeeDashboard layout created
- [x] Bootstrap wired
- [x] Profile & hierarchy data rendered (skeleton)
- [x] ProfileCard extracted
- [x] ManagerCard extracted
- [x] PeerList extracted
- [x] ReporteeList extracted
- [x] LeaveStatusBadge added
- [x] EmployeeDashboard refactored to components
- [x] Leave-status read-only integration completed
- [x] Team & hierarchy leave visibility enabled
      Leave API fix:
      - Updated getToday to accept scope parameter
      - Synced frontend with backend /api/leaves/today contract
- [x] Brand color palette finalized
- [x] Applied centrally via MUI theme
- [x] EmployeeDashboard layout refined
- [x] Mobile-first card stacking implemented
- [x] Responsive grid added for tablet/desktop
- [x] Visual hierarchy improved
- [x] Card headers standardized
- [x] Mobile density optimized
- [x] Loading state polished
- [x] Error state clarified
- [x] Empty states made user-friendly
- [x] Touch-friendly spacing applied
- [x] Card inner padding standardized
- [x] Mobile ergonomics improved

#### Phase 5.2 - CompanyAdmin/HR Dashboard  
🔄 Execution Order (STRICT)
  Step 1. Admin/HR route & dashboard shell 
  Step 2. Employee list (read-only)
  Step 3. Employee profile view (admin perspective)
  Step 4. Leave approvals (read-only → approve/reject)
  Step 5. Attendance overview + overrides
  Step 6. Holidays CRUD
  Step 7. Org structure (dept / team / designation)
  ✅ Meaning: APIs, hooks, types, routing contracts exist.
Checklist:
      Auth typing:
      - UserRole union added to auth/types.ts
      - auth.user.role is now strongly typed

- [x] Admin/HR routes & dashboard shell
      Phase 5.2 – Step 2.2:
      - Admin employee list hook added (modules/employee/hooks.admin.ts)
      - Default filter: active employees
      - Optional toggle to include inactive employees
      - No Redux used (read-only)
      Design note:
      - Admin employee list reuses employee domain APIs (`modules/employee`)
      - No admin-specific backend endpoints introduced


- [x] Employee list (read-only)

      - Default admin view shows active employees
      - Inactive employees available via filter toggle
      Admin refactor follow-up:
      - Removed admin-owned domain types
      - Admin employee view types moved to employee module
      - Admin treated strictly as a dashboard/composition layer
      Employee types refinement:
      - Added isActive to EmployeeMini (admin filtering)
      - Standardized team naming
      - Added employeeCode to EmployeeProfile
      - Removed unused EmployeeStatus enum
      - Kept admin-only types out of domain
      Phase 5.2 – Step 2.3:
      - Admin employee list UI created
      - Mobile card view implemented
      - Tablet/Desktop table view implemented
      - Active/inactive toggle wired
      - Loading, error, empty states handled
      Table usage fix:
      - Aligned EmployeeList usage with Table API
      - Replaced `columns` with `headers`

      Design decision:
      - Admin Employee Profile wires all major management actions early
     Admin Employee Profile – Scope Clarification:
      - Profile viewing and editing enabled for HR/Admin
      - Activation/deactivation enabled
      - Hierarchy visible (read-only)
      - Attendance and leave data visible (read-only)
      - Role changes, manager reassignment, attendance overrides, and leave approvals are deferred to their dedicated steps to avoid cross-domain coupling
    Role management decision:
      - User role changes are supported in admin profile
      - Role change is NOT part of profile edit form
      - Exposed as a dedicated admin action with confirmation
      - Prevents accidental privilege escalation
      - Aligns with auth guards & JWT refresh flow
        SUPER_ADMIN → manages companies
        COMPANY_ADMIN → manages company users & roles
        HR → manages employee HR data (not roles)
        Promotion of job ≠ promotion of system role
---
#### Journal Update at this point
Below is a **drop-in journal update** that clearly explains:

* Current role-based system
* Why we are changing it
* How we are changing it
* What remains temporary
* What must never be done again
* How future backend RBAC migration will work

This will make future LLM context almost foolproof.

---

# 🔐 Authorization Architecture Refactor (Pre-RBAC Abstraction)

## 🚨 Current State (Before Refactor)

Authorization is currently **role-based only**.

### Role Source

Defined in:

```
src/modules/auth/types.ts
```

```ts
export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'HR'
  | 'EMPLOYEE'
```

### Role Guard

Implemented in:

```
src/middlewares/RequireRole.tsx
```

Used in:

```
src/app/routes.tsx
```

Example:

```tsx
<RequireRole roles={['HR', 'COMPANY_ADMIN']}>
  <CompanyAdminDashboard />
</RequireRole>
```

### Problem With This Approach

* UI directly depends on enum roles.
* Business logic is coupled to role names.
* Adding new roles later causes UI rewrite.
* Granular permissions (SaaS-ready) are not possible.
* Scaling beyond 4 roles becomes messy.

---

# 🎯 Strategic Decision

We will move to:

## ✅ Permission-Based Authorization (Namespaced Model)

Even though backend still uses enum roles.

Frontend will stop checking roles directly.

Instead, it will check **permissions**.

---

# 🧠 New Authorization Model (Frontend Layer)

## 1️⃣ Permission Type (Namespaced)

Permissions will use dot-notation for scalability:

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

This structure scales to 50+ permissions cleanly.

---

## 2️⃣ Temporary Role → Permission Mapping Adapter

Internally we will define:

```ts
ROLE_PERMISSION_MAP: Record<UserRole, Permission[]>
```

Example:

```ts
COMPANY_ADMIN → [
  'employee.view',
  'employee.edit',
  'employee.role.change',
  'leave.approve',
  'attendance.override',
  'org.manage',
  'holiday.manage',
]
```

This mapping is temporary.

Later it will be replaced by:

```ts
user.permissions[] coming from backend
```

UI code will not change.

---

## 3️⃣ New Guard Pattern

Instead of:

```
<RequireRole roles={['HR']} />
```

We will use:

```
<RequirePermission permission="leave.approve" />
```

And:

```
hasPermission(user, 'employee.edit')
```

---

# 🚫 Hard Rule From This Point Forward

Never check:

```ts
user.role === 'HR'
```

Never introduce new `<RequireRole>` usage.

Role enum becomes internal-only adapter.

All UI must use permission abstraction.

---

# 🏗 Backend Migration Plan (Future – Post Dashboard Completion)

After dashboards are complete:

Backend will migrate to:

* Role table
* Permission table
* RolePermission join
* UserRole join
* `/auth/me` returns permissions array

Example future response:

```json
{
  "id": "uuid",
  "role": "HR",
  "permissions": [
    "employee.view",
    "employee.edit",
    "leave.approve"
  ]
}
```

Frontend will:

* Delete ROLE_PERMISSION_MAP
* Read permissions from JWT/me response
* No UI rewrite needed

---

# 🧠 Why We Are Delaying Backend RBAC

* Faster dashboard delivery
* Reduced context switching
* No production DB concerns
* Clean abstraction avoids future rewrite
* SaaS-ready without blocking progress

---

# 🔄 Refactor Impact Scope

This change affects:

* Route guards
* Navigation visibility
* Admin profile role change control
* Leave approval visibility
* Attendance override visibility
* Super admin features

This is a foundational shift.

---

# 🧭 Current Authorization Status

| Layer                      | Status                                    |
| -------------------------- | ----------------------------------------- |
| Backend                    | Enum roles only                           |
| Frontend                   | Migrating to permission abstraction       |
| UI checks                  | Moving from role-based → permission-based |
| RBAC DB tables             | Not implemented yet                       |
| Migration complexity later | Minimal                                   |

---

# 📌 Important LLM Context

If assisting in future:

* Do NOT suggest role checks.
* Always use permission abstraction.
* Assume role enum is transitional.
* Permission namespace must follow dot-notation.
* Do not create new role enums.

---
---
Continuation of station 5 Phase 2 
- [ ] Employee profile (admin view)
      Step 3.1 Admin employee fetch (by ID)
      Step 3.2 Profile view + basic edits (HR/Admin)
      Step 3.3 Active/inactive toggle
      Step 3.4 Org & hierarchy panel
      Step 3.5 Attendance panel (read-only + disabled overrides)
      Step 3.6 Leave panel (read-only)
      Step 3.7 Route integration from employee list

- [ ] Leave approvals
- [ ] Attendance management
- [ ] Holiday management
- [ ] Organization structure

---

### Station 6 - Admin UI Surface
Status: ⏸ NOT STARTED
  Purpose:
    Ensure no “headless” features exist
    Catch UX & data bugs early
    Align LLM understanding with reality

#### Phase 6.1 – Admin Employee Profile UI (VISIBLE)

This is where your current missing piece goes.

Checklist:

- [ ]  Route /admin/employees/:employeeId renders
- [ ]  Employee profile visible in browser
- [ ]  Admin-specific layout (denser than employee)
- [ ]  Profile edit UI rendered (HR/Admin)
- [ ]  Active/inactive toggle works
- [ ]  Org & hierarchy panels visible
- [ ]  Attendance summary visible
- [ ]  Leave summary visible
- [ ]  Navigation back to list works

📌 This explicitly solves your concern:
“employee profile UI wiring is still pending”

#### Phase 6.2 – Admin Leave & Attendance UI

Checklist:

- [ ]  Leave approvals visible
- [ ]  Approve / reject actions functional
- [ ]  Attendance overview visible
- [ ]  Attendance overrides UI wired

#### Phase 6.3 – Admin Org & Holidays UI

Checklist:

- [ ] Holiday CRUD visible
- [ ] Department / team / designation UI visible
- [ ] Org structure navigable

---
### Station 7 - Super Admin Dashboard
Status: ⏸ NOT STARTED
---

### Station 8 - UX, Polish and Hardening
Status: ⏸ NOT STARTED
Loading skeletons
Error boundaries
Empty states
Mobile ergonomics
Accessibility pass

---
### ⏳ Station 9 – PWA Hardening
Status: ⏸ NOT STARTED

- Offline handling
- Install prompt
- Lighthouse optimization

---

## 🧠 Context Snapshot (Always Update)
- Repo: hrms-fe
- Backend URL: http://localhost:4000
- Auth: JWT + Refresh Token (cookie)
- Company isolation via `x-company-id`
- Lighthouse optimization (at end)

Authorization strategy:

* Frontend uses permission abstraction
* Backend still uses enum roles (temporary)
* RBAC migration planned after dashboard completion

Last Updated: Station 5 Phase 2 – Authorization Refactor Planned










### test design template 
```
import { Box } from '@mui/material'
import Button from '../components/ui/Button/Button'
import Card from '../components/ui/Card/Card'
import Container from '../components/ui/Container/Container'
import Modal from '../components/ui/Modal/Modal'
import Typography from '../components/ui/Typography/Typography'
import Form from '../components/ui/Form/Form'
import Table from '../components/ui/Table/Table'
import { useState } from 'react'

const DesignSystemPreview = () => {
  const [open, setOpen] = useState(false)

  return (
    <Container>
      <Typography variant="h5" mb={2}>
        Design System Preview
      </Typography>

      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Modal
      </Button>

      <Box mt={3}>
        <Card
          header={<Typography fontWeight={600}>Card Header</Typography>}
          footer={<Typography variant="caption">Card Footer</Typography>}
          sx={{ p: 'var(--space-4)' }}
        >
          <Typography>
            This card uses only tokens + theme.
          </Typography>
        </Card>
      </Box>

      <Box mt={4}>
        <Form>
          <Button variant="outlined">Submit</Button>
        </Form>
      </Box>

      <Box mt={4}>
        <Table
          headers={['Name', 'Role']}
          rows={[
            ['Alice', 'HR'],
            ['Bob', 'Employee'],
          ]}
        />
      </Box>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Typography>Modal Content</Typography>
      </Modal>
    </Container>
  )
}

export default DesignSystemPreview
```
