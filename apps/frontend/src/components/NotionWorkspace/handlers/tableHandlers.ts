import { useCallback } from 'react';
import { Block, Page } from '../types';

export const useTableHandlers = (currentPage: Page, setCurrentPage: (page: Page) => void) => {
    // Add row to table
    const handleAddTableRow = useCallback((blockId: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block => {
                if (block.id === blockId && block.type === 'table') {
                    try {
                        const tableData = JSON.parse(block.content);
                        const newRow = new Array(tableData.headers?.length || 0).fill('');
                        const updatedTableData = {
                            ...tableData,
                            rows: [...(tableData.rows || []), newRow]
                        };
                        return {
                            ...block,
                            content: JSON.stringify(updatedTableData),
                            updatedAt: new Date()
                        };
                    } catch (error) {
                        return block;
                    }
                }
                return block;
            })
        }));
    }, [setCurrentPage]);

    // Add column to table
    const handleAddTableColumn = useCallback((blockId: string) => {
        setCurrentPage(prev => ({
            ...prev,
            blocks: prev.blocks.map(block => {
                if (block.id === blockId && block.type === 'table') {
                    try {
                        const tableData = JSON.parse(block.content);
                        const newHeader = `Column ${(tableData.headers?.length || 0) + 1}`;
                        const updatedHeaders = [...(tableData.headers || []), newHeader];
                        const updatedRows = (tableData.rows || []).map((row: string[]) => [...row, '']);
                        const updatedTableData = {
                            headers: updatedHeaders,
                            rows: updatedRows
                        };
                        return {
                            ...block,
                            content: JSON.stringify(updatedTableData),
                            updatedAt: new Date()
                        };
                    } catch (error) {
                        return block;
                    }
                }
                return block;
            })
        }));
    }, [setCurrentPage]);

    return {
        handleAddTableRow,
        handleAddTableColumn
    };
}; 