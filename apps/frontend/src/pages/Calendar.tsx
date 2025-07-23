import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getNotes } from '../services/api';
import { colorPalettes, NOTE_TYPE_TO_PALETTE_ROLE } from '../services/colorPalettes';
import { useThemePalette } from '../services/ThemePaletteContext';

const getUniqueTypes = (notes: any[]) => {
    const types = notes.map(n => n.type || 'default');
    return Array.from(new Set(types));
};

const getPaletteNames = () => Object.keys(colorPalettes);

const getInitialPalette = (): string => {
    const saved = localStorage.getItem('calendarPalette');
    const names = getPaletteNames();
    return (saved && names.includes(saved)) ? saved : names[0];
};

const Calendar: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [palette, setPalette] = useState<string>(getInitialPalette());
    const [typeColorMap, setTypeColorMap] = useState<Record<string, string>>({});
    const { palette: themePalette } = useThemePalette();

    useEffect(() => {
        // Fetch notes and map to FullCalendar events
        getNotes()
            .then((data) => {
                if (data && data.notes) {
                    const types = getUniqueTypes(data.notes);
                    // Map each type to a palette role color
                    const map: Record<string, string> = {};
                    types.forEach((type) => {
                        const role = NOTE_TYPE_TO_PALETTE_ROLE[type] || 'background';
                        map[type] = themePalette[role];
                    });
                    setTypeColorMap(map);
                    setEvents(
                        data.notes.map((note: any) => ({
                            id: note.id,
                            title: note.title || note.content || 'Note',
                            start: note.date,
                            allDay: true,
                            backgroundColor: map[note.type || 'daily'],
                            borderColor: map[note.type || 'daily'],
                        }))
                    );
                }
            })
            .catch((err) => {
                // Optionally handle error
            });
    }, [palette]);

    const handlePaletteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPalette(e.target.value);
        localStorage.setItem('calendarPalette', e.target.value);
    };

    return (
        <div style={{ width: '100%', height: '100%', minHeight: 600 }}>
            <div style={{ marginBottom: 16 }}>
                <label htmlFor="palette-select" style={{ marginRight: 8 }}>Color Palette:</label>
                <select id="palette-select" value={palette} onChange={handlePaletteChange}>
                    {getPaletteNames().map(name => (
                        <option key={name} value={name}>{name.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}</option>
                    ))}
                </select>
            </div>
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                height="auto"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth',
                }}
            />
        </div>
    );
};

export default Calendar; 