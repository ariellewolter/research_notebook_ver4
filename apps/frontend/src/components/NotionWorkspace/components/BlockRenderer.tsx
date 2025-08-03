import React from 'react';
import { Block } from '../types';
import ImageBlock from '../ImageBlock';
import MathBlock from '../MathBlock';
import { DragIndicator as DragIndicatorIcon } from '@mui/icons-material';

interface BlockRendererProps {
    block: Block;
    draggedBlockId: string | null;
    onDragStart: (e: React.DragEvent, blockId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, blockId: string) => void;
    onDragEnd: () => void;
    onContextMenuOpen: (e: React.MouseEvent, blockId: string) => void;
    onBlockContentChange: (blockId: string, content: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>, block: Block) => void;
    onHeadingKeyDown: (e: React.KeyboardEvent<HTMLElement>, block: Block) => void;
    onAddTableRow: (blockId: string) => void;
    onAddTableColumn: (blockId: string) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
    block,
    draggedBlockId,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onContextMenuOpen,
    onBlockContentChange,
    onKeyDown,
    onHeadingKeyDown,
    onAddTableRow,
    onAddTableColumn
}) => {
    const renderBlockContent = () => {
        switch (block.type) {
            case 'text':
                return (
                    <div
                        className={`relative group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, block.id)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, block.id)}
                        onDragEnd={onDragEnd}
                    >
                        {/* Drag Handle */}
                        <div
                            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            onClick={(e) => onContextMenuOpen(e, block.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div
                                contentEditable
                                suppressContentEditableWarning={true}
                                data-block-id={block.id}
                                className="outline-none mb-6 min-h-6 text-gray-800 leading-relaxed text-base"
                                onBlur={(e: React.FocusEvent<HTMLElement>) => onBlockContentChange(block.id, e.currentTarget.textContent || '')}
                                onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => onKeyDown(e, block)}
                            >
                                {block.content}
                            </div>
                        </div>
                    </div>
                );

            case 'heading':
                const level = block.metadata?.level || 1;
                const headingProps = {
                    contentEditable: true,
                    suppressContentEditableWarning: true,
                    'data-block-id': block.id,
                    className: `outline-none mb-6 font-bold text-gray-900 ${level === 1 ? 'text-3xl' :
                        level === 2 ? 'text-2xl' :
                            level === 3 ? 'text-xl' :
                                level === 4 ? 'text-lg' :
                                    level === 5 ? 'text-base' : 'text-sm'
                        }`,
                    onBlur: (e: React.FocusEvent<HTMLElement>) => onBlockContentChange(block.id, e.currentTarget.textContent || ''),
                    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onHeadingKeyDown(e, block)
                };

                const HeadingComponent = level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' :
                    level === 4 ? 'h4' : level === 5 ? 'h5' : 'h6';

                return (
                    <div
                        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, block.id)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, block.id)}
                        onDragEnd={onDragEnd}
                    >
                        {/* Drag Handle */}
                        <div
                            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            onClick={(e) => onContextMenuOpen(e, block.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            {React.createElement(HeadingComponent, headingProps, block.content)}
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div
                        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, block.id)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, block.id)}
                        onDragEnd={onDragEnd}
                    >
                        {/* Drag Handle */}
                        <div
                            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            onClick={(e) => onContextMenuOpen(e, block.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <ImageBlock
                                data={block.metadata?.imageData}
                                onUpdate={(imageData) => {
                                    // Handle image update
                                    console.log('Image updated:', imageData);
                                }}
                            />
                        </div>
                    </div>
                );

            case 'math':
                return (
                    <div
                        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, block.id)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, block.id)}
                        onDragEnd={onDragEnd}
                    >
                        {/* Drag Handle */}
                        <div
                            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            onClick={(e) => onContextMenuOpen(e, block.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <MathBlock
                                data={block.metadata?.mathData}
                                onUpdate={(mathData) => {
                                    // Handle math update
                                    console.log('Math updated:', mathData);
                                }}
                            />
                        </div>
                    </div>
                );

            case 'table':
                try {
                    const tableData = JSON.parse(block.content);
                    return (
                        <div
                            className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, block.id)}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, block.id)}
                            onDragEnd={onDragEnd}
                        >
                            {/* Drag Handle */}
                            <div
                                className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                onClick={(e) => onContextMenuOpen(e, block.id)}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="mb-4">
                                    <div className="flex gap-2 mb-2">
                                        <button
                                            onClick={() => onAddTableRow(block.id)}
                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Add Row
                                        </button>
                                        <button
                                            onClick={() => onAddTableColumn(block.id)}
                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Add Column
                                        </button>
                                    </div>
                                    <table className="w-full border-collapse border border-gray-300">
                                        <thead>
                                            <tr>
                                                {tableData.headers?.map((header: string, index: number) => (
                                                    <th key={index} className="border border-gray-300 px-4 py-2 bg-gray-100">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.rows?.map((row: string[], rowIndex: number) => (
                                                <tr key={rowIndex}>
                                                    {row.map((cell: string, cellIndex: number) => (
                                                        <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                } catch (error) {
                    return <div>Invalid table data</div>;
                }

            default:
                return (
                    <div
                        className={`group flex items-start gap-2 ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, block.id)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, block.id)}
                        onDragEnd={onDragEnd}
                    >
                        {/* Drag Handle */}
                        <div
                            className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            onClick={(e) => onContextMenuOpen(e, block.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <DragIndicatorIcon className="text-gray-400 hover:text-gray-600" fontSize="small" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="p-4 bg-gray-100 rounded">
                                {block.type} block: {block.content}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return renderBlockContent();
}; 