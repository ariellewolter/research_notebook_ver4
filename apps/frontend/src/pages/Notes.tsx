import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Note as NoteIcon,
    Link as LinkIcon,
    Search as SearchIcon,
    Filter as FilterIcon,
    Download as DownloadIcon,
    Book as BookIcon
} from '@mui/icons-material';

// Import our new UI components
import { Button, Card, Input, PanelLayout, SidebarNav } from '../components/UI/index.js';
import UniversalLinking from '../components/UniversalLinking/UniversalLinking';
import LinkRenderer from '../components/UniversalLinking/LinkRenderer';
import NotesPaginationMode from '../components/Notes/NotesPaginationMode';

// Import existing services and utilities
import { notesApi, linksApi, databaseApi, projectsApi } from '../services/api';
import { useThemePalette } from '../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import { saveFileDialog } from '../utils/fileSystemAPI';

interface Note {
    id: string;
    title: string;
    content: string;
    type: 'daily' | 'experiment' | 'literature';
    date: string;
    createdAt: string;
    updatedAt?: string;
}

const NotesView = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [paginationMode, setPaginationMode] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { palette } = useThemePalette();

    useEffect(() => {
        loadNotes();
    }, []);

    // Check if we should show the new note form based on URL
    useEffect(() => {
        if (location.pathname === '/notes/new') {
            setIsCreating(true);
            setSelectedNote(null);
            setEditingNote(null);
        }
    }, [location.pathname]);

    useEffect(() => {
        filterNotes();
    }, [notes, searchTerm, filterType]);

    const loadNotes = async () => {
        try {
            setLoading(true);
            const response = await notesApi.getAll();
            // Ensure notes is always an array
            const notesData = Array.isArray(response.data) ? response.data :
                Array.isArray(response.data.notes) ? response.data.notes :
                    Array.isArray(response.data.items) ? response.data.items : [];
            setNotes(notesData);
        } catch (error) {
            console.error('Error loading notes:', error);
            setNotes([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const filterNotes = () => {
        let filtered = Array.isArray(notes) ? notes : [];

        if (searchTerm) {
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterType !== 'all') {
            filtered = filtered.filter(note => note.type === filterType);
        }

        setFilteredNotes(filtered);
    };

    const handleNoteSelect = (note: Note) => {
        setSelectedNote(note);
        setEditingNote(null);
        setIsCreating(false);
    };

    const handleCreateNote = () => {
        setIsCreating(true);
        setSelectedNote(null);
        setEditingNote(null);
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setIsCreating(false);
        setSelectedNote(note);
    };

    const handleDeleteNote = async (noteId: string) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await notesApi.delete(noteId);
                await loadNotes();
                if (selectedNote?.id === noteId) {
                    setSelectedNote(null);
                }
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    };

    const handleExportNotes = async () => {
        const exportData = {
            notes: filteredNotes,
            exportDate: new Date().toISOString(),
            totalNotes: filteredNotes.length,
            filters: {
                searchTerm,
                filterType
            }
        };

        const content = JSON.stringify(exportData, null, 2);
        const filename = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
        
        try {
            const result = await saveFileDialog(content, filename);
            
            if (result.success) {
                console.log('Notes exported successfully');
            } else if (result.canceled) {
                console.log('Export canceled');
            } else {
                console.error('Export failed:', result.error);
            }
        } catch (error) {
            console.error('Error exporting notes:', error);
        }
    };

    const getTypeColor = (type: string) => {
        const role = NOTE_TYPE_TO_PALETTE_ROLE[type];
        return palette?.[role] || '#6366f1';
    };

    // Left Panel - Notes List
    const leftPanel = (
        <PanelLayout.Panel className="h-full" scrollable>
            <PanelLayout.Header>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => setPaginationMode(true)}
                            className="flex items-center gap-2"
                            disabled={filteredNotes.length === 0}
                        >
                            <BookIcon className="w-4 h-4" />
                            Pagination Mode
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleExportNotes}
                            className="flex items-center gap-2"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            Export
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleCreateNote}
                            className="flex items-center gap-2"
                        >
                            <AddIcon className="w-4 h-4" />
                            New Note
                        </Button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="space-y-3">
                    <Input
                        placeholder="Search notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />

                    <div className="flex gap-2">
                        <Button
                            variant={filterType === 'all' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={filterType === 'daily' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('daily')}
                        >
                            Daily
                        </Button>
                        <Button
                            variant={filterType === 'experiment' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('experiment')}
                        >
                            Experiment
                        </Button>
                        <Button
                            variant={filterType === 'literature' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterType('literature')}
                        >
                            Literature
                        </Button>
                    </div>
                </div>
            </PanelLayout.Header>

            <PanelLayout.Content>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                        <NoteIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No notes found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotes.map((note) => (
                            <Card
                                key={note.id}
                                hover
                                className={`cursor-pointer transition-all duration-200 ${selectedNote?.id === note.id ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                onClick={() => handleNoteSelect(note)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className="inline-block w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getTypeColor(note.type) }}
                                            />
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {note.title}
                                            </h3>
                                            <span className="text-xs text-gray-500 capitalize">
                                                {note.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                            {note.content.substring(0, 120)}...
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(note.date || note.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditNote(note);
                                            }}
                                            className="p-1 h-8 w-8"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNote(note.id);
                                            }}
                                            className="p-1 h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <DeleteIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </PanelLayout.Content>
        </PanelLayout.Panel>
    );

    // Right Panel - Note Editor/Viewer
    const rightPanel = (
        <PanelLayout.Panel className="h-full" scrollable>
            {isCreating || editingNote ? (
                <NoteEditor
                    note={editingNote}
                    onSave={async (noteData) => {
                        try {
                            if (editingNote) {
                                await notesApi.update(editingNote.id, noteData);
                            } else {
                                await notesApi.create(noteData);
                            }
                            await loadNotes();
                            setIsCreating(false);
                            setEditingNote(null);
                        } catch (error) {
                            console.error('Error saving note:', error);
                        }
                    }}
                    onCancel={() => {
                        setIsCreating(false);
                        setEditingNote(null);
                    }}
                />
            ) : selectedNote ? (
                <NoteViewer note={selectedNote} onEdit={() => handleEditNote(selectedNote)} />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                        <NoteIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">Select a note to view</p>
                        <p className="text-sm">Or create a new note to get started</p>
                    </div>
                </div>
            )}
        </PanelLayout.Panel>
    );

    // Show pagination mode if active
    if (paginationMode) {
        return (
            <NotesPaginationMode
                notes={filteredNotes}
                selectedNote={selectedNote}
                onNoteSelect={handleNoteSelect}
                onEdit={handleEditNote}
                onClose={() => setPaginationMode(false)}
            />
        );
    }

    return (
        <div className="h-screen bg-gray-50">
            <PanelLayout
                leftPanel={leftPanel}
                rightPanel={rightPanel}
                leftSize="sm"
                className="h-full"
            />
        </div>
    );
};

// Note Editor Component
const NoteEditor = ({ note, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: note?.title || '',
        content: note?.content || '',
        type: note?.type || 'daily',
        date: note?.date || new Date().toISOString().split('T')[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="h-full flex flex-col">
            <PanelLayout.Header>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {note ? 'Edit Note' : 'Create Note'}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            Save
                        </Button>
                    </div>
                </div>
            </PanelLayout.Header>

            <PanelLayout.Content>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="daily">Daily</option>
                                <option value="experiment">Experiment</option>
                                <option value="literature">Literature</option>
                            </select>
                        </div>

                        <Input
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content
                        </label>
                        <UniversalLinking
                            value={formData.content}
                            onChange={(value) => setFormData({ ...formData, content: value })}
                            multiline={true}
                            rows={15}
                            placeholder="Type your note content here. Use [[ to link to other items or / for commands..."
                        />
                    </div>
                </form>
            </PanelLayout.Content>
        </div>
    );
};

// Note Viewer Component
const NoteViewer = ({ note, onEdit }) => {
    const { currentPalette } = useThemePalette();

    const getTypeColor = (type) => {
        const role = NOTE_TYPE_TO_PALETTE_ROLE[type];
        return currentPalette?.[role] || '#6366f1';
    };

    return (
        <div className="h-full flex flex-col">
            <PanelLayout.Header>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span
                            className="inline-block w-4 h-4 rounded-full"
                            style={{ backgroundColor: getTypeColor(note.type) }}
                        />
                        <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onEdit}>
                            <EditIcon className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="ghost">
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Links
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                    <span className="capitalize font-medium">{note.type} Note</span>
                    <span>•</span>
                    <span>{new Date(note.date || note.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Last updated {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                </div>
            </PanelLayout.Header>

            <PanelLayout.Content>
                <Card className="h-full">
                    <Card.Content className="h-full">
                        <div className="prose max-w-none">
                            <div className="text-gray-700 leading-relaxed">
                                <LinkRenderer content={note.content} />
                            </div>
                        </div>
                    </Card.Content>
                </Card>
            </PanelLayout.Content>
        </div>
    );
};

export default NotesView; 