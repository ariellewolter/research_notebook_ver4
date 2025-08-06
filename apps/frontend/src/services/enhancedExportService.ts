import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { blocksApi } from './api/blocksApi';
import { DrawingData } from '../components/blocks/FreeformDrawingBlock';

export interface ExportData {
    projects?: any[];
    experiments?: any[];
    protocols?: any[];
    notes?: any[];
    databaseEntries?: any[];
    tasks?: any[];
    pdfs?: any[];
}

export interface ExportOptions {
    includeMetadata: boolean;
    includeRelationships: boolean;
    includeNotes: boolean;
    includeFiles: boolean;
    includeDrawings: boolean;
    drawingFormat: 'svg' | 'png' | 'both';
    drawingMaxWidth?: number;
    drawingMaxHeight?: number;
}

export interface DrawingExportData {
    blockId: string;
    entityId: string;
    entityType: string;
    svgData: string;
    pngData: string;
    width: number;
    height: number;
    strokes: any[];
    createdAt: string;
    updatedAt: string;
}

class EnhancedExportService {
    /**
     * Extract drawing blocks from content
     */
    private extractDrawingBlocks(content: string): any[] {
        const drawingBlocks: any[] = [];
        const drawingRegex = /```freeform-drawing\s*\n([\s\S]*?)\n```/g;
        let match;

        while ((match = drawingRegex.exec(content)) !== null) {
            try {
                const drawingData = JSON.parse(match[1]);
                drawingBlocks.push(drawingData);
            } catch (error) {
                console.warn('Failed to parse drawing block:', error);
            }
        }

        return drawingBlocks;
    }

    /**
     * Fetch drawing data from backend
     */
    private async fetchDrawingData(entityId: string, entityType: string): Promise<DrawingExportData[]> {
        try {
            const response = await blocksApi.getBlocksByEntity(entityType, entityId);
            return response.data.blocks.map((block: any) => ({
                blockId: block.blockId,
                entityId: block.entityId,
                entityType: block.entityType,
                svgData: block.svgPath,
                pngData: block.pngThumbnail,
                width: block.width,
                height: block.height,
                strokes: JSON.parse(block.strokes),
                createdAt: block.createdAt,
                updatedAt: block.updatedAt
            }));
        } catch (error) {
            console.warn(`Failed to fetch drawings for ${entityType} ${entityId}:`, error);
            return [];
        }
    }

    /**
     * Process content and embed drawings
     */
    private async processContentWithDrawings(content: string, entityId: string, entityType: string, options: ExportOptions): Promise<string> {
        if (!options.includeDrawings) {
            return content;
        }

        // Extract drawing blocks from content
        const drawingBlocks = this.extractDrawingBlocks(content);
        
        // Fetch actual drawing data from backend
        const drawingData = await this.fetchDrawingData(entityId, entityType);
        
        // Create a map of block IDs to drawing data
        const drawingMap = new Map();
        drawingData.forEach(drawing => {
            drawingMap.set(drawing.blockId, drawing);
        });

        // Replace drawing blocks with embedded content
        let processedContent = content;
        drawingBlocks.forEach(block => {
            const drawing = drawingMap.get(block.id);
            if (drawing) {
                const drawingEmbed = this.createDrawingEmbed(drawing, options);
                const blockRegex = new RegExp(`\`\`\`freeform-drawing\\s*\\n[\\s\\S]*?\\n\`\`\``, 'g');
                processedContent = processedContent.replace(blockRegex, drawingEmbed);
            }
        });

        return processedContent;
    }

    /**
     * Create drawing embed based on format
     */
    private createDrawingEmbed(drawing: DrawingExportData, options: ExportOptions): string {
        const maxWidth = options.drawingMaxWidth || 600;
        const maxHeight = options.drawingMaxHeight || 400;
        
        // Calculate scaled dimensions
        const scale = Math.min(maxWidth / drawing.width, maxHeight / drawing.height, 1);
        const scaledWidth = Math.round(drawing.width * scale);
        const scaledHeight = Math.round(drawing.height * scale);

        switch (options.drawingFormat) {
            case 'svg':
                return `\n\n[Drawing: ${drawing.blockId}]\n${drawing.svgData}\n\n`;
            
            case 'png':
                return `\n\n[Drawing: ${drawing.blockId}]\n<img src="${drawing.pngData}" width="${scaledWidth}" height="${scaledHeight}" alt="Drawing" />\n\n`;
            
            case 'both':
                return `\n\n[Drawing: ${drawing.blockId}]\nSVG:\n${drawing.svgData}\n\nPNG:\n<img src="${drawing.pngData}" width="${scaledWidth}" height="${scaledHeight}" alt="Drawing" />\n\n`;
            
            default:
                return `\n\n[Drawing: ${drawing.blockId}]\n${drawing.svgData}\n\n`;
        }
    }

    /**
     * Export data in CSV format with drawings
     */
    async exportToCSV(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
        const csvData = await this.prepareDataForExport(data, options);
        
        // Convert to CSV format
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        
        // Use Electron save dialog if available
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            try {
                const result = await (window as any).electronAPI.saveFileDialog(filename);
                if (result.success) {
                    await this.saveFileWithElectron(result.filePath, csv);
                }
            } catch (error) {
                saveAs(blob, filename);
            }
        } else {
            saveAs(blob, filename);
        }
    }

    /**
     * Export data in JSON format with drawings
     */
    async exportToJSON(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
        const jsonData = await this.prepareDataForExport(data, options);
        
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            try {
                const result = await (window as any).electronAPI.saveFileDialog(filename);
                if (result.success) {
                    await this.saveFileWithElectron(result.filePath, jsonString);
                }
            } catch (error) {
                saveAs(blob, filename);
            }
        } else {
            saveAs(blob, filename);
        }
    }

    /**
     * Export data in Excel format with drawings
     */
    async exportToExcel(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
        const workbook = XLSX.utils.book_new();
        
        // Create worksheets for each data type
        if (data.projects && data.projects.length > 0) {
            const projectsData = await this.prepareDataForExport({ projects: data.projects }, options);
            const worksheet = XLSX.utils.json_to_sheet(projectsData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
        }
        
        if (data.experiments && data.experiments.length > 0) {
            const experimentsData = await this.prepareDataForExport({ experiments: data.experiments }, options);
            const worksheet = XLSX.utils.json_to_sheet(experimentsData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Experiments');
        }
        
        if (data.protocols && data.protocols.length > 0) {
            const protocolsData = await this.prepareDataForExport({ protocols: data.protocols }, options);
            const worksheet = XLSX.utils.json_to_sheet(protocolsData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Protocols');
        }
        
        if (data.notes && data.notes.length > 0) {
            const notesData = await this.prepareDataForExport({ notes: data.notes }, options);
            const worksheet = XLSX.utils.json_to_sheet(notesData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes');
        }
        
        if (data.databaseEntries && data.databaseEntries.length > 0) {
            const databaseData = await this.prepareDataForExport({ databaseEntries: data.databaseEntries }, options);
            const worksheet = XLSX.utils.json_to_sheet(databaseData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Database Entries');
        }
        
        if (data.tasks && data.tasks.length > 0) {
            const tasksData = await this.prepareDataForExport({ tasks: data.tasks }, options);
            const worksheet = XLSX.utils.json_to_sheet(tasksData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
        }
        
        if (data.pdfs && data.pdfs.length > 0) {
            const pdfsData = await this.prepareDataForExport({ pdfs: data.pdfs }, options);
            const worksheet = XLSX.utils.json_to_sheet(pdfsData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'PDFs');
        }
        
        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            try {
                const result = await (window as any).electronAPI.saveFileDialog(filename);
                if (result.success) {
                    await this.saveFileWithElectron(result.filePath, excelBuffer);
                }
            } catch (error) {
                saveAs(blob, filename);
            }
        } else {
            saveAs(blob, filename);
        }
    }

    /**
     * Export data in PDF format with drawings
     */
    async exportToPDF(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
        const doc = new jsPDF();
        let yPosition = 20;
        
        // Add title
        doc.setFontSize(20);
        doc.text('Research Notebook Export', 20, yPosition);
        yPosition += 20;
        
        // Add timestamp
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
        yPosition += 15;
        
        // Export each data type
        if (data.projects && data.projects.length > 0) {
            yPosition = await this.addSectionToPDF(doc, 'Projects', data.projects, yPosition, options);
        }
        
        if (data.experiments && data.experiments.length > 0) {
            yPosition = await this.addSectionToPDF(doc, 'Experiments', data.experiments, yPosition, options);
        }
        
        if (data.protocols && data.protocols.length > 0) {
            yPosition = await this.addSectionToPDF(doc, 'Protocols', data.protocols, yPosition, options);
        }
        
        if (data.notes && data.notes.length > 0) {
            yPosition = await this.addSectionToPDF(doc, 'Notes', data.notes, yPosition, options);
        }
        
        if (data.databaseEntries && data.databaseEntries.length > 0) {
            yPosition = await this.addSectionToPDF(doc, 'Database Entries', data.databaseEntries, yPosition, options);
        }
        
        if (data.tasks && data.tasks.length > 0) {
            yPosition = await this.addSectionToPDF(doc, 'Tasks', data.tasks, yPosition, options);
        }
        
        if (data.pdfs && data.pdfs.length > 0) {
            yPosition = await this.addSectionToPDF(doc, 'PDFs', data.pdfs, yPosition, options);
        }
        
        // Save PDF
        const pdfBlob = doc.output('blob');
        
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            try {
                const result = await (window as any).electronAPI.saveFileDialog(filename);
                if (result.success) {
                    await this.saveFileWithElectron(result.filePath, pdfBlob);
                }
            } catch (error) {
                saveAs(pdfBlob, filename);
            }
        } else {
            saveAs(pdfBlob, filename);
        }
    }

    /**
     * Export data in HTML format with drawings
     */
    async exportToHTML(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
        const htmlContent = await this.generateHTMLContent(data, options);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            try {
                const result = await (window as any).electronAPI.saveFileDialog(filename);
                if (result.success) {
                    await this.saveFileWithElectron(result.filePath, htmlContent);
                }
            } catch (error) {
                saveAs(blob, filename);
            }
        } else {
            saveAs(blob, filename);
        }
    }

    /**
     * Generate HTML content with drawings
     */
    private async generateHTMLContent(data: ExportData, options: ExportOptions): Promise<string> {
        let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Research Notebook Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .item { margin-bottom: 20px; padding: 15px; border: 1px solid #ecf0f1; border-radius: 5px; }
        .item h3 { color: #34495e; margin-top: 0; }
        .drawing { margin: 15px 0; text-align: center; }
        .drawing img { max-width: 100%; height: auto; border: 1px solid #ddd; }
        .drawing svg { max-width: 100%; height: auto; border: 1px solid #ddd; }
        .metadata { font-size: 0.9em; color: #7f8c8d; margin-top: 10px; }
        .timestamp { text-align: center; color: #7f8c8d; margin-bottom: 30px; }
    </style>
</head>
<body>
    <h1>Research Notebook Export</h1>
    <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
`;

        // Add each section
        if (data.projects && data.projects.length > 0) {
            html += await this.generateHTMLSection('Projects', data.projects, options);
        }
        
        if (data.experiments && data.experiments.length > 0) {
            html += await this.generateHTMLSection('Experiments', data.experiments, options);
        }
        
        if (data.protocols && data.protocols.length > 0) {
            html += await this.generateHTMLSection('Protocols', data.protocols, options);
        }
        
        if (data.notes && data.notes.length > 0) {
            html += await this.generateHTMLSection('Notes', data.notes, options);
        }
        
        if (data.databaseEntries && data.databaseEntries.length > 0) {
            html += await this.generateHTMLSection('Database Entries', data.databaseEntries, options);
        }
        
        if (data.tasks && data.tasks.length > 0) {
            html += await this.generateHTMLSection('Tasks', data.tasks, options);
        }
        
        if (data.pdfs && data.pdfs.length > 0) {
            html += await this.generateHTMLSection('PDFs', data.pdfs, options);
        }

        html += `
</body>
</html>`;

        return html;
    }

    /**
     * Generate HTML section with drawings
     */
    private async generateHTMLSection(title: string, items: any[], options: ExportOptions): Promise<string> {
        let html = `<div class="section"><h2>${title}</h2>`;
        
        for (const item of items) {
            html += `<div class="item">`;
            html += `<h3>${item.name || item.title}</h3>`;
            
            if (item.description) {
                const processedDescription = await this.processContentWithDrawings(
                    item.description, 
                    item.id, 
                    this.getEntityTypeFromItem(item), 
                    options
                );
                html += `<div>${this.convertTextToHTML(processedDescription)}</div>`;
            }
            
            if (options.includeMetadata) {
                html += `<div class="metadata">`;
                html += `<strong>ID:</strong> ${item.id}<br>`;
                html += `<strong>Created:</strong> ${new Date(item.createdAt).toLocaleString()}<br>`;
                if (item.updatedAt) {
                    html += `<strong>Updated:</strong> ${new Date(item.updatedAt).toLocaleString()}`;
                }
                html += `</div>`;
            }
            
            html += `</div>`;
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * Convert text content to HTML with drawing embeds
     */
    private convertTextToHTML(content: string): string {
        // Convert drawing embeds to HTML
        content = content.replace(
            /\[Drawing: ([^\]]+)\]\n<img src="([^"]+)" width="([^"]+)" height="([^"]+)" alt="([^"]+)" \/>/g,
            '<div class="drawing"><img src="$2" width="$3" height="$4" alt="$5" /></div>'
        );
        
        content = content.replace(
            /\[Drawing: ([^\]]+)\]\n([\s\S]*?)(?=\n\n|$)/g,
            '<div class="drawing">$2</div>'
        );
        
        // Convert line breaks to HTML
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    /**
     * Get entity type from item
     */
    private getEntityTypeFromItem(item: any): string {
        if (item.type) return item.type;
        if (item.name && item.description) return 'project';
        if (item.title && item.content) return 'note';
        if (item.title && item.status) return 'task';
        return 'unknown';
    }

    /**
     * Prepare data for export with drawings
     */
    private async prepareDataForExport(data: ExportData, options: ExportOptions): Promise<any[]> {
        const exportData: any[] = [];
        
        // Process projects
        if (data.projects) {
            for (const project of data.projects) {
                const exportItem: any = {
                    type: 'project',
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    startDate: project.startDate,
                    lastActivity: project.lastActivity,
                    createdAt: project.createdAt
                };
                
                if (options.includeMetadata) {
                    exportItem.id = project.id;
                    exportItem.updatedAt = project.updatedAt;
                }
                
                if (options.includeRelationships && project.experiments) {
                    exportItem.experimentCount = project.experiments.length;
                    exportItem.experimentNames = project.experiments.map((exp: any) => exp.name).join(', ');
                }
                
                // Process description with drawings
                if (project.description && options.includeDrawings) {
                    exportItem.description = await this.processContentWithDrawings(
                        project.description, 
                        project.id, 
                        'project', 
                        options
                    );
                }
                
                exportData.push(exportItem);
            }
        }
        
        // Process notes
        if (data.notes) {
            for (const note of data.notes) {
                const exportItem: any = {
                    type: 'note',
                    title: note.title,
                    content: note.content,
                    itemType: note.type,
                    createdAt: note.createdAt
                };
                
                if (options.includeMetadata) {
                    exportItem.id = note.id;
                    exportItem.updatedAt = note.updatedAt;
                }
                
                // Process content with drawings
                if (note.content && options.includeDrawings) {
                    exportItem.content = await this.processContentWithDrawings(
                        note.content, 
                        note.id, 
                        'note', 
                        options
                    );
                }
                
                exportData.push(exportItem);
            }
        }
        
        // Process protocols
        if (data.protocols) {
            for (const protocol of data.protocols) {
                const exportItem: any = {
                    type: 'protocol',
                    name: protocol.name,
                    description: protocol.description,
                    category: protocol.category,
                    difficulty: protocol.difficulty,
                    estimatedTime: protocol.estimatedTime,
                    createdAt: protocol.createdAt
                };
                
                if (options.includeMetadata) {
                    exportItem.id = protocol.id;
                    exportItem.updatedAt = protocol.updatedAt;
                }
                
                if (options.includeRelationships && protocol.steps) {
                    exportItem.stepCount = protocol.steps.length;
                }
                
                // Process description with drawings
                if (protocol.description && options.includeDrawings) {
                    exportItem.description = await this.processContentWithDrawings(
                        protocol.description, 
                        protocol.id, 
                        'protocol', 
                        options
                    );
                }
                
                exportData.push(exportItem);
            }
        }
        
        // Process tasks
        if (data.tasks) {
            for (const task of data.tasks) {
                const exportItem: any = {
                    type: 'task',
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    createdAt: task.createdAt
                };
                
                if (options.includeMetadata) {
                    exportItem.id = task.id;
                    exportItem.updatedAt = task.updatedAt;
                }
                
                if (options.includeRelationships) {
                    exportItem.projectId = task.projectId;
                    exportItem.experimentId = task.experimentId;
                }
                
                // Process description with drawings
                if (task.description && options.includeDrawings) {
                    exportItem.description = await this.processContentWithDrawings(
                        task.description, 
                        task.id, 
                        'task', 
                        options
                    );
                }
                
                exportData.push(exportItem);
            }
        }
        
        // Process database entries
        if (data.databaseEntries) {
            for (const entry of data.databaseEntries) {
                const exportItem: any = {
                    type: 'database_entry',
                    name: entry.name,
                    description: entry.description,
                    itemType: entry.type,
                    createdAt: entry.createdAt
                };
                
                if (options.includeMetadata) {
                    exportItem.id = entry.id;
                    exportItem.updatedAt = entry.updatedAt;
                }
                
                if (entry.properties) {
                    try {
                        const props = JSON.parse(entry.properties);
                        Object.assign(exportItem, props);
                    } catch (error) {
                        // Ignore parsing errors
                    }
                }
                
                // Process description with drawings
                if (entry.description && options.includeDrawings) {
                    exportItem.description = await this.processContentWithDrawings(
                        entry.description, 
                        entry.id, 
                        'database', 
                        options
                    );
                }
                
                exportData.push(exportItem);
            }
        }
        
        return exportData;
    }

    /**
     * Add a section to PDF document with drawings
     */
    private async addSectionToPDF(doc: jsPDF, title: string, items: any[], yPosition: number, options: ExportOptions): Promise<number> {
        // Add section title
        doc.setFontSize(16);
        doc.text(title, 20, yPosition);
        yPosition += 10;
        
        // Process each item
        for (const item of items) {
            // Add item title
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(item.name || item.title, 20, yPosition);
            yPosition += 8;
            
            // Add description with drawings
            if (item.description) {
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                
                const processedDescription = await this.processContentWithDrawings(
                    item.description, 
                    item.id, 
                    this.getEntityTypeFromItem(item), 
                    options
                );
                
                // Split content into lines
                const lines = doc.splitTextToSize(processedDescription, 170);
                doc.text(lines, 20, yPosition);
                yPosition += lines.length * 5;
            }
            
            // Add metadata if requested
            if (options.includeMetadata) {
                doc.setFontSize(8);
                doc.text(`ID: ${item.id}`, 20, yPosition);
                yPosition += 5;
            }
            
            yPosition += 10; // Add spacing between items
        }
        
        return yPosition;
    }

    /**
     * Save file using Electron API
     */
    private async saveFileWithElectron(filePath: string, content: any): Promise<void> {
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            try {
                await (window as any).electronAPI.saveFileDialogWithContent(filePath, content);
            } catch (error) {
                throw new Error('Failed to save file using Electron API');
            }
        } else {
            throw new Error('Electron API not available');
        }
    }

    /**
     * Main export function
     */
    async exportData(
        format: string,
        data: ExportData,
        options: ExportOptions,
        filename: string
    ): Promise<void> {
        switch (format.toLowerCase()) {
            case 'csv':
                await this.exportToCSV(data, options, filename);
                break;
            case 'json':
                await this.exportToJSON(data, options, filename);
                break;
            case 'xlsx':
                await this.exportToExcel(data, options, filename);
                break;
            case 'pdf':
                await this.exportToPDF(data, options, filename);
                break;
            case 'html':
                await this.exportToHTML(data, options, filename);
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
}

export const enhancedExportService = new EnhancedExportService(); 