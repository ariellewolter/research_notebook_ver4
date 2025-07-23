import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Layout from './components/Layout/Layout';
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
import { ThemePaletteProvider, useThemePalette } from './services/ThemePaletteContext';
import { WorkspaceTabsProvider } from './pages/WorkspaceTabsContext';

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
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Workspace />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/old-dashboard" element={<OldDashboard />} />
                        <Route path="/dashboard" element={<ResearchDashboard />} />
                        {/* Redirect all old entity routes to workspace */}
                        <Route path="/notes" element={<Navigate to="/" replace />} />
                        <Route path="/protocols" element={<Protocols />} />
                        <Route path="/recipes" element={<Navigate to="/" replace />} />
                        <Route path="/pdfs" element={<Navigate to="/" replace />} />
                        <Route path="/projects" element={<Navigate to="/" replace />} />
                        <Route path="/tables" element={<Navigate to="/" replace />} />
                        <Route path="/database" element={<Navigate to="/" replace />} />
                        <Route path="/experiments" element={<ExperimentsDashboard />} />
                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Router>
        </ThemeProvider>
    );
};

const App: React.FC = () => (
    <ThemePaletteProvider>
        <WorkspaceTabsProvider>
            <ThemedApp />
        </WorkspaceTabsProvider>
    </ThemePaletteProvider>
);

export default App; 