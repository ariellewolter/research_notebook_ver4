# 🧪 Research Notebook App

---

## 🚀 Quick Start Guide

### 1. **Install Required Dependencies**
- **Node.js** (v18 or higher): [Download Node.js](https://nodejs.org/)
- **pnpm** (recommended):
  ```bash
  npm install -g pnpm
  ```
- **Git**: [Download Git](https://git-scm.com/)

### 2. **Clone the Repository**
```bash
git clone https://github.com/ariellewolter/research_notebook_ver4.git
cd research_notebook_ver4
```

### 3. **Install Project Dependencies**
```bash
pnpm install
```

### 4. **Set Up the Database**
```bash
cd apps/backend
pnpm exec prisma migrate dev --name init
```

### 5. **Start the App**
- **Backend:**
  ```bash
  pnpm dev
  ```
- **Frontend:** (in a new terminal)
  ```bash
  cd apps/frontend
  pnpm dev
  ```
- Open your browser to [http://localhost:5180](http://localhost:5180)
- **Calendar Setup:** Go to the Settings page to connect your Google, Outlook, or Apple Calendar.

### 6. **Environment Variables (Optional)**
Create a `.env` file in `apps/backend/` for custom DB or Zotero integration (see below for details).

### 7. **Data Storage**
- All data is stored locally in `apps/backend/prisma/dev.db` (SQLite).
- Uploaded files (PDFs, etc.) are stored in `apps/backend/uploads/`.
- To move your data to another computer, copy these files/directories.

---

## 📦 Downloading and Using Release Artifacts

You can download pre-built frontend and backend artifacts from the [Releases page](https://github.com/ariellewolter/research_notebook_ver4/releases) for each version.

### **How to Use Release Artifacts**

1. **Download the latest release** from the [Releases page](https://github.com/ariellewolter/research_notebook_ver4/releases).
2. **Unzip both files:**
   - `frontend-dist.zip` (contains the production-ready frontend)
   - `backend-src.zip` (contains backend source, migrations, and config)
3. **Install dependencies:**
   - For the backend, run:
     ```bash
     cd backend-src
     pnpm install
     pnpm exec prisma migrate dev --name init
     pnpm dev
     ```
   - For the frontend, you can serve the static files in `dist/` using any static server (e.g., [serve](https://www.npmjs.com/package/serve)):
     ```bash
     npm install -g serve
     serve dist
     ```
   - Or, for development, use the full source from the repo as described above.

**Note:** The backend still requires Node.js, pnpm, and a database (SQLite by default). See the Quick Start Guide for details.

---

A modular, extensible research notebook built for PhD-level scientific workflows. Designed to unify experimental records, literature insights, protocols, biochemical entities, and cross-linked knowledge into one centralized platform.

---

## 🛠️ Tech Stack

### **Backend**
- **Node.js** with **Express.js** - RESTful API server
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database management and migrations
- **SQLite** - Local database storage (easily switchable to PostgreSQL)
- **Zod** - Runtime type validation and schema definition
- **Multer** - File upload handling for PDFs
- **Axios** - HTTP client for Zotero API integration

### **Frontend** (In Development)
- **React 18** with **TypeScript** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React PDF** - PDF viewing and annotation

### **Development Tools**
- **pnpm** - Fast, disk space efficient package manager
- **ESLint** & **Prettier** - Code quality and formatting
- **ts-node-dev** - TypeScript development server

---

## 📁 Project Structure Overview

```
notebook-notion-app/
├── apps/
│   ├── backend/                 # Express.js API server
│   │   ├── src/
│   │   │   ├── routes/          # API route handlers
│   │   │   │   ├── health.ts    # Health check endpoint
│   │   │   │   ├── notes.ts     # Notes CRUD operations
│   │   │   │   ├── projects.ts  # Projects & experiments
│   │   │   │   ├── pdfs.ts      # PDF upload & management
│   │   │   │   ├── database.ts  # Database entries (chemicals, genes, etc.)
│   │   │   │   ├── links.ts     # Cross-linking system
│   │   │   │   └── zotero.ts    # Zotero API integration
│   │   │   └── app.ts           # Express app configuration
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   └── uploads/             # PDF file storage
│   └── frontend/                # React frontend (in development)
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── hooks/           # Custom React hooks
│       │   ├── utils/           # Utility functions
│       │   └── App.tsx          # Main app component
│       └── index.html
├── packages/
│   └── shared/                  # Shared types and utilities
└── pnpm-workspace.yaml          # Monorepo configuration
```

---

## ✨ Implemented Features

### **✅ Backend API (Complete)**
- **Notes Management** - Daily notes, experiment notes, literature notes with full CRUD
- **Projects & Experiments** - Hierarchical organization with cascading relationships
- **PDF Management** - Upload, store, and serve PDF files with highlight support
- **Database Entries** - Notion-like database for chemicals, genes, growth factors, protocols
- **Cross-linking System** - Obsidian-style bidirectional linking between all entities
- **Zotero Integration** - Full API integration for importing references and PDFs

### **🔄 Frontend (In Development)**
- **React App Setup** - Basic structure with Vite and TypeScript
- **Component Architecture** - Planned modular feature-based structure
- **UI Framework** - Ready for Tailwind CSS integration

---

## 🗓️ Calendar Integrations (NEW)

### Google Calendar Integration
- Per-user OAuth2 authentication: Each user enters their own Google API credentials in the app settings.
- Bi-directional sync: Sync events between the app and selected Google Calendars.
- Calendar selection: Choose which Google Calendars to sync.
- Event creation: Add, edit, and delete events in both the app and Google Calendar.
- Secure token storage: OAuth tokens are stored per user in the database.

### Outlook Calendar Integration
- Per-user OAuth2 authentication: Each user enters their own Microsoft API credentials in the app settings.
- Bi-directional sync: Sync events between the app and selected Outlook Calendars.
- Calendar selection: Choose which Outlook Calendars to sync.
- Event creation: Add, edit, and delete events in both the app and Outlook Calendar.
- Secure token storage: OAuth tokens are stored per user in the database.

### Apple Calendar Integration
- ICS feed export: Export all research events (experiments, protocols, tasks, notes) as an ICS file.
- One-way sync: Import the ICS file into Apple Calendar for read-only access to research events.

### Settings Page
- New sections for Google, Outlook, and Apple Calendar: Enter credentials, connect/disconnect, select calendars, and export ICS.
- Step-by-step instructions for obtaining API credentials for both Google and Microsoft.

### Backend
- New endpoints for Google and Outlook OAuth2 flows, calendar listing, event sync, and ICS export.
- Prisma schema updated: User model now includes fields for Google and Outlook credentials and tokens.
- Database migration: Run `pnpm exec prisma migrate dev --name add_outlook_calendar_fields` to update your schema.

### Frontend
- Modern Material-UI UI for all calendar integrations.
- Calendar management: View, connect, and manage all external calendar integrations from the Settings page.

---

## Example API Endpoints (NEW)

- `POST /api/auth/user/google-credentials` — Save Google API credentials
- `GET /api/auth/user/google-credentials` — Retrieve Google API credentials
- `POST /api/auth/user/outlook-credentials` — Save Outlook API credentials
- `GET /api/auth/user/outlook-credentials` — Retrieve Outlook API credentials
- `GET /api/calendar/google/auth` — Start Google OAuth2 flow
- `GET /api/calendar/google/callback` — Google OAuth2 callback
- `GET /api/calendar/google/calendars` — List Google Calendars
- `POST /api/calendar/google/sync` — Sync Google Calendar events
- `POST /api/calendar/google/events` — Create Google Calendar event
- `GET /api/calendar/outlook/auth` — Start Outlook OAuth2 flow
- `GET /api/calendar/outlook/callback` — Outlook OAuth2 callback
- `GET /api/calendar/outlook/calendars` — List Outlook Calendars
- `POST /api/calendar/outlook/sync` — Sync Outlook Calendar events
- `POST /api/calendar/outlook/events` — Create Outlook Calendar event
- `GET /api/calendar/apple/ics` — Export all events as ICS for Apple Calendar

---

## How to Use Calendar Integrations

1. Go to Settings in the app.
2. Enter your Google and/or Microsoft API credentials (see instructions in the app).
3. Connect your account and select which calendars to sync.
4. For Apple Calendar, select a date range and export the ICS file, then import it into Apple Calendar.

---

## 🧬 Database Schema

### **Core Entities**
- **Projects** → **Experiments** → **Notes** (hierarchical)
- **PDFs** → **Highlights** (annotations)
- **Database Entries** (chemicals, genes, growth factors, protocols, references)
- **Links** (cross-references between all entities)

### **Key Features**
- **SQLite** for local development (easily switchable to PostgreSQL)
- **Prisma migrations** for schema versioning
- **Type-safe** database operations
- **JSON properties** for flexible metadata storage

---

## 🔗 API Endpoints

### **Notes** (`/api/notes`)
- `GET /` - List notes with filtering and pagination
- `GET /:id` - Get specific note with links
- `POST /` - Create new note
- `PUT /:id` - Update note
- `DELETE /:id` - Delete note and associated links

### **Projects** (`/api/projects`)
- `GET /` - List all projects with experiments
- `GET /:id` - Get project details
- `POST /` - Create new project
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project and all related data
- `GET /:projectId/experiments` - List experiments for project
- `POST /:projectId/experiments` - Create new experiment

### **PDFs** (`/api/pdfs`)
- `GET /` - List PDFs with highlights
- `GET /:id` - Get PDF details
- `POST /` - Upload new PDF
- `DELETE /:id` - Delete PDF and file
- `GET /:id/file` - Serve PDF file
- `GET /:pdfId/highlights` - List highlights for PDF
- `POST /:pdfId/highlights` - Create new highlight

### **Database** (`/api/database`)
- `GET /` - List database entries with filtering
- `GET /type/:type` - List entries by type
- `GET /:id` - Get specific entry
- `POST /` - Create new entry
- `PUT /:id` - Update entry
- `DELETE /:id` - Delete entry
- `GET /types/list` - List all available types
- `GET /search/:query` - Search entries

### **Links** (`/api/links`)
- `GET /` - List all links
- `GET /backlinks/:type/:id` - Get backlinks for entity
- `GET /outgoing/:type/:id` - Get outgoing links for entity
- `POST /` - Create new link
- `DELETE /:id` - Delete link
- `GET /graph` - Get link graph for visualization
- `GET /search/:query` - Search for linkable items

### **Zotero** (`/api/zotero`)
- `POST /config` - Configure Zotero API connection
- `GET /items` - List Zotero library items
- `GET /items/:key` - Get specific Zotero item
- `POST /import` - Import PDF with Zotero metadata
- `GET /search/:query` - Search Zotero library
- `GET /collections` - List Zotero collections
- `GET /collections/:key/items` - Get items from collection
- `POST /sync-highlights/:pdfId` - Sync highlights from Zotero

---

## 📚 Zotero Integration Features

### **✅ Implemented**
- **API Configuration** - Connect to Zotero library with API key
- **PDF Import** - Drag PDFs from Zotero with full metadata
- **Reference Management** - Create database entries for academic references
- **Highlight Sync** - Import annotations from Zotero
- **Collection Support** - Browse and import from specific collections
- **Search Integration** - Search Zotero library from within the app

### **🔄 Planned Frontend Features**
- **Drag-and-Drop Interface** - Visual PDF import from Zotero
- **Citation Linking** - Automatic backlinks to Zotero references
- **Metadata Display** - Show author, journal, DOI information
- **Annotation Sync** - Visual highlight synchronization

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and pnpm
- Zotero account and API key (for integration features)

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd notebook-notion-app

# Install dependencies
pnpm install

# Set up the database
cd apps/backend
pnpm exec prisma migrate dev --name init

# Start the backend
pnpm dev

# In another terminal, start the frontend
cd apps/frontend
pnpm dev
```

### **Environment Setup**
Create `.env` file in `apps/backend/`:
```env
# Database (SQLite by default)
DATABASE_URL="file:./dev.db"

# Optional: Zotero API credentials
ZOTERO_API_KEY="your-api-key"
ZOTERO_USER_ID="your-user-id"
```

---

## 🧮 Built-In Tools (Planned)

- **Calculators** - Molarity, dilution, percentage calculations
- **Calendar Views** - Chronological research timeline
- **Kanban Boards** - Project and experiment tracking
- **Smart Linking** - AI-suggested connections between entities
- **Task Management** - Recurring tasks with natural language parsing
- **Data Export** - CSV, JSON export for analysis

---

## ✅ Planned Future Enhancements

- [ ] **Frontend Development** - Complete React UI with all features
- [ ] **iPad Support** - Apple Pencil handwriting-to-text
- [ ] **Shared Review Mode** - Comment, suggest, resolve system
- [ ] **Custom Dashboards** - Configurable research metrics
- [ ] **Visual Pathway Editor** - Biological pathway visualization
- [ ] **Experimental Variable Tracker** - Parameter tracking across experiments
- [ ] **Research Timeline Export** - Calendar and Gantt chart exports
- [ ] **AI Suggestions** - Related content and note linking
- [ ] **Advanced Search** - Semantic search across all content
- [ ] **Collaboration Features** - Multi-user support
- Full CSL (Citation Style Language) support for bibliography and citation formatting using a library such as [citeproc-js](https://github.com/Juris-M/citeproc-js) or [citation-js](https://citation.js.org/).
  - This will allow users to select from hundreds of citation styles and render bibliographies/citations in any supported format.
  - Current implementation uses simple formatting for major styles (APA, MLA, Chicago, etc.).

---

## 🧠 Philosophy

This app is built to scale with real research complexity. It supports the modular growth of a PhD thesis, evolving lab studies, or a long-term bioinformatics pipeline with robust linking, tracking, and semantic search across all components.

The backend provides a solid foundation with comprehensive API coverage, while the frontend will deliver an intuitive interface for managing complex research workflows. The Zotero integration ensures seamless literature management, while the cross-linking system enables the discovery of connections across your entire research corpus.

---

## 🤝 Contributing

This is a research-focused application designed for scientific workflows. Contributions that enhance research productivity, data organization, or scientific collaboration are particularly welcome.

---

## 📄 License

[Add your license information here] 

## Database Migration Required
If upgrading from a previous version, run:
```bash
cd apps/backend
pnpm exec prisma migrate dev --name add_outlook_calendar_fields
``` 