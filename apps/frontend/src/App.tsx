import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TouchModeProvider } from './contexts/TouchModeContext';
import { ThemePaletteProvider, useThemePalette } from './services/ThemePaletteContext';
import { WorkspaceTabsProvider } from './pages/WorkspaceTabsContext';
import { EnhancedCommandPaletteProvider } from './components/CommandPalette/EnhancedCommandPaletteProvider';
import GlobalDragDropOverlay from './components/GlobalDragDropOverlay';
import AutomationNotificationsPanel from './components/Notifications/AutomationNotificationsPanel';
import { notificationService } from './services/notificationService';
import './styles/touchMode.css';
import './styles/ipadOptimizations.css';

// Import the new Obsidian-style layout
import ObsidianLayout from './components/Layout/ObsidianLayout';

// Import your existing pages
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Canvas from './pages/Canvas';
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
import ExperimentalVariables from './pages/ExperimentalVariables';
import AdvancedReporting from './pages/AdvancedReporting';
import TimeBlocking from './pages/TimeBlocking';
import Login from './components/Auth/Login';
import ElectronFeatureTest from './components/ElectronFeatureTest';
import DeepLinkDemo from './components/DeepLinkDemo';
import FreeformDrawingBlockTest from './pages/FreeformDrawingBlockTest';
import BlockRendererTest from './pages/BlockRendererTest';
import IPadTestingSuite from './pages/IPadTestingSuite';

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
                <Route path="canvas" element={<Canvas />} />
                <Route path="canvas/:noteId" element={<Canvas />} />
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
                <Route path="experimental-variables" element={<ExperimentalVariables />} />
                <Route path="advanced-reporting" element={<AdvancedReporting />} />
                <Route path="time-blocking" element={<TimeBlocking />} />
                <Route path="electron-test" element={<ElectronFeatureTest />} />
                <Route path="deep-link-demo" element={<DeepLinkDemo />} />
                <Route path="drawing-block-test" element={<FreeformDrawingBlockTest />} />
                <Route path="block-renderer-test" element={<BlockRendererTest />} />
                <Route path="ipad-testing-suite" element={<IPadTestingSuite />} />

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};

// Themed app wrapper
const ThemedApp: React.FC = () => {
    const { palette } = useThemePalette();
    const [notificationsPanelOpen, setNotificationsPanelOpen] = React.useState(false);

    const theme = createTheme({
        palette: {
            mode: 'light', // Default to light mode
            primary: {
                main: palette.primary,
            },
            secondary: {
                main: palette.secondary,
            },
            background: {
                default: palette.background,
                paper: palette.paper,
            },
            text: {
                primary: palette.text,
                secondary: palette.text,
            },
            error: {
                main: palette.error,
            },
            success: {
                main: palette.success,
            },
            warning: {
                main: palette.warning,
            },
            info: {
                main: palette.info,
            },
            divider: palette.divider,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: palette.background,
                        color: palette.text,
                    },
                },
            },
        },
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <EnhancedCommandPaletteProvider navigate={(path) => window.location.href = path}>
                <GlobalDragDropOverlay />
                <AutomationNotificationsPanel
                    open={notificationsPanelOpen}
                    onClose={() => setNotificationsPanelOpen(false)}
                />
                <TouchModeProvider>
                    <ProtectedRoutes />
                </TouchModeProvider>
            </EnhancedCommandPaletteProvider>
        </ThemeProvider>
    );
};

// Main App component
const App: React.FC = () => (
    <Router>
        <AuthProvider>
            <ThemePaletteProvider>
                <WorkspaceTabsProvider>
                    <ThemedApp />
                </WorkspaceTabsProvider>
            </ThemePaletteProvider>
        </AuthProvider>
    </Router>
);

export default App; 