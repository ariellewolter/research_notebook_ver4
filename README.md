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
- Open your browser to [http://localhost:5173](http://localhost:5173)
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

## 📊 Feature Status Overview

### ✅ **Fully Implemented Features**
- **🔍 Advanced Search System** - Multi-type search with clustering, analytics, and saved searches
- **📤 Import/Export System** - Comprehensive data import/export with field mapping and validation
- **📚 PDF Management** - Unified PDF interface with Zotero integration
- **🧮 Built-In Tools** - Scientific calculators and data visualization
- **🗓️ Calendar Integrations** - Google, Outlook, and Apple Calendar support
- **🔔 Notification System** - Comprehensive notification settings with multiple delivery methods
- **📋 Core CRUD Operations** - Notes, Projects, Experiments, Database, Protocols, Recipes
- **🔗 Cross-Linking System** - Obsidian-style bidirectional linking
- **🎨 UI/UX** - Modern Material-UI interface with responsive design

### 🚧 **Partially Implemented Features**
- **📊 Analytics & Reporting** - Basic dashboard exists, needs enhanced metrics
- **📋 Task Management** - Basic tasks exist, needs dependencies and workflows

### 📋 **Planned Future Features**
- **🎯 Advanced Features** - Shared review mode, visual pathway editor, AI suggestions
- **📱 iPad Support** - Apple Pencil handwriting-to-text
- **🤝 Collaboration** - Multi-user support and real-time collaboration

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

### **Frontend**
- **React 18** with **TypeScript** - Modern UI framework
- **Material-UI (MUI)** - Professional UI components
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React PDF** - PDF viewing and annotation
- **Recharts** - Data visualization and analytics

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
│   │   │   │   ├── tasks.ts     # Task management system
│   │   │   │   ├── analytics.ts # Analytics and reporting
│   │   │   │   ├── search.ts    # Advanced search functionality
│   │   │   │   ├── notifications.ts # Notification system
│   │   │   │   ├── importExport.ts # Data import/export
│   │   │   │   └── zotero.ts    # Zotero API integration
│   │   │   └── app.ts           # Express app configuration
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   └── uploads/             # PDF file storage
│   └── frontend/                # React frontend
│       ├── src/
│       │   ├── components/      # React components
│       │   │   ├── NotionWorkspace/ # Advanced workspace interface
│       │   │   ├── Analytics/   # Analytics and charts
│       │   │   ├── Search/      # Search components
│       │   │   ├── Tasks/       # Task management UI
│       │   │   ├── Notifications/ # Notification center
│       │   │   └── Export/      # Data export components
│       │   ├── pages/           # Page components
│       │   ├── hooks/           # Custom React hooks
│       │   ├── services/        # API services
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
- **Task Management** - Advanced task system with dependencies, time tracking, and workflows
- **Analytics & Reporting** - Comprehensive dashboard with metrics and visualizations
- **Advanced Search** - Multi-type search with history, saved searches, and suggestions
- **Notification System** - Task reminders, notifications with multiple delivery methods
- **Import/Export** - Excel, CSV, JSON data import/export functionality

### **✅ Frontend (Complete)**
- **Modern React App** - Full-featured interface with Material-UI components
- **Advanced Workspace** - Notion-like workspace with rich editing capabilities
- **Analytics Dashboard** - Interactive charts and productivity metrics
- **Task Management UI** - Comprehensive task interface with dependencies and time tracking
- **Search Interface** - Advanced search with filters, history, and suggestions
- **Notification Center** - Real-time notifications with priority management
- **Data Export Tools** - Multiple export formats and visualization options
- **Responsive Design** - Mobile-friendly interface with adaptive layouts

---

## 🧮 Built-In Tools (✅ Implemented)

### **Scientific Calculators**
- **Molarity Calculator** - Mass, molecular weight, volume, and concentration calculations
- **Dilution Calculator** - C1V1 = C2V2 formula with step-by-step solutions
- **Percentage Calculator** - Part/whole calculations with formulas
- **pH Calculator** - Acid-base calculations and buffer solutions
- **Concentration Converter** - Unit conversions (M, mM, μM, etc.)
- **Buffer Calculator** - Buffer solution calculations
- **Unit Converter** - Mass, volume, length, and temperature conversions
- **Statistics Calculator** - Mean, median, standard deviation, and other statistical functions
- **Molecular Weight Calculator** - Chemical formula calculations

### **Data Export & Visualization**
- **Research Timeline Export** - Chronological research timeline with multiple formats
- **Gantt Chart Export** - Project timeline visualization and export
- **Advanced Citation Export** - Bibliography and citation management
- **Multiple Export Formats** - CSV, JSON, Excel, and HTML exports

---

## 📊 Analytics & Reporting

### **Dashboard Analytics**
- **Experiment Success Tracking** - Monitor experiment outcomes and success rates
- **Productivity Metrics** - Track task completion, time spent, and project progress
- **Resource Usage** - Monitor database usage, file storage, and system activity
- **Interactive Charts** - Line charts, bar charts, pie charts for data visualization
- **Custom Date Ranges** - Filter analytics by specific time periods
- **Project-based Filtering** - View metrics for specific projects or experiments

### **Reporting Features**
- **Export Analytics** - Download reports in multiple formats
- **Real-time Updates** - Live dashboard with automatic data refresh
- **Performance Tracking** - Monitor system performance and usage patterns

---

## 📋 Task Management System

### **Advanced Task Features**
- **Task Dependencies** - Complex dependency chains with multiple relationship types
- **Time Tracking** - Log time entries with detailed descriptions
- **Recurring Tasks** - Set up daily, weekly, monthly, or yearly recurring tasks
- **Task Templates** - Create reusable task templates for common workflows
- **Workflow Management** - Sequential, parallel, and conditional workflow support
- **Priority Management** - High, medium, low priority with visual indicators
- **Status Tracking** - Todo, in progress, done, overdue, cancelled statuses
- **Deadline Management** - Due date tracking with overdue notifications

### **Task Collaboration**
- **Comments System** - Add comments and discussions to tasks
- **File Attachments** - Attach documents, images, and other files to tasks
- **Assignment Tracking** - Track task assignments and responsibilities
- **Bulk Operations** - Update, delete, or complete multiple tasks at once

### **Natural Language Processing**
- **Smart Task Creation** - Parse natural language for dates, times, priorities
- **Automatic Tagging** - Extract tags and categories from task descriptions
- **Time Estimation** - Parse time estimates from natural language
- **Recurring Pattern Recognition** - Automatically detect recurring task patterns

---

## 🔍 Advanced Search System (✅ Implemented)

### **Multi-Type Search**
- **Cross-Entity Search** - Search across projects, experiments, notes, PDFs, database entries
- **Advanced Filters** - Filter by date range, status, priority, tags, categories, authors, and projects
- **Search History** - Track and revisit previous searches
- **Saved Searches** - Save frequently used search queries with alerts
- **Search Suggestions** - Intelligent search suggestions and autocomplete
- **Exact Match Options** - Case-sensitive and exact phrase matching
- **Score Thresholds** - Filter results by minimum relevance score

### **Search Features**
- **Real-time Results** - Instant search results as you type
- **Result Highlighting** - Highlight matching terms in search results
- **Sort Options** - Sort by relevance, date, name, type, priority, or status
- **Export Results** - Export search results in multiple formats
- **Multiple View Modes** - List, grid, and clustered views
- **Result Clustering** - Group results by type and relevance
- **Search Analytics** - Track search trends, popular queries, and result types
- **Group Results** - Option to group results by type for better organization

---

## 🔔 Notification System (✅ Implemented)

### **Comprehensive Notifications**
- **Task Reminders** - Automated reminders for upcoming deadlines
- **Overdue Alerts** - Notifications for overdue tasks and projects
- **Completion Notifications** - Alerts when tasks or experiments are completed
- **Assignment Notifications** - Notify when tasks are assigned or reassigned
- **Comment Notifications** - Alert when comments are added to tasks
- **Time Logging Notifications** - Track time entry notifications

### **Settings Integration**
- **Centralized Configuration** - All notification settings accessible through the Settings page
- **User Preferences** - Personalized notification preferences per user
- **Real-time Updates** - Settings changes applied immediately

### **Delivery Methods**
- **In-App Notifications** - Real-time notifications in the application
- **Email Notifications** - Email delivery for important alerts
- **Push Notifications** - Browser push notifications (when supported)
- **SMS Notifications** - Text message alerts for urgent items

### **Notification Management**
- **Priority Levels** - Low, normal, high, urgent priority notifications
- **Notification Center** - Centralized notification management interface
- **Mark as Read** - Individual and bulk read status management
- **Notification History** - Complete history of all notifications

---

## 📤 Import/Export Functionality (✅ Implemented)

### **Data Export Options**
- **Excel Export** - Export all data to Excel spreadsheets with multiple sheets
- **CSV Export** - Comma-separated values for data analysis
- **JSON Export** - Complete data export in JSON format
- **Publication-Ready Export** - Generate formatted reports for projects and experiments
- **Gantt Charts** - Export project timelines as Gantt charts
- **Research Timeline** - Export chronological research timeline

### **Data Import Features**
- **CSV Import** - Import data from CSV files with column mapping
- **Excel Import** - Import data from Excel spreadsheets
- **JSON Import** - Import data from JSON files
- **XML Import** - Import data from XML files
- **Bulk Operations** - Import large datasets with progress tracking
- **Data Validation** - Validate imported data before processing
- **Error Handling** - Comprehensive error reporting for import issues
- **Field Mapping** - Custom field mapping for different data formats
- **Conflict Resolution** - Handle duplicate data and conflicts
- **Import Job Tracking** - Monitor import progress and status

---

## 📚 PDF Management System (✅ Implemented)

### **Comprehensive PDF Management**
- **Unified PDF Interface** - Centralized management for all PDFs (local, Zotero, imported)
- **Multi-Source Integration** - Seamlessly manage PDFs from local storage and Zotero library
- **Advanced Search & Filtering** - Search by title, authors, filename, and filter by source, collections, tags
- **Multiple View Modes** - List and grid views for different browsing preferences
- **Smart Organization** - Favorite, archive, and categorize PDFs for easy access

### **Zotero Integration**
- **Direct Zotero Sync** - Import and manage PDFs directly from Zotero library
- **Metadata Preservation** - Maintain author, journal, DOI, and publication information
- **Collection Support** - Browse and import from specific Zotero collections
- **Tag Management** - Sync and manage tags from Zotero
- **Citation Linking** - Automatic backlinks to Zotero references

### **PDF Features**
- **Highlight Management** - View and manage PDF highlights and annotations
- **Context Menus** - Right-click actions for quick PDF operations
- **Bulk Operations** - Select and manage multiple PDFs simultaneously
- **Export Capabilities** - Export PDF metadata and highlights
- **File Operations** - Download, delete, and organize local PDFs
- **Status Tracking** - Track favorite, archived, and read status

### **Advanced Features**
- **Sorting Options** - Sort by title, date, size, authors, or year
- **Filter System** - Filter by source, collections, tags, authors, year range
- **Search Analytics** - Track search patterns and popular queries
- **Responsive Design** - Optimized for desktop and mobile use
- **Real-time Updates** - Live synchronization with Zotero and local storage

---

## 🗓️ Calendar Integrations (✅ Implemented)

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
- **Notification Settings**: Comprehensive notification management with multiple delivery methods (email, push, SMS), contact information, default delivery preferences, notification types (task reminders, overdue alerts, completion, assignment, comments), timing settings, and quiet hours configuration.
- **Calendar Integrations**: New sections for Google, Outlook, and Apple Calendar: Enter credentials, connect/disconnect, select calendars, and export ICS.
- **Step-by-step instructions** for obtaining API credentials for both Google and Microsoft.

### Backend
- New endpoints for Google and Outlook OAuth2 flows, calendar listing, event sync, and ICS export.
- Prisma schema updated: User model now includes fields for Google and Outlook credentials and tokens.
- Database migration: Run `pnpm exec prisma migrate dev --name add_outlook_calendar_fields` to update your schema.

### Frontend
- Modern Material-UI UI for all calendar integrations.
- Calendar management: View, connect, and manage all external calendar integrations from the Settings page.

---

## Example API Endpoints

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

## How to Configure Notification Settings

1. Go to Settings in the app.
2. Navigate to the "Notification Settings" section.
3. Configure your preferred delivery methods (in-app, email, push, SMS).
4. Enter your contact information (email address, phone number).
5. Set your default delivery method preference.
6. Enable/disable specific notification types (task reminders, overdue alerts, etc.).
7. Configure timing settings and quiet hours if desired.
8. Save your settings - they will be applied immediately.

---

## 🧬 Database Schema

### **Core Entities**
- **Projects** → **Experiments** → **Notes** (hierarchical)
- **PDFs** → **Highlights** (annotations)
- **Database Entries** (chemicals, genes, growth factors, protocols, references)
- **Links** (cross-references between all entities)
- **Tasks** → **Task Dependencies** → **Task Workflows** (advanced task management)
- **Literature Notes** (academic references and annotations)
- **Protocols** → **Protocol Executions** (experimental procedures)
- **Recipes** → **Recipe Ingredients** (laboratory recipes)

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

### **Tasks** (`/api/tasks`)
- `GET /` - List tasks with advanced filtering
- `GET /:id` - Get task details with dependencies
- `POST /` - Create new task
- `PUT /:id` - Update task
- `DELETE /:id` - Delete task
- `GET /overdue` - List overdue tasks
- `GET /stats` - Get task statistics
- `POST /bulk` - Bulk task operations
- `POST /:taskId/time-entries` - Log time entries
- `GET /:taskId/comments` - Get task comments
- `POST /:taskId/comments` - Add task comment

### **Analytics** (`/api/analytics`)
- `GET /dashboard` - Get dashboard analytics
- `GET /experiment-success` - Experiment success metrics
- `GET /productivity` - Productivity analytics
- `GET /resource-usage` - Resource usage statistics

### **Search** (`/api/search`)
- `POST /advanced` - Advanced multi-type search
- `POST /save` - Save search query
- `GET /saved` - Get saved searches
- `GET /history` - Get search history
- `GET /suggestions` - Get search suggestions

### **Notifications** (`/api/notifications`)
- `GET /` - List notifications
- `POST /` - Create notification
- `PUT /:id` - Update notification
- `PUT /:id/read` - Mark as read
- `PUT /read-all` - Mark all as read
- `DELETE /:id` - Delete notification
- `GET /stats` - Get notification statistics

### **Import/Export** (`/api/import-export`)
- `GET /export` - Export all data as JSON
- `GET /export/excel` - Export data as Excel file
- `POST /import` - Import data from file

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

## 🚧 Planned Future Enhancements

### **High Priority**
- [ ] **Advanced Analytics Dashboard** - Experiment success tracking, productivity metrics, and interactive charts
- [ ] **Task Management Enhancements** - Task dependencies, recurring tasks, and natural language processing

### **Medium Priority**
- [ ] **Shared Review Mode** - Comment, suggest, resolve system for collaborative editing
- [ ] **Visual Pathway Editor** - Biological pathway visualization and editing
- [ ] **Experimental Variable Tracker** - Parameter tracking across experiments
- [ ] **Full CSL Support** - Complete Citation Style Language support for bibliography formatting

### **Lower Priority**
- [ ] **iPad Support** - Apple Pencil handwriting-to-text
- [ ] **AI Suggestions** - Related content and note linking
- [ ] **Collaboration Features** - Multi-user support and real-time collaboration
- [ ] **Smart Linking** - AI-suggested connections between entities

---

## 🧠 Philosophy

This app is built to scale with real research complexity. It supports the modular growth of a PhD thesis, evolving lab studies, or a long-term bioinformatics pipeline with robust linking, tracking, and semantic search across all components.

The backend provides a solid foundation with comprehensive API coverage, while the frontend delivers an intuitive interface for managing complex research workflows. The Zotero integration ensures seamless literature management, while the cross-linking system enables the discovery of connections across your entire research corpus.

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