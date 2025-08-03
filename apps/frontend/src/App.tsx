import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemePaletteProvider, useThemePalette } from './services/ThemePaletteContext';
import { WorkspaceTabsProvider } from './pages/WorkspaceTabsContext';
import { CommandPaletteProvider } from './components/CommandPalette/CommandPaletteProvider';

// Import the new Obsidian-style layout
import ObsidianLayout from './components/Layout/ObsidianLayout';

// Import your existing pages
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Protocols from './pages/Protocols';
import Recipes from './pages/Recipes';
import PDFManagement from './pages/PDFManagement';
import Projects from './pages/Projects';
import ExperimentsDashboard from './pages/ExperimentsDashboard';
import Tables from './pages/Tables';
import Database from './pages/Database';
import LiteratureNotes from './pages/LiteratureNotes';
import Calculators from './pages/Calculators';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import Links from './pages/Links';
import Settings from './pages/Settings';
import AdvancedFeatures from './pages/AdvancedFeatures';
import Login from './components/Auth/Login';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();

    console.log('ProtectedRoute check:', { user, isAuthenticated });

    if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    console.log('Authenticated, rendering children');
    return <>{children}</>;
};

// Main protected routes with Obsidian layout
const ProtectedRoutes: React.FC = () => {
    const { login } = useAuth();

    return (
        <Routes>
            {/* Login route (no layout) */}
            <Route path="/login" element={<Login onLogin={login} />} />

            {/* All other routes use the Obsidian layout */}
            <Route path="/" element={
                <ProtectedRoute>
                    <ObsidianLayout />
                </ProtectedRoute>
            }>
                {/* Default route */}
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* All main application routes */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="tasks/:id" element={<Tasks />} />
                <Route path="notes" element={<Notes />} />
                <Route path="notes/new" element={<Notes />} />
                <Route path="notes/:id" element={<Notes />} />
                <Route path="protocols" element={<Protocols />} />
                <Route path="protocols/new" element={<Protocols />} />
                <Route path="protocols/:id" element={<Protocols />} />
                <Route path="recipes" element={<Recipes />} />
                <Route path="recipes/new" element={<Recipes />} />
                <Route path="recipes/:id" element={<Recipes />} />
                <Route path="pdfs" element={<PDFManagement />} />
                <Route path="pdfs/:id" element={<PDFManagement />} />
                <Route path="pdf-management" element={<PDFManagement />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/new" element={<Projects />} />
                <Route path="projects/:id" element={<Projects />} />
                <Route path="experiments" element={<ExperimentsDashboard />} />
                <Route path="experiments/new" element={<ExperimentsDashboard />} />
                <Route path="experiments/:id" element={<ExperimentsDashboard />} />
                <Route path="tables" element={<Tables />} />
                <Route path="tables/:id" element={<Tables />} />
                <Route path="database" element={<Database />} />
                <Route path="database/:id" element={<Database />} />
                <Route path="literature" element={<LiteratureNotes />} />
                <Route path="literature/:id" element={<LiteratureNotes />} />
                <Route path="calculators" element={<Calculators />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="search" element={<Search />} />
                <Route path="links" element={<Links />} />
                <Route path="settings" element={<Settings />} />
                <Route path="advanced-features" element={<AdvancedFeatures />} />

                {/* Workspace routes */}
                <Route path="workspace/new" element={<div>New Workspace</div>} />
                <Route path="workspace/:id" element={<div>Workspace</div>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};

// Themed app wrapper
const ThemedApp: React.FC = () => {
    const { palette } = useThemePalette();

    const theme = createTheme({
        palette: {
            primary: { main: palette.primary },
            secondary: { main: palette.secondary },
            background: {
                default: palette.background,
                paper: palette.paper,
            },
            text: {
                primary: palette.text,
            },
            error: { main: palette.error },
            success: { main: palette.success },
            warning: { main: palette.warning },
            info: { main: palette.info },
            divider: palette.divider,
        },
        // Enhanced theme for Obsidian-style workspace
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        margin: 0,
                        padding: 0,
                        overflow: 'hidden',
                    },
                    '#root': {
                        height: '100vh',
                        width: '100vw',
                        overflow: 'hidden',
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    }
                }
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        borderRadius: 0,
                    }
                }
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        minWidth: 'auto',
                        padding: '6px 12px',
                    }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                    }
                }
            }
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 600 },
            h2: { fontWeight: 600 },
            h3: { fontWeight: 600 },
            h4: { fontWeight: 600 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
        },
        shape: {
            borderRadius: 8,
        },
        spacing: 8,
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <CommandPaletteProvider>
                    <ProtectedRoutes />
                </CommandPaletteProvider>
            </Router>
        </ThemeProvider>
    );
};

// Main App component
const App: React.FC = () => (
    <AuthProvider>
        <ThemePaletteProvider>
            <WorkspaceTabsProvider>
                <ThemedApp />
            </WorkspaceTabsProvider>
        </ThemePaletteProvider>
    </AuthProvider>
);

export default App; 