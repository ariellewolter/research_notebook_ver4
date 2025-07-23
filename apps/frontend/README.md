# Electronic Lab Notebook - Frontend

A modern React-based frontend for the Electronic Lab Notebook application, designed for scientific research and laboratory management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Backend server running on port 4000

### Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The frontend will be available at `http://localhost:5175` (or the next available port).

## 🏗️ Architecture

### Tech Stack
- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Axios** for API communication
- **Vite** for fast development and building

### Project Structure
```
src/
├── components/
│   └── Layout/
│       └── Layout.tsx          # Main layout with sidebar
├── pages/
│   ├── Dashboard.tsx           # Overview dashboard
│   ├── Notes.tsx              # Notes management
│   ├── Projects.tsx           # Project management
│   ├── PDFs.tsx               # PDF document management
│   ├── Database.tsx           # Database entries
│   └── Zotero.tsx             # Zotero integration
├── services/
│   └── api.ts                 # API client and endpoints
├── App.tsx                    # Main app component
└── main.tsx                   # Entry point
```

## 📱 Features

### Dashboard
- Overview statistics (notes, projects, PDFs, database entries)
- Recent activity feed
- Quick action buttons

### Notes Management
- Create, edit, and delete notes
- Support for different note types:
  - Daily notes
  - Experiment notes
  - Literature notes
- Rich text editing
- Date-based organization

### Projects
- Project creation and management
- Experiment tracking within projects
- Status monitoring

### PDF Management
- Upload and view PDF documents
- Highlight and annotate PDFs
- Link highlights to notes and database entries

### Database
- Manage scientific entities:
  - Chemicals
  - Genes
  - Growth factors
  - Protocols
- Search and filter capabilities

### Zotero Integration
- Import references from Zotero
- Sync PDFs and highlights
- Configure API credentials

## 🔌 API Integration

The frontend communicates with the backend through a comprehensive API client:

```typescript
import { notesApi, projectsApi, pdfsApi, databaseApi, zoteroApi } from '../services/api';

// Example: Create a new note
const newNote = await notesApi.create({
  title: 'My Note',
  content: 'Note content...',
  type: 'daily',
  date: '2024-01-15'
});
```

### Available API Modules
- `notesApi` - Notes CRUD operations
- `projectsApi` - Project and experiment management
- `pdfsApi` - PDF upload and management
- `databaseApi` - Database entry management
- `linksApi` - Cross-linking between entities
- `zoteroApi` - Zotero integration

## 🎨 UI/UX Features

### Responsive Design
- Mobile-friendly interface
- Collapsible sidebar navigation
- Adaptive grid layouts

### Material Design
- Consistent theming throughout
- Scientific color palette
- Professional appearance

### User Experience
- Loading states and error handling
- Snackbar notifications
- Confirmation dialogs
- Form validation

## 🛠️ Development

### Available Scripts
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

### Environment Variables
Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:4000/api
```

### Adding New Features
1. Create new page components in `src/pages/`
2. Add API endpoints in `src/services/api.ts`
3. Update routing in `src/App.tsx`
4. Add navigation items in `src/components/Layout/Layout.tsx`

## 🔗 Backend Integration

The frontend expects the backend to be running on `http://localhost:4000` with the following endpoints:

- `GET /api/notes` - List notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- Similar endpoints for projects, PDFs, database, etc.

## 🚀 Deployment

### Build for Production
```bash
pnpm build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5175
CMD ["npm", "run", "preview"]
```

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow Material-UI design patterns
4. Add proper error handling
5. Include loading states for async operations

## 📄 License

This project is part of the Electronic Lab Notebook application. 