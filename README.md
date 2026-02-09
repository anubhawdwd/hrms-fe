# hrms-fe
Frontend repo for HRMS platform, using React typescript redux and MaterialUI 

hrms-fe/
├─ public/
│
├─ src/
│  ├─ app/
│  │  ├─ App.tsx                  # root app
│  │  ├─ AppProviders.tsx         # Redux, Router, Theme
│  │  └─ routes.tsx               # route definitions only
│  │
│  ├─ config/                     # mirrors backend /config
│  │  ├─ env.ts                   # env-safe access
│  │  └─ constants.ts             # roles, enums, static keys
│  │
│  ├─ middlewares/                # frontend guards 
│  │  ├─ RequireAuth.tsx
│  │  ├─ RequireRole.tsx
│  │  └─ RequireCompany.tsx
│  │
│  ├─ modules/                  
│  │
│  │  ├─ auth/
│  │  |  ├─ pages/
│  │  |  |  └─LoginPage.tsx
│  │  │  ├─ api.ts                # login, refresh, me
│  │  │  ├─ slice.ts              # authSlice
│  │  │  ├─ selectors.ts
│  │  │  ├─ types.ts
│  │  │  └─ hooks.ts
│  │  │
│  │  ├─ company/
│  │  │  ├─ api.ts
│  │  │  ├─ slice.ts
│  │  │  ├─ types.ts
│  │  │  └─ pages/
│  │  │
│  │  ├─ organization/
│  │  │  ├─ api.ts
│  │  │  ├─ types.ts
│  │  │  └─ pages/
│  │  │
│  │  ├─ employee/
│  │  │  ├─ api.ts
│  │  │  ├─ slice.ts
│  │  │  ├─ types.ts
│  │  │  └─ pages/
│  │  │
│  │  ├─ attendance/
│  │  │  ├─ api.ts
│  │  │  ├─ slice.ts
│  │  │  ├─ hooks.ts              # useCheckIn, useCheckOut
│  │  │  └─ types.ts              
│  │  │
│  │  ├─ leave/
│  │  │  ├─ api.ts
│  │  │  ├─ slice.ts
│  │  │  ├─ types.ts
│  │  │  └─ pages/
│  │  │
│  │  └─ audit/                   # future-proof
│  │
│  ├─ dashboards/                 # role-based composition
│  │  ├─ super-admin/
│  │  ├─ company-admin/
│  │  └─ employee/
│  │
│  ├─ components/
│  │  ├─ ui/                      # headless, reusable
│  │  │  ├─ Card/
│  │  |  |  └─ Card.tsx
│  │  │  ├─ Button/
│  │  |  |  └─ Button.tsx
│  │  │  ├─ Container
│  │  |  |  └─ Container.tsx
│  │  │  ├─ Modal/
│  │  |  |  └─ Modal.tsx
│  │  │  ├─ Typography
│  │  |  |  └─ Typography.tsx
│  │  │  ├─ Table/
│  │  |  |  └─ Table.tsx
│  │  │  └─ Form/
│  │  |       └─Form.tsx
│  │  │
│  │  ├─ layout/                  # shell components
│  │  │  ├─ AppShell/
│  │  │  ├─ Sidebar/
│  │  │  └─ Header/
│  │  │
│  │  └─ feedback/
│  │     ├─ Notfound.tsx
│  │     ├─ Toast/
│  │     └─ Dialog/
│  │
│  ├─ lib/                        # backend /utils equivalent
│  │  ├─ api/
│  │  │  ├─ apiClient.ts
│  │  │  ├─ auth.interceptor.ts
│  │  │  ├─ company.interceptor.ts
│  │  │  └─ error.interceptor.ts
│  │  │
│  │  ├─ storage.ts               # memory helpers
│  │  └─ logger.ts
│  │
│  ├─ store/                      # Redux root
│  │  ├─ store.ts
│  │  └─ rootReducer.ts
│  │
│  ├─ styles/                     # 🔥 design system
│  │  ├─ style-vars.css
│  │  ├─ globals.css
│  │  ├─ theme.ts                 # MUI theme (all colors here)
│  │  └─ mui-overrides.css
│  │
│  ├─ utils/                      # mirrors backend /utils
│  │  ├─ geo.ts
│  │  ├─ geoPolicy.ts           # helper that maps GeoError
│  │  ├─ date.ts
│  │  ├─ responsive.ts             # replaces media-querry
│  │  └─ permissions.ts
│  │
│  ├─ types/
│  │  ├─ api.ts                   # shared API DTOs
│  │  └─ common.ts
│  │
│  ├─ main.tsx
│  └─ vite-env.d.ts
│
├─ .env
├─ tsconfig.json
├─ package.json
├─ vite.config.ts
└─ README.md


##🔁 Backend ↔ Frontend Mapping (Mental Model)
| Backend         | Frontend                    |
| --------------- | --------------------------- |
| `modules/*`     | `modules/*`                 |
| `controller.ts` | `api.ts`                    |
| `service.ts`    | `hooks.ts / slice.ts`       |
| `repository.ts` | `RTK Query cache`           |
| `middlewares/`  | `RequireRole / RequireAuth` |
| `utils/geo.ts`  | `utils/geo.ts`              |
| `types.ts`      | `types.ts`                  |




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
Status: ⏸ NOT STARTED

- Super Admin
- Company Admin / HR
- Employee

---

### ⏳ Station 6 – PWA Hardening
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

Last Updated: Station 0 started

- Lighthouse optimization

---

## 🧠 Context Snapshot (Always Update)
- Repo: hrms-fe
- Backend URL: http://localhost:4000
- Auth: JWT + Refresh Token (cookie)
- Company isolation via `x-company-id`

Last Updated: Station 0 started










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
