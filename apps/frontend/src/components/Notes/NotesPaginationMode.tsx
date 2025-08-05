import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    FirstPage as FirstPageIcon,
    LastPage as LastPageIcon,
    Book as BookIcon,
    Menu as MenuIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { Button, Card } from '../UI/index.js';
import LinkRenderer from '../UniversalLinking/LinkRenderer';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import './NotesPaginationMode.css';

interface Note {
    id: string;
    title: string;
    content: string;
    type: 'daily' | 'experiment' | 'literature';
    date: string;
    createdAt: string;
    updatedAt?: string;
}

interface NotesPaginationModeProps {
    notes: Note[];
    selectedNote: Note | null;
    onNoteSelect: (note: Note) => void;
    onEdit: (note: Note) => void;
    onClose: () => void;
}

interface Page {
    id: string;
    content: string;
    pageNumber: number;
    noteId: string;
    noteTitle: string;
    noteType: string;
    noteDate: string;
}

const NotesPaginationMode: React.FC<NotesPaginationModeProps> = ({
    notes,
    selectedNote,
    onNoteSelect,
    onEdit,
    onClose
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [pages, setPages] = useState<Page[]>([]);
    const [showTableOfContents, setShowTableOfContents] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Swipe gesture handling
    const { handleTouchStart, handleTouchMove, handleTouchEnd, isSwiping } = useSwipeGesture({
        onSwipeLeft: () => {
            if (currentPage < pages.length - 1) {
                setCurrentPage(prev => prev + 1);
            }
        },
        onSwipeRight: () => {
            if (currentPage > 0) {
                setCurrentPage(prev => prev - 1);
            }
        },
        minSwipeDistance: 50
    });

    // Calculate pages from notes content
    useEffect(() => {
        if (!notes.length) {
            setPages([]);
            return;
        }

        const newPages: Page[] = [];
        let pageNumber = 1;

        notes.forEach((note) => {
            const content = note.content || '';
            const words = content.split(' ');
            const wordsPerPage = 300; // Approximate words per page
            const totalPages = Math.ceil(words.length / wordsPerPage);

            if (totalPages === 0) {
                // Empty note gets one page
                newPages.push({
                    id: `${note.id}-page-1`,
                    content: note.content || 'Empty note',
                    pageNumber: pageNumber++,
                    noteId: note.id,
                    noteTitle: note.title,
                    noteType: note.type,
                    noteDate: note.date || note.createdAt
                });
            } else {
                // Split content into pages
                for (let i = 0; i < totalPages; i++) {
                    const startIndex = i * wordsPerPage;
                    const endIndex = Math.min((i + 1) * wordsPerPage, words.length);
                    const pageWords = words.slice(startIndex, endIndex);
                    const pageContent = pageWords.join(' ');

                    newPages.push({
                        id: `${note.id}-page-${i + 1}`,
                        content: pageContent,
                        pageNumber: pageNumber++,
                        noteId: note.id,
                        noteTitle: note.title,
                        noteType: note.type,
                        noteDate: note.date || note.createdAt
                    });
                }
            }
        });

        setPages(newPages);
    }, [notes]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && currentPage > 0) {
                setCurrentPage(prev => prev - 1);
            } else if (e.key === 'ArrowRight' && currentPage < pages.length - 1) {
                setCurrentPage(prev => prev + 1);
            } else if (e.key === 'Home') {
                setCurrentPage(0);
            } else if (e.key === 'End') {
                setCurrentPage(pages.length - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, pages.length]);

    const currentPageData = pages[currentPage];
    const totalPages = pages.length;

    const getTypeColor = (type: string) => {
        const colors = {
            daily: '#3b82f6',
            experiment: '#10b981',
            literature: '#f59e0b'
        };
        return colors[type as keyof typeof colors] || '#6366f1';
    };

    const goToPage = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        setShowTableOfContents(false);
    };

    const goToNote = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            onNoteSelect(note);
            // Find the first page of this note
            const firstPageIndex = pages.findIndex(p => p.noteId === noteId);
            if (firstPageIndex !== -1) {
                setCurrentPage(firstPageIndex);
            }
        }
        setShowTableOfContents(false);
    };

    if (!pages.length) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <BookIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg text-gray-500">No notes to display</p>
                    <p className="text-sm text-gray-400">Create some notes to start reading</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full notes-pagination-container flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTableOfContents(!showTableOfContents)}
                            className="flex items-center gap-2"
                        >
                            <MenuIcon className="w-4 h-4" />
                            Table of Contents
                        </Button>
                        <div className="text-sm text-gray-500">
                            Page {currentPage + 1} of {totalPages}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="flex items-center gap-2"
                        >
                            <CloseIcon className="w-4 h-4" />
                            Exit Pagination Mode
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Table of Contents Sidebar */}
                {showTableOfContents && (
                    <div className="w-80 toc-sidebar overflow-y-auto">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
                            <div className="space-y-2">
                                {notes.map((note) => {
                                    const notePages = pages.filter(p => p.noteId === note.id);
                                    const firstPageIndex = pages.findIndex(p => p.noteId === note.id);
                                    
                                    return (
                                        <div key={note.id} className="border-l-2 border-gray-200 pl-3">
                                            <button
                                                onClick={() => goToNote(note.id)}
                                                className="text-left w-full hover:bg-gray-50 p-2 rounded"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: getTypeColor(note.type) }}
                                                    />
                                                    <span className="font-medium text-sm">{note.title}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {notePages.length} page{notePages.length !== 1 ? 's' : ''} • 
                                                    {new Date(note.date || note.createdAt).toLocaleDateString()}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <div 
                    ref={containerRef}
                    className={`flex-1 flex items-center justify-center p-8 page-container ${isSwiping ? 'swiping' : ''}`}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {currentPageData && (
                        <div className="w-full max-w-4xl">
                            <Card className="min-h-[600px] page-card">
                                <div className="p-8 page-content">
                                    {/* Page Header */}
                                    <div className="mb-6 pb-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: getTypeColor(currentPageData.noteType) }}
                                                />
                                                <h1 className="text-2xl font-bold text-gray-900">
                                                    {currentPageData.noteTitle}
                                                </h1>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Page {currentPageData.pageNumber}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="capitalize font-medium">
                                                {currentPageData.noteType} Note
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {new Date(currentPageData.noteDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Page Content */}
                                    <div className="prose max-w-none">
                                        <div className="text-gray-700 leading-relaxed text-lg">
                                            <LinkRenderer content={currentPageData.content} />
                                        </div>
                                    </div>

                                    {/* Page Footer */}
                                    <div className="mt-8 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>
                                                {currentPageData.noteTitle} • Page {currentPageData.pageNumber}
                                            </span>
                                            <span>
                                                {new Date(currentPageData.noteDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Footer */}
            <div className="nav-controls px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(0)}
                            disabled={currentPage === 0}
                        >
                            <FirstPageIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            disabled={currentPage === 0}
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                            Previous
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            Page {currentPage + 1} of {totalPages}
                        </div>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageIndex = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                                return (
                                    <button
                                        key={pageIndex}
                                        onClick={() => setCurrentPage(pageIndex)}
                                        className={`w-8 h-8 rounded text-sm font-medium page-number-button ${
                                            currentPage === pageIndex ? 'active' : ''
                                        }`}
                                    >
                                        {pageIndex + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === totalPages - 1}
                        >
                            Next
                            <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages - 1)}
                            disabled={currentPage === totalPages - 1}
                        >
                            <LastPageIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesPaginationMode; 