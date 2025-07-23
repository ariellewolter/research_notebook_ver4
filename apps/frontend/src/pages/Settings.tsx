import React, { useState, useEffect } from 'react';
import { colorPalettes, Palette, PaletteRole } from '../services/colorPalettes';
import { useThemePalette } from '../services/ThemePaletteContext';
import { zoteroApi } from '../services/api';

const CUSTOM_PALETTE_KEY = 'Custom';
const PALETTE_ROLES: PaletteRole[] = [
    'primary',
    'secondary',
    'background',
    'paper',
    'text',
    'error',
    'success',
    'warning',
    'info',
    'divider',
];

const defaultCustom: Palette = {
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#fafafa',
    paper: '#ffffff',
    text: '#22223B',
    error: '#FF6F61',
    success: '#06D6A0',
    warning: '#FFD166',
    info: '#118AB2',
    divider: '#E0E0E0',
};

const NOTE_OPEN_BEHAVIOR_KEY = 'noteOpenBehavior';
const NOTE_OPEN_BEHAVIOR_OPTIONS = [
    { value: 'modal', label: 'Modal (popup)' },
    { value: 'page', label: 'New Page' },
];

const ZOTERO_API_KEY = 'zoteroApiKey';
const ZOTERO_USER_ID = 'zoteroUserId';

const BIBLIO_STYLE_KEY = 'biblioStyle';
const BIBLIO_STYLES = [
    { value: 'apa', label: 'APA' },
    { value: 'mla', label: 'MLA' },
    { value: 'chicago', label: 'Chicago' },
    { value: 'vancouver', label: 'Vancouver' },
    { value: 'harvard', label: 'Harvard' },
    { value: 'nature', label: 'Nature' },
    { value: 'ieee', label: 'IEEE' },
    // Add more as needed
];

const Settings: React.FC = () => {
    const { paletteName, setPaletteName, setCustomPalette, palette } = useThemePalette();
    const [custom, setCustom] = useState<Palette>(() => {
        const saved = localStorage.getItem('customPalette');
        return saved ? JSON.parse(saved) : defaultCustom;
    });
    const [noteOpenBehavior, setNoteOpenBehavior] = useState<string>(() => {
        return localStorage.getItem(NOTE_OPEN_BEHAVIOR_KEY) || 'modal';
    });
    const [zoteroApiKey, setZoteroApiKey] = useState(() => localStorage.getItem(ZOTERO_API_KEY) || '');
    const [zoteroUserId, setZoteroUserId] = useState(() => localStorage.getItem(ZOTERO_USER_ID) || '');
    const [zoteroStatus, setZoteroStatus] = useState<'connected' | 'disconnected'>(
        () => (localStorage.getItem(ZOTERO_API_KEY) && localStorage.getItem(ZOTERO_USER_ID)) ? 'connected' : 'disconnected'
    );
    const [zoteroSaved, setZoteroSaved] = useState(false);
    const [zoteroTestStatus, setZoteroTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [zoteroTestMessage, setZoteroTestMessage] = useState('');
    const [biblioStyle, setBiblioStyle] = useState(() => localStorage.getItem(BIBLIO_STYLE_KEY) || 'apa');

    useEffect(() => {
        if (paletteName === CUSTOM_PALETTE_KEY && setCustomPalette) {
            setCustomPalette(custom);
        }
        // eslint-disable-next-line
    }, [custom]);

    useEffect(() => {
        localStorage.setItem(NOTE_OPEN_BEHAVIOR_KEY, noteOpenBehavior);
    }, [noteOpenBehavior]);

    useEffect(() => {
        localStorage.setItem(BIBLIO_STYLE_KEY, biblioStyle);
    }, [biblioStyle]);

    const handleColorChange = (role: PaletteRole, value: string) => {
        setCustom((prev) => ({ ...prev, [role]: value }));
    };

    const handlePaletteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        setPaletteName(name);
        if (name === CUSTOM_PALETTE_KEY && setCustomPalette) {
            setCustomPalette(custom);
        }
    };

    const handleSaveZotero = () => {
        localStorage.setItem(ZOTERO_API_KEY, zoteroApiKey);
        localStorage.setItem(ZOTERO_USER_ID, zoteroUserId);
        setZoteroStatus(zoteroApiKey && zoteroUserId ? 'connected' : 'disconnected');
        setZoteroSaved(true);
        setTimeout(() => setZoteroSaved(false), 2000);
    };

    const handleTestZotero = async () => {
        setZoteroTestStatus('loading');
        setZoteroTestMessage('');
        try {
            await zoteroApi.config({ apiKey: zoteroApiKey, userId: zoteroUserId });
            setZoteroTestStatus('success');
            setZoteroTestMessage('Zotero connection successful!');
        } catch (err: any) {
            setZoteroTestStatus('error');
            setZoteroTestMessage(err?.response?.data?.error || 'Failed to connect to Zotero.');
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
            <h1>Settings</h1>
            <section style={{ marginBottom: 32 }}>
                <h2>Theme & Color Palette</h2>
                <label htmlFor="palette-select" style={{ marginRight: 8 }}>Color Palette:</label>
                <select
                    id="palette-select"
                    value={paletteName}
                    onChange={handlePaletteChange}
                >
                    {Object.keys(colorPalettes).map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                    <option value={CUSTOM_PALETTE_KEY}>Custom Palette</option>
                </select>
            </section>
            {paletteName === CUSTOM_PALETTE_KEY && (
                <section style={{ marginBottom: 32 }}>
                    <h3>Custom Palette Editor</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {PALETTE_ROLES.map((role) => (
                            <div key={role} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 120 }}>
                                <label htmlFor={`color-${role}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</label>
                                <input
                                    id={`color-${role}`}
                                    type="color"
                                    value={custom[role]}
                                    onChange={(e) => handleColorChange(role, e.target.value)}
                                    style={{ width: 48, height: 32, border: 'none', background: 'none' }}
                                />
                                <span style={{ fontSize: 12 }}>{custom[role]}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            <section style={{ marginBottom: 32 }}>
                <h2>Note Open Behavior</h2>
                <label htmlFor="note-open-behavior-select" style={{ marginRight: 8 }}>Open notes in:</label>
                <select
                    id="note-open-behavior-select"
                    value={noteOpenBehavior}
                    onChange={e => setNoteOpenBehavior(e.target.value)}
                >
                    {NOTE_OPEN_BEHAVIOR_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </section>
            <section style={{ marginBottom: 32 }}>
                <h2>Bibliography Style</h2>
                <label htmlFor="biblio-style-select" style={{ marginRight: 8 }}>Citation/Bibliography Style:</label>
                <select
                    id="biblio-style-select"
                    value={biblioStyle}
                    onChange={e => setBiblioStyle(e.target.value)}
                >
                    {BIBLIO_STYLES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    <span>This style will be used for all Zotero citations and bibliographies in your notes and protocols.</span>
                </div>
            </section>
            {/* Add more settings sections here */}
            <section style={{ marginBottom: 32 }}>
                <h2>Zotero Integration</h2>
                <div style={{ marginBottom: 8 }}>
                    <label htmlFor="zotero-api-key" style={{ marginRight: 8 }}>API Key:</label>
                    <input
                        id="zotero-api-key"
                        type="text"
                        value={zoteroApiKey}
                        onChange={e => setZoteroApiKey(e.target.value)}
                        style={{ width: 300 }}
                        placeholder="Paste your Zotero API key"
                    />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <label htmlFor="zotero-user-id" style={{ marginRight: 8 }}>User/Library ID:</label>
                    <input
                        id="zotero-user-id"
                        type="text"
                        value={zoteroUserId}
                        onChange={e => setZoteroUserId(e.target.value)}
                        style={{ width: 200 }}
                        placeholder="Your Zotero user or group ID"
                    />
                </div>
                <button onClick={handleSaveZotero} style={{ marginRight: 16 }}>Save</button>
                <button onClick={handleTestZotero} disabled={zoteroTestStatus === 'loading'}>Test Connection</button>
                {zoteroTestStatus === 'loading' && <span style={{ marginLeft: 8 }}>Testing...</span>}
                {zoteroTestStatus === 'success' && <span style={{ color: 'green', marginLeft: 8 }}>{zoteroTestMessage}</span>}
                {zoteroTestStatus === 'error' && <span style={{ color: 'red', marginLeft: 8 }}>{zoteroTestMessage}</span>}
                <div style={{ marginTop: 8 }}>
                    Status: <b style={{ color: zoteroStatus === 'connected' ? 'green' : 'red' }}>{zoteroStatus === 'connected' ? 'Connected' : 'Disconnected'}</b>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    <span>Find your API key and user ID at <a href="https://www.zotero.org/settings/keys" target="_blank" rel="noopener noreferrer">zotero.org/settings/keys</a>.</span>
                </div>
            </section>
        </div>
    );
};

export default Settings; 