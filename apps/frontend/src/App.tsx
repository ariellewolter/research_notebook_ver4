import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import OldDashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Journal from './pages/Journal';
import Calendar from './pages/Calendar';
import Projects from './pages/Projects';
import PDFs from './pages/PDFs';
import Database from './pages/Database';
import Tables from './pages/Tables';
import Protocols from './pages/Protocols';
import Recipes from './pages/Recipes';
import Zotero from './pages/Zotero';
import Settings from './pages/Settings';
import ResearchDashboard from './pages/ResearchDashboard';
import Workspace from './pages/Workspace';
import ExperimentsDashboard from './pages/ExperimentsDashboard';
import Tasks from './pages/Tasks';
import LiteratureNotes from './pages/LiteratureNotes';
import Calculators from './pages/Calculators';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import { ThemePaletteProvider, useThemePalette } from './services/ThemePaletteContext';
import { WorkspaceTabsProvider } from './pages/WorkspaceTabsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoutes: React.FC = () => {
    const { isAuthenticated, login } = useAuth();

    if (!isAuthenticated) {
        return <Login onLogin={login} />;
    }

    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<ResearchDashboard />} />
                <Route path="/dashboard" element={<ResearchDashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/old-dashboard" element={<OldDashboard />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/protocols" element={<Protocols />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/pdfs" element={<PDFs />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/tables" element={<Tables />} />
                <Route path="/database" element={<Database />} />
                <Route path="/experiments" element={<ExperimentsDashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/literature" element={<LiteratureNotes />} />
                <Route path="/calculators" element={<Calculators />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/search" element={<Search />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
};

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
    });
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <ProtectedRoutes />
            </Router>
        </ThemeProvider>
    );
};

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