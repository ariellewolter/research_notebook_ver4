import { useState, useEffect } from 'react';
import { linksApi, notesApi, databaseApi, protocolsApi, recipesApi, pdfsApi } from '../services/api';

export const useProjectLinking = (projectId?: string) => {
    const [linkedNotes, setLinkedNotes] = useState<any[]>([]);
    const [linkedDatabaseEntries, setLinkedDatabaseEntries] = useState<any[]>([]);
    const [linkedProtocols, setLinkedProtocols] = useState<any[]>([]);
    const [linkedRecipes, setLinkedRecipes] = useState<any[]>([]);
    const [linkedPDFs, setLinkedPDFs] = useState<any[]>([]);
    const [allNotes, setAllNotes] = useState<any[]>([]);
    const [allDatabaseEntries, setAllDatabaseEntries] = useState<any[]>([]);
    const [allProtocols, setAllProtocols] = useState<any[]>([]);
    const [allRecipes, setAllRecipes] = useState<any[]>([]);
    const [allPDFs, setAllPDFs] = useState<any[]>([]);
    const [creatingNote, setCreatingNote] = useState(false);
    const [creatingDatabaseEntry, setCreatingDatabaseEntry] = useState(false);
    const [creatingRecipe, setCreatingRecipe] = useState(false);
    const [creatingPDF, setCreatingPDF] = useState(false);

    // Fetch all notes and database entries for linking
    useEffect(() => {
        if (projectId) {
            notesApi.getAll().then(res => setAllNotes(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading notes:', err);
                    setAllNotes([]);
                });
            databaseApi.getAll().then(res => setAllDatabaseEntries(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading database entries:', err);
                    setAllDatabaseEntries([]);
                });
            // Fetch existing links for this project
            linksApi.getOutgoing('project', projectId).then(res => {
                const links = Array.isArray(res.data) ? res.data : [];
                setLinkedNotes(links.filter((l: any) => l.targetType === 'note').map((l: any) => l.note));
                setLinkedDatabaseEntries(links.filter((l: any) => l.targetType === 'databaseEntry').map((l: any) => l.databaseEntry));
            }).catch(err => {
                console.error('Error loading links:', err);
                setLinkedNotes([]);
                setLinkedDatabaseEntries([]);
            });
        }
    }, [projectId]);

    // Fetch all protocols, recipes, and PDFs for linking
    useEffect(() => {
        if (projectId) {
            protocolsApi.getAll().then(res => setAllProtocols(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading protocols:', err);
                    setAllProtocols([]);
                });
            recipesApi.getAll().then(res => setAllRecipes(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading recipes:', err);
                    setAllRecipes([]);
                });
            pdfsApi.getAll().then(res => setAllPDFs(Array.isArray(res.data) ? res.data : []))
                .catch(err => {
                    console.error('Error loading PDFs:', err);
                    setAllPDFs([]);
                });
            // Fetch existing links for this project
            linksApi.getOutgoing('project', projectId).then(res => {
                const links = Array.isArray(res.data) ? res.data : [];
                setLinkedProtocols(links.filter((l: any) => l.targetType === 'protocol').map((l: any) => l.protocol));
                setLinkedRecipes(links.filter((l: any) => l.targetType === 'recipe').map((l: any) => l.recipe));
                setLinkedPDFs(links.filter((l: any) => l.targetType === 'pdf').map((l: any) => l.pdf));
            }).catch(err => {
                console.error('Error loading links:', err);
                setLinkedProtocols([]);
                setLinkedRecipes([]);
                setLinkedPDFs([]);
            });
        }
    }, [projectId]);

    const handleLinkNote = async (noteId: string) => {
        if (!projectId) return;
        await linksApi.create({ sourceType: 'project', sourceId: projectId, targetType: 'note', targetId: noteId });
        const note = allNotes.find((n: any) => n.id === noteId);
        setLinkedNotes(prev => [...prev, note]);
    };

    const handleUnlinkNote = async (noteId: string) => {
        if (!projectId) return;
        const links = await linksApi.getOutgoing('project', projectId);
        const link = (links.data || []).find((l: any) => l.targetType === 'note' && l.targetId === noteId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedNotes(prev => prev.filter((n: any) => n.id !== noteId));
        }
    };

    const handleCreateNote = async (title: string) => {
        setCreatingNote(true);
        try {
            const res = await notesApi.create({ title, content: '', type: 'project' });
            setAllNotes(prev => [...prev, res.data]);
            if (projectId) await handleLinkNote(res.data.id);
        } finally {
            setCreatingNote(false);
        }
    };

    const handleLinkDatabaseEntry = async (entryId: string) => {
        if (!projectId) return;
        await linksApi.create({ sourceType: 'project', sourceId: projectId, targetType: 'databaseEntry', targetId: entryId });
        const entry = allDatabaseEntries.find((e: any) => e.id === entryId);
        setLinkedDatabaseEntries(prev => [...prev, entry]);
    };

    const handleUnlinkDatabaseEntry = async (entryId: string) => {
        if (!projectId) return;
        const links = await linksApi.getOutgoing('project', projectId);
        const link = (links.data || []).find((l: any) => l.targetType === 'databaseEntry' && l.targetId === entryId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedDatabaseEntries(prev => prev.filter((e: any) => e.id !== entryId));
        }
    };

    const handleCreateDatabaseEntry = async (name: string) => {
        setCreatingDatabaseEntry(true);
        try {
            const res = await databaseApi.create({ type: 'GENERIC', name });
            setAllDatabaseEntries(prev => [...prev, res.data]);
            if (projectId) await handleLinkDatabaseEntry(res.data.id);
        } finally {
            setCreatingDatabaseEntry(false);
        }
    };

    const handleLinkProtocol = async (protocolId: string) => {
        if (!projectId) return;
        await linksApi.create({ sourceType: 'project', sourceId: projectId, targetType: 'protocol', targetId: protocolId });
        const protocol = allProtocols.find((p: any) => p.id === protocolId);
        setLinkedProtocols(prev => [...prev, protocol]);
    };

    const handleUnlinkProtocol = async (protocolId: string) => {
        if (!projectId) return;
        const links = await linksApi.getOutgoing('project', projectId);
        const link = (links.data || []).find((l: any) => l.targetType === 'protocol' && l.targetId === protocolId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedProtocols(prev => prev.filter((p: any) => p.id !== protocolId));
        }
    };

    const handleLinkRecipe = async (recipeId: string) => {
        if (!projectId) return;
        await linksApi.create({ sourceType: 'project', sourceId: projectId, targetType: 'recipe', targetId: recipeId });
        const recipe = allRecipes.find((r: any) => r.id === recipeId);
        setLinkedRecipes(prev => [...prev, recipe]);
    };

    const handleUnlinkRecipe = async (recipeId: string) => {
        if (!projectId) return;
        const links = await linksApi.getOutgoing('project', projectId);
        const link = (links.data || []).find((l: any) => l.targetType === 'recipe' && l.targetId === recipeId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedRecipes(prev => prev.filter((r: any) => r.id !== recipeId));
        }
    };

    const handleCreateRecipe = async (name: string) => {
        setCreatingRecipe(true);
        try {
            const res = await recipesApi.create({ name });
            setAllRecipes(prev => [...prev, res.data]);
            if (projectId) await handleLinkRecipe(res.data.id);
        } finally {
            setCreatingRecipe(false);
        }
    };

    const handleLinkPDF = async (pdfId: string) => {
        if (!projectId) return;
        await linksApi.create({ sourceType: 'project', sourceId: projectId, targetType: 'pdf', targetId: pdfId });
        const pdf = allPDFs.find((p: any) => p.id === pdfId);
        setLinkedPDFs(prev => [...prev, pdf]);
    };

    const handleUnlinkPDF = async (pdfId: string) => {
        if (!projectId) return;
        const links = await linksApi.getOutgoing('project', projectId);
        const link = (links.data || []).find((l: any) => l.targetType === 'pdf' && l.targetId === pdfId);
        if (link) {
            await linksApi.delete(link.id);
            setLinkedPDFs(prev => prev.filter((p: any) => p.id !== pdfId));
        }
    };

    const handleCreatePDF = async (title: string) => {
        setCreatingPDF(true);
        try {
            const res = await pdfsApi.create({ title });
            setAllPDFs(prev => [...prev, res.data]);
            if (projectId) await handleLinkPDF(res.data.id);
        } finally {
            setCreatingPDF(false);
        }
    };

    return {
        linkedNotes,
        linkedDatabaseEntries,
        linkedProtocols,
        linkedRecipes,
        linkedPDFs,
        allNotes,
        allProtocols,
        allRecipes,
        allPDFs,
        allDatabaseEntries,
        creatingNote,
        creatingDatabaseEntry,
        creatingRecipe,
        creatingPDF,
        handleLinkNote,
        handleUnlinkNote,
        handleCreateNote,
        handleLinkDatabaseEntry,
        handleUnlinkDatabaseEntry,
        handleCreateDatabaseEntry,
        handleLinkProtocol,
        handleUnlinkProtocol,
        handleLinkRecipe,
        handleUnlinkRecipe,
        handleCreateRecipe,
        handleLinkPDF,
        handleUnlinkPDF,
        handleCreatePDF,
    };
}; 