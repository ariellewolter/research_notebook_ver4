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
- **Electron** (for desktop app): Automatically installed with project dependencies

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

#### **Option A: Web Development Mode**
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

#### **Option B: Electron Desktop App**
- **Full Stack Development:**
  ```bash
  pnpm start
  ```
- **Electron Only (with running backend/frontend):**
  ```bash
  pnpm electron:dev
  ```
- **Build and Package Desktop App:**
  ```bash
  pnpm frontend:build
  pnpm electron:build
  ```

#### **Calendar Setup:** 
Go to the Settings page to connect your Google, Outlook, or Apple Calendar.

### 6. **Environment Variables (Optional)**
Create a `.env` file in `apps/backend/` for custom DB or Zotero integration (see below for details).

### 7. **Data Storage**
- All data is stored locally in `apps/backend/prisma/dev.db` (SQLite).
- Uploaded files (PDFs, etc.) are stored in `apps/backend/uploads/`.
- To move your data to another computer, copy these files/directories.

### 8. **Desktop App Features**
- **OS File Handler:** Double-click PDF files to open them in the Research Notebook app
- **System Tray:** App runs in system tray with quick access menu
- **Auto-Start:** Option to start app automatically on system login
- **Multi-Window Support:** Open multiple windows for different tasks
- **Native File Dialogs:** Use system file dialogs for opening and saving files

---

## 🖥️ Desktop App Features

### **OS File Handler Integration**
- **PDF File Association:** Double-click any PDF file to open it directly in Research Notebook
- **Cross-Platform Support:** Works on Windows, macOS, and Linux
- **Smart File Handling:** If app is closed, launches and opens the file; if running, opens in new window
- **File Type Registration:** Automatically registers PDF files with the app during installation

### **System Integration**
- **System Tray:** App runs in system tray with quick access menu
- **Auto-Start:** Option to start app automatically on system login
- **Native Notifications:** System-level notifications for app events
- **Window Management:** Minimize to tray, restore from tray, and proper app lifecycle

### **Multi-Window System**
- **Popout Windows:** Open any route in a separate window
- **PDF Viewer Windows:** Dedicated windows for PDF viewing
- **Editor Windows:** Separate windows for document editing
- **Settings Windows:** Modal settings dialogs
- **Window Management:** Close, focus, minimize, and restore individual windows

### **Native File Operations**
- **File Dialogs:** Use system file dialogs for opening and saving files
- **Save File Dialog:** Native save dialog with content writing
- **Local Settings:** Persistent app settings stored in user data directory
- **File System Access:** Direct file system access for better performance

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
- **📊 Advanced Reporting** - Complete reporting system with templates, custom reports, scheduled reports, and analytics
- **🔬 Experimental Variables** - Parameter tracking across experiments with category management and value recording
- **📋 Task Management** - Complete task system with natural language date parsing, recurring tasks, templates, time tracking, and workflow management
- **🔍 Advanced Search** - Multi-type search with clustering, analytics, and saved searches
- **📤 Import/Export** - Comprehensive data import/export with field mapping and validation
- **📚 PDF Management** - Unified PDF interface with Zotero integration and PDF download functionality
- **🧮 Built-In Tools** - Scientific calculators and data visualization
- **🗓️ Calendar Integrations** - Google, Outlook, and Apple Calendar support
- **🔔 Notification System** - Comprehensive notification settings with multiple delivery methods
- **📊 Analytics Dashboard** - Experiment success tracking, productivity metrics, interactive charts, and predictive analytics
- **🔧 Type Safety** - Comprehensive TypeScript interfaces for all API entities and improved error handling
- **🔗 Cross-Linking System** - Obsidian-style bidirectional linking
- **🎨 UI/UX** - Modern Material-UI interface with responsive design
- **🔐 Authentication System** - JWT-based authentication with protected routes
- **🔄 API Integration** - Complete frontend-backend integration with all 19 routes
- **🖥️ Desktop App** - Electron-based desktop application with native OS integration
- **📁 OS File Handler** - Double-click PDF files to open in Research Notebook
- **🪟 Multi-Window System** - Open multiple windows for different tasks and workflows
- **🔔 System Notifications** - Native OS notifications for app events
- **💾 Local Settings** - Persistent app settings with auto-save functionality
- **🚀 Auto-Start** - Option to start app automatically on system login

### 📋 **Planned Future Features**
- **🎯 Advanced Features** - Shared review mode, visual pathway editor, AI suggestions
- **📱 iPad Support** - Apple Pencil handwriting-to-text
- **🤝 Collaboration** - Multi-user support and real-time collaboration

---

## 🎯 **Project Status: FULLY FUNCTIONAL** ✅

### **Current Status:**
- **✅ All 19 Backend Routes**: Fully implemented and tested
- **✅ Frontend Integration**: Complete with all API endpoints
- **✅ Authentication System**: JWT-based authentication working
- **✅ Advanced Reporting**: Fully implemented and integrated
- **✅ Task Management**: Complete with natural language parsing
- **✅ Database Schema**: All models defined and migrated
- **✅ API Documentation**: All endpoints documented and tested
- **✅ Zotero Integration**: Fully functional sync and import capabilities
- **✅ Search Analytics**: Complete analytics with trends and insights
- **✅ UI Features**: Notification center and account settings implemented
- **✅ Workspace Functionality**: New note creation with dialog and tab integration
- **✅ Data Structure Handling**: Robust API response handling with error prevention
- **✅ Entity Navigation**: Enhanced error handling and user feedback

### **Ready for Production:**
- All critical bugs resolved and system fully functional
- Frontend and backend fully integrated
- Authentication and authorization working
- All major features implemented and tested
- Performance optimized with database indexes and caching
- Query optimization implemented for better response times
- Universal linking system with [[ ]] wiki-style links and / commands
- Real-time search and autocomplete for linking across all content types
- Workspace integration with seamless editing and linking experience
- Zotero integration working with sync and import functionality
- Search analytics providing comprehensive insights
- Complete notification and account management system
- Robust error handling and user feedback throughout the application

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

### **Desktop App**
- **Electron** - Cross-platform desktop application framework
- **electron-builder** - App packaging and distribution
- **System Integration** - Native OS file handlers, notifications, and tray support

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
│   │   │   ├── app.ts           # Express app configuration
│   │   │   └── simple-app.ts    # Simplified backend for development
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   └── uploads/             # PDF file storage
│   └── frontend/                # React frontend
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── hooks/           # Custom React hooks
│       │   │   ├── useWindowManager.ts # Multi-window management
│       │   │   ├── useNotification.ts # Notification system
│       │   │   └── useAppSettings.ts # App settings management
│       │   └── utils/
│       │       └── fileSystemAPI.ts # File system abstraction
├── electron/                    # Electron desktop app
│   ├── main.js                  # Main process
│   ├── preload.js               # Preload script for IPC
│   ├── utils/
│   │   ├── spawnBackend.js      # Backend process management
│   │   └── fileUtils.js         # File system utilities
│   └── assets/                  # App icons and resources
├── electron-builder.json        # Electron build configuration
└── package.json                 # Root package configuration
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
- **Zotero Integration** - Full API integration for importing references and PDFs with sync and import functionality
- **Task Management** - Complete task system with natural language date parsing, recurring tasks, templates, time tracking, and workflow management
- **Advanced Reporting** - Complete reporting system with templates, custom reports, scheduled reports, and analytics
- **Experimental Variables** - Parameter tracking across experiments with category management and value recording
- **Analytics & Reporting** - Comprehensive dashboard with metrics and visualizations
- **Advanced Search** - Multi-type search with history, saved searches, suggestions, and comprehensive analytics
- **Notification System** - Task reminders, notifications with multiple delivery methods
- **Import/Export** - Excel, CSV, JSON data import/export functionality
- **Calendar Integration** - Google, Outlook, and Apple Calendar API support
- **Task Dependencies** - Complex dependency chains with multiple relationship types
- **Task Flow Management** - Workflow automation and process management

### **✅ Frontend (Complete)**
- **Modern React App** - Full-featured interface with Material-UI components
- **Advanced Workspace** - Notion-like workspace with rich editing capabilities
- **Analytics Dashboard** - Interactive charts and productivity metrics
- **Advanced Reporting Interface** - Complete reporting interface with templates, custom reports, and scheduled reports
- **Task Management UI** - Complete task interface with natural language date parsing, recurring tasks, templates, time tracking, and workflow management
- **Search Interface** - Advanced search with filters, history, suggestions, and analytics dashboard
- **Notification Center** - Real-time notifications with priority management and account settings
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
- **Natural Language Date Parsing** - Parse dates from natural language (e.g., "next Friday", "in 3 days")
- **Recurring Tasks** - Set up daily, weekly, monthly, or yearly recurring tasks with custom patterns
- **Task Templates** - Create reusable task templates for common workflows
- **Time Tracking** - Log time entries with detailed descriptions and duration tracking
- **Workflow Management** - Sequential, parallel, and conditional workflow support
- **Priority Management** - High, medium, low priority with visual indicators
- **Status Tracking** - Todo, in progress, done, overdue, cancelled statuses
- **Deadline Management** - Due date tracking with overdue notifications
- **Task Dependencies** - Complex dependency chains with multiple relationship types

### **Task Collaboration**
- **Comments System** - Add comments and discussions to tasks
- **File Attachments** - Attach documents, images, and other files to tasks
- **Assignment Tracking** - Track task assignments and responsibilities
- **Bulk Operations** - Update, delete, or complete multiple tasks at once

### **Natural Language Processing**
- **Smart Date Parsing** - Parse natural language for dates and times (e.g., "next Friday", "in 3 days", "tomorrow")
- **Automatic Tagging** - Extract tags and categories from task descriptions
- **Time Estimation** - Parse time estimates from natural language
- **Recurring Pattern Recognition** - Automatically detect and set up recurring task patterns

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

## 📊 Advanced Reporting System (✅ Implemented)

### **Complete Reporting Solution**
- **Report Templates** - Create reusable report templates with custom layouts and data sources
- **Custom Reports** - Build custom reports with flexible data sources and filtering options
- **Scheduled Reports** - Automate report generation with cron-based scheduling
- **Report Analytics** - Track report usage, generation times, and popular templates
- **Multiple Formats** - Export reports in PDF, JSON, CSV, HTML, and Excel formats
- **Real-time Generation** - Generate reports on-demand with live data
- **Template Categories** - Organize templates by project, experiment, task, analytics, or custom types

### **Key Features**
- **Template Management** - Create, edit, and share report templates
- **Data Source Integration** - Connect to projects, experiments, tasks, and analytics data
- **Filter System** - Apply custom filters to focus on specific data subsets
- **Layout Customization** - Design custom report layouts with JSON configuration
- **Scheduling Options** - Set up automated report generation with email delivery
- **Execution Tracking** - Monitor report generation status and performance
- **User Permissions** - Control access to public and private templates

## 📚 Full CSL Support (✅ Implemented)

### **Complete Citation Style Language Support**
- **15+ Citation Styles**: APA, MLA, Chicago (Author-Date & Note-Bibliography), IEEE, Nature, Science, Cell, PLOS, BMC, Vancouver, Harvard, AMA, ACS, ASA
- **Real-time Preview**: See formatted citations instantly before export
- **Multiple Output Formats**: Bibliography, citations, and HTML formatting
- **Export Options**: TXT, HTML, BibTeX, RTF, and DOCX formats
- **Integration**: Works seamlessly with Zotero items and literature notes
- **Advanced Features**: Item selection, sorting, filtering, and copy-to-clipboard functionality

---

## 🔄 Task Flow Management (✅ Implemented)

### **Visual Workflow Management System**
- **Visual Workflow Designer**: Drag-and-drop interface for creating complex task workflows
- **Multiple Node Types**: Task, Decision, Start/End, Wait, Notification, and Subprocess nodes
- **Real-time Execution Monitoring**: Track workflow progress with live updates
- **Execution History & Analytics**: Comprehensive logging and performance metrics
- **Workflow Templates**: Reusable workflow patterns for common processes
- **Automation Rules**: Conditional logic and automated task triggers
- **Integration**: Seamless integration with existing task management system

### **Key Features**
- **Flow Types**: Sequential, Parallel, Conditional, and Mixed workflow patterns
- **Node Palette**: Easy-to-use tools for building complex workflows
- **Execution Control**: Start, pause, resume, and cancel workflow executions
- **Progress Tracking**: Real-time progress indicators and status updates
- **Error Handling**: Robust error handling and recovery mechanisms
- **Analytics Dashboard**: Performance metrics and execution statistics

### **Key Features**
- **Style Selection**: Choose from popular academic citation styles
- **Item Management**: Select and organize items for citation generation
- **Preview System**: Real-time preview of formatted citations
- **Export Capabilities**: Multiple export formats for different use cases
- **Integration**: Available in both Zotero page and Advanced Features
- **User-Friendly Interface**: Intuitive design with clear categorization

### **How to Use CSL Support**
1. Navigate to the Zotero page and select the "CSL Support" tab
2. Choose your preferred citation style from the dropdown
3. Select items you want to include in your bibliography
4. Use the preview function to see formatted citations
5. Export in your preferred format (TXT, HTML, BibTeX, etc.)
6. Alternatively, access CSL Support from the Advanced Features page

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

## How to Use Task Flow Management

1. **Access the Feature**: Go to Tasks page and click the "Task Flow" button, or access it from Advanced Features.
2. **Create a New Flow**: Click "Create Flow" and provide a name, description, and flow type.
3. **Design Your Workflow**: Use the visual designer to add nodes (tasks, decisions, etc.) and connect them with edges.
4. **Configure Nodes**: Set up task assignments, conditions, wait times, and notifications for each node.
5. **Save and Execute**: Save your workflow and click "Execute" to start the process.
6. **Monitor Progress**: Track execution progress in real-time through the execution history tab.
7. **Analyze Performance**: View analytics and metrics to optimize your workflows.

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

### **✅ Recently Implemented**
- **Drag-and-Drop Interface** - Visual PDF import from Zotero with item preview
- **Enhanced Metadata Display** - Show author, journal, DOI information with detailed previews
- **Import Dialog** - Comprehensive import options with selection and progress tracking
- **Item Preview** - Detailed preview of Zotero items before import
- **Selection Management** - Multi-select items for batch import
- **Progress Tracking** - Real-time import progress with visual feedback
- **Full CSL Support** - Complete Citation Style Language support with 15+ citation styles, real-time preview, and multiple export formats

### **🔄 Planned Frontend Features**
- **Citation Linking** - Automatic backlinks to Zotero references
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

## 📊 Advanced Analytics Dashboard (✅ Implemented)

The Advanced Analytics Dashboard provides comprehensive insights into research productivity, experiment success rates, and resource utilization with sophisticated data visualization and predictive capabilities.

### **Key Features**

#### **📈 Interactive Dashboard**
- **Real-time Metrics**: Live updates of project status, experiment success rates, and task completion
- **Comparative Analytics**: Period-over-period comparisons with trend analysis
- **Custom Date Ranges**: Flexible filtering by 7, 30, 90 days or all-time data
- **Project Filtering**: Focus on specific projects or view organization-wide metrics

#### **🔬 Experiment Success Analytics**
- **Success Rate Tracking**: Monitor experiment completion rates over time
- **Failure Analysis**: Identify common failure reasons and patterns
- **Top Performing Projects**: Rank projects by success rates and experiment counts
- **Duration Analysis**: Track average experiment duration and efficiency

#### **⚡ Productivity Analytics**
- **Task Completion Rates**: Monitor task completion and overdue task tracking
- **Time Analysis**: Identify most productive time periods and patterns
- **Priority Distribution**: Analyze task priorities and workload distribution
- **Efficiency Metrics**: Calculate productivity scores and trends

#### **📊 Resource Usage Analytics**
- **Utilization Tracking**: Monitor resource usage and capacity planning
- **Category Distribution**: Analyze resource usage by type and category
- **Top Resources**: Identify most frequently used resources and equipment
- **Efficiency Metrics**: Radar charts showing resource efficiency across multiple dimensions

#### **🔮 Predictive Analytics**
- **30-Day Forecasting**: Predict future productivity and experiment outcomes
- **Trend Analysis**: Identify patterns and forecast potential bottlenecks
- **Confidence Intervals**: Upper and lower bounds for predictions
- **Historical Pattern Recognition**: Learn from past data to improve predictions

#### **📤 Export Capabilities**
- **Multiple Formats**: Export data in CSV, JSON, or Excel (XLSX) formats
- **Customizable Exports**: Include chart data, raw data, or both
- **Date Range Selection**: Export specific time periods
- **Project Filtering**: Export data for specific projects

#### **🔄 Real-time Features**
- **Live Updates**: Automatic data refresh every 30 seconds (configurable)
- **Comparison Mode**: Compare current period with previous periods
- **Interactive Charts**: Hover for details, zoom, and pan capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### **Chart Types Available**
- **Composed Charts**: Combined area, bar, and line charts for productivity trends
- **Pie Charts**: Distribution analysis for projects, priorities, and status
- **Area Charts**: Success rate tracking over time
- **Bar Charts**: Time period analysis and resource usage
- **Line Charts**: Predictive analytics with confidence intervals
- **Radar Charts**: Multi-dimensional efficiency metrics

### **How to Use Advanced Analytics**

1. **Access the Dashboard**: Navigate to Analytics in the sidebar
2. **Configure Filters**: Set date range and select specific projects
3. **Enable Features**: Toggle comparison mode, real-time updates, or predictive analytics
4. **Explore Tabs**: Switch between Dashboard, Experiment Success, Productivity, and Resource Usage
5. **Export Data**: Use the export button to download analytics in your preferred format
6. **Monitor Trends**: Use comparison mode to track improvements over time

### **Technical Implementation**
- **Frontend**: React with Material-UI and Recharts for advanced visualizations
- **Backend**: Express.js with Prisma for efficient data aggregation
- **Real-time**: WebSocket-like polling for live data updates
- **Export**: Server-side generation of multiple file formats
- **Performance**: Optimized queries with proper indexing and caching

---

## 🔬 Experimental Variable Tracker (✅ Implemented)

The Experimental Variable Tracker provides comprehensive parameter tracking across experiments with sophisticated category management, real-time value recording, and analytical insights.

### **Key Features**

#### **📂 Variable Category Management**
- **Custom Categories**: Create reusable variable categories with data types and validation
- **Data Type Support**: Number, text, boolean, date, and select (dropdown) variables
- **Validation Rules**: Min/max values for numeric variables, required field marking
- **Global Categories**: Share categories across all projects or keep them project-specific
- **Visual Organization**: Color-coded categories with icons for easy identification

#### **🔬 Experiment Variable Tracking**
- **Experiment-Specific Variables**: Add variables to individual experiments
- **Category Inheritance**: Inherit data types and validation from categories
- **Custom Units**: Define units for each variable (e.g., °C, mg/mL, pH)
- **Ordering System**: Arrange variables in logical order for data entry
- **Required Fields**: Mark critical variables as required for experiment completion

#### **📊 Real-Time Value Recording**
- **Multiple Data Types**: Support for numbers, text, booleans, dates, and selections
- **Validation**: Automatic validation based on data type and category rules
- **Notes and Metadata**: Add contextual notes and additional metadata to values
- **Timestamp Tracking**: Automatic timestamp recording for all value entries
- **History View**: Complete history of all values for each variable

#### **📈 Analytics and Visualization**
- **Variable Distribution**: Pie charts showing variable distribution by category
- **Recent Values**: Table view of recent variable recordings across experiments
- **Trend Analysis**: Track changes in variable values over time
- **Category Insights**: Analytics on most used categories and variable types
- **Export Capabilities**: Export variable data for external analysis

### **Data Types Supported**

#### **Number Variables**
- **Examples**: Temperature, pH, concentration, time, weight
- **Features**: Min/max validation, unit specification, decimal precision
- **Use Cases**: Quantitative measurements, experimental parameters

#### **Text Variables**
- **Examples**: Notes, observations, sample IDs, equipment settings
- **Features**: Free-form text entry, length validation
- **Use Cases**: Qualitative observations, descriptive data

#### **Boolean Variables**
- **Examples**: Equipment on/off, presence/absence, success/failure
- **Features**: True/false selection, yes/no options
- **Use Cases**: Binary conditions, status tracking

#### **Date Variables**
- **Examples**: Sample collection date, experiment start time, measurement time
- **Features**: Date and time picker, automatic timestamp recording
- **Use Cases**: Temporal tracking, scheduling

#### **Select Variables**
- **Examples**: Equipment types, sample sources, experimental conditions
- **Features**: Dropdown selection, predefined options
- **Use Cases**: Categorical data, standardized choices

### **How to Use Experimental Variable Tracker**

1. **Create Categories**: Start by creating variable categories (e.g., "Temperature", "pH", "Equipment")
2. **Define Data Types**: Set appropriate data types and validation rules for each category
3. **Add to Experiments**: Select an experiment and add variables from your categories
4. **Record Values**: Use the value tracking interface to record measurements and observations
5. **Monitor Analytics**: View analytics to understand variable usage patterns
6. **Export Data**: Export variable data for external analysis or reporting

### **Technical Implementation**
- **Database Schema**: Three-table design (VariableCategory, ExperimentVariable, VariableValue)
- **API Endpoints**: Complete CRUD operations for categories, variables, and values
- **Frontend**: React components with Material-UI for intuitive data entry
- **Validation**: Client and server-side validation with Zod schemas
- **Analytics**: Real-time analytics with Recharts visualization
- **Performance**: Optimized queries with proper indexing and relationships

---

## 🚧 Planned Future Enhancements

### **High Priority**
- [x] **Advanced Analytics Dashboard** - Experiment success tracking, productivity metrics, and interactive charts
- [x] **Task Management Enhancements** - Natural language date parsing, recurring tasks, templates, and workflow management

### **Medium Priority**
- [ ] **Shared Review Mode** - Comment, suggest, resolve system for collaborative editing
- [ ] **Visual Pathway Editor** - Biological pathway visualization and editing
- [x] **Experimental Variable Tracker** - Parameter tracking across experiments
- [x] **Full CSL Support** - Complete Citation Style Language support for bibliography formatting

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