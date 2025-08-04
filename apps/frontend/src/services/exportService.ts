import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
}

class ExportService {
    /**
     * Export data in CSV format
     */
    async exportToCSV(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
        const csvData = this.prepareDataForExport(data, options);
        
        // Convert to CSV format
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        
        // Use Electron save dialog if available
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
            try {
                const result = await (window as any).electronAPI.saveFileDialog(filename);
                if (result.success) {
                    // Save file using Electron API
                    await this.saveFileWithElectron(result.filePath, csv);
                }
            } catch (error) {
                // Fallback to browser download
                saveAs(blob, filename);
            }
        } else {
            // Browser fallback
            saveAs(blob, filename);
        }
    }

    /**
     * Export data in JSON format
     */
    async exportToJSON(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
        const jsonData = this.prepareDataForExport(data, options);
        
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
     * Export data in Excel format
     */
    async exportToExcel(data: ExportData, options: ExportOptions, filename: string): Promise<void> {
        const workbook = XLSX.utils.book_new();
        
        // Create worksheets for each data type
        if (data.projects && data.projects.length > 0) {
            const projectsData = this.prepareDataForExport({ projects: data.projects }, options);
            const worksheet = XLSX.utils.json_to_sheet(projectsData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
        }
        
        if (data.experiments && data.experiments.length > 0) {
            const experimentsData = this.prepareDataForExport({ experiments: data.experiments }, options);
            const worksheet = XLSX.utils.json_to_sheet(experimentsData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Experiments');
        }
        
        if (data.protocols && data.protocols.length > 0) {
            const protocolsData = this.prepareDataForExport({ protocols: data.protocols }, options);
            const worksheet = XLSX.utils.json_to_sheet(protocolsData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Protocols');
        }
        
        if (data.notes && data.notes.length > 0) {
            const notesData = this.prepareDataForExport({ notes: data.notes }, options);
            const worksheet = XLSX.utils.json_to_sheet(notesData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes');
        }
        
        if (data.databaseEntries && data.databaseEntries.length > 0) {
            const entriesData = this.prepareDataForExport({ databaseEntries: data.databaseEntries }, options);
            const worksheet = XLSX.utils.json_to_sheet(entriesData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Database Entries');
        }
        
        if (data.tasks && data.tasks.length > 0) {
            const tasksData = this.prepareDataForExport({ tasks: data.tasks }, options);
            const worksheet = XLSX.utils.json_to_sheet(tasksData);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
        }
        
        if (data.pdfs && data.pdfs.length > 0) {
            const pdfsData = this.prepareDataForExport({ pdfs: data.pdfs }, options);
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
     * Export data in PDF format
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
            yPosition = this.addSectionToPDF(doc, 'Projects', data.projects, yPosition, options);
        }
        
        if (data.experiments && data.experiments.length > 0) {
            yPosition = this.addSectionToPDF(doc, 'Experiments', data.experiments, yPosition, options);
        }
        
        if (data.protocols && data.protocols.length > 0) {
            yPosition = this.addSectionToPDF(doc, 'Protocols', data.protocols, yPosition, options);
        }
        
        if (data.notes && data.notes.length > 0) {
            yPosition = this.addSectionToPDF(doc, 'Notes', data.notes, yPosition, options);
        }
        
        if (data.databaseEntries && data.databaseEntries.length > 0) {
            yPosition = this.addSectionToPDF(doc, 'Database Entries', data.databaseEntries, yPosition, options);
        }
        
        if (data.tasks && data.tasks.length > 0) {
            yPosition = this.addSectionToPDF(doc, 'Tasks', data.tasks, yPosition, options);
        }
        
        if (data.pdfs && data.pdfs.length > 0) {
            yPosition = this.addSectionToPDF(doc, 'PDFs', data.pdfs, yPosition, options);
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
     * Prepare data for export based on options
     */
    private prepareDataForExport(data: ExportData, options: ExportOptions): any[] {
        const exportData: any[] = [];
        
        // Process projects
        if (data.projects) {
            data.projects.forEach(project => {
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
                
                exportData.push(exportItem);
            });
        }
        
        // Process experiments
        if (data.experiments) {
            data.experiments.forEach(experiment => {
                const exportItem: any = {
                    type: 'experiment',
                    name: experiment.name,
                    description: experiment.description,
                    status: experiment.status,
                    hypothesis: experiment.hypothesis,
                    progress: experiment.progress,
                    createdAt: experiment.createdAt
                };
                
                if (options.includeMetadata) {
                    exportItem.id = experiment.id;
                    exportItem.updatedAt = experiment.updatedAt;
                }
                
                if (options.includeRelationships) {
                    exportItem.projectId = experiment.projectId;
                    exportItem.projectName = experiment.project?.name;
                }
                
                if (options.includeNotes && experiment.notes) {
                    exportItem.noteCount = experiment.notes.length;
                    exportItem.noteTitles = experiment.notes.map((note: any) => note.title).join(', ');
                }
                
                exportData.push(exportItem);
            });
        }
        
        // Process protocols
        if (data.protocols) {
            data.protocols.forEach(protocol => {
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
                
                exportData.push(exportItem);
            });
        }
        
        // Process notes
        if (data.notes) {
            data.notes.forEach(note => {
                const exportItem: any = {
                    type: 'note',
                    title: note.title,
                    content: note.content,
                    type: note.type,
                    createdAt: note.createdAt
                };
                
                if (options.includeMetadata) {
                    exportItem.id = note.id;
                    exportItem.updatedAt = note.updatedAt;
                }
                
                exportData.push(exportItem);
            });
        }
        
        // Process database entries
        if (data.databaseEntries) {
            data.databaseEntries.forEach(entry => {
                const exportItem: any = {
                    type: 'database_entry',
                    name: entry.name,
                    description: entry.description,
                    type: entry.type,
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
                
                exportData.push(exportItem);
            });
        }
        
        // Process tasks
        if (data.tasks) {
            data.tasks.forEach(task => {
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
                
                exportData.push(exportItem);
            });
        }
        
        // Process PDFs
        if (data.pdfs) {
            data.pdfs.forEach(pdf => {
                const exportItem: any = {
                    type: 'pdf',
                    title: pdf.title,
                    fileName: pdf.fileName,
                    fileSize: pdf.fileSize,
                    createdAt: pdf.createdAt
                };
                
                if (options.includeMetadata) {
                    exportItem.id = pdf.id;
                    exportItem.updatedAt = pdf.updatedAt;
                }
                
                if (options.includeFiles) {
                    exportItem.filePath = pdf.filePath;
                }
                
                exportData.push(exportItem);
            });
        }
        
        return exportData;
    }

    /**
     * Add a section to PDF document
     */
    private addSectionToPDF(doc: jsPDF, title: string, items: any[], yPosition: number, options: ExportOptions): number {
        // Add section title
        doc.setFontSize(16);
        doc.text(title, 20, yPosition);
        yPosition += 10;
        
        // Create table data
        const tableData = items.map(item => {
            const row: any = {
                Name: item.name || item.title,
                Description: item.description || '',
                Status: item.status || '',
                Created: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''
            };
            
            if (options.includeMetadata) {
                row.ID = item.id || '';
            }
            
            return Object.values(row);
        });
        
        // Add table headers
        const headers = Object.keys(tableData[0] || {}).map(key => key);
        
        // Add table to PDF
        (doc as any).autoTable({
            head: [headers],
            body: tableData,
            startY: yPosition,
            margin: { top: 20 },
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] }
        });
        
        // Return new Y position
        return (doc as any).lastAutoTable.finalY + 20;
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
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
}

export const exportService = new ExportService(); 