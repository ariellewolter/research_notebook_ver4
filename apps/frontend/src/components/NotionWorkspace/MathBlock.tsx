import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert
} from '@mui/material';
import {
    Functions as MathIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    Science as ScienceIcon,
    Code as CodeIcon
} from '@mui/icons-material';

export interface MathData {
    id: string;
    latex: string;
    displayMode: 'inline' | 'block';
    label?: string;
    description?: string;
    category?: 'equation' | 'formula' | 'expression' | 'theorem' | 'proof';
    metadata?: {
        subject?: string;
        source?: string;
        reference?: string;
        notes?: string;
    };
}

interface MathBlockProps {
    data: MathData;
    onUpdate: (data: MathData) => void;
    onDelete: () => void;
    isEditing?: boolean;
    onEditToggle?: () => void;
}

const MathBlock: React.FC<MathBlockProps> = ({
    data,
    onUpdate,
    onDelete,
    isEditing = false,
    onEditToggle
}) => {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [latexPreview, setLatexPreview] = useState(data.latex);
    const [renderError, setRenderError] = useState<string>('');

    // Common LaTeX templates for scientific equations
    const latexTemplates = {
        'equation': 'E = mc^2',
        'formula': '\\frac{a}{b} = \\frac{c}{d}',
        'expression': '\\int_{0}^{\\infty} e^{-x} dx = 1',
        'theorem': '\\text{If } a = b \\text{ and } b = c, \\text{ then } a = c',
        'proof': '\\begin{align*}\n& \\text{Given: } P \\\\\n& \\text{To prove: } Q \\\\\n& \\text{Proof: } \\\\\n& \\quad P \\implies Q\n\\end{align*}'
    };

    // Scientific notation helpers
    const scientificHelpers = {
        'Greek Letters': ['\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\theta', '\\lambda', '\\mu', '\\pi', '\\sigma', '\\phi', '\\psi', '\\omega'],
        'Operators': ['\\pm', '\\mp', '\\times', '\\div', '\\cdot', '\\circ', '\\bullet', '\\oplus', '\\otimes'],
        'Functions': ['\\sin', '\\cos', '\\tan', '\\log', '\\ln', '\\exp', '\\lim', '\\sum', '\\prod', '\\int'],
        'Symbols': ['\\infty', '\\partial', '\\nabla', '\\Delta', '\\delta', '\\epsilon', '\\in', '\\notin', '\\subset', '\\supset'],
        'Fractions': ['\\frac{a}{b}', '\\frac{1}{2}', '\\frac{x}{y}'],
        'Superscripts': ['x^2', 'x^n', 'e^{i\\pi}'],
        'Subscripts': ['x_1', 'x_n', 'a_{ij}'],
        'Matrices': ['\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', '\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}'],
        'Integrals': ['\\int f(x) dx', '\\int_{a}^{b} f(x) dx', '\\oint_C f(z) dz'],
        'Sums': ['\\sum_{i=1}^{n} x_i', '\\sum_{k=0}^{\\infty} a_k'],
        'Limits': ['\\lim_{x \\to \\infty} f(x)', '\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}']
    };

    useEffect(() => {
        setLatexPreview(data.latex);
    }, [data.latex]);

    const handleLatexChange = (latex: string) => {
        setLatexPreview(latex);
        onUpdate({ ...data, latex });
    };

    const handleTemplateSelect = (template: string) => {
        const latex = latexTemplates[template as keyof typeof latexTemplates] || template;
        handleLatexChange(latex);
    };

    const handleHelperClick = (helper: string) => {
        const currentLatex = latexPreview;
        const newLatex = currentLatex + helper;
        handleLatexChange(newLatex);
    };

    const handleCopyLatex = () => {
        navigator.clipboard.writeText(data.latex);
    };

        const renderMath = () => {
        try {
            // This would typically use a math rendering library like KaTeX or MathJax
            // For now, we'll show the LaTeX code with syntax highlighting
            return (
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '1.1em',
                        overflowX: 'auto',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: 'grey.100',
                            borderColor: 'grey.300'
                        }
                    }}
                    onClick={() => setEditDialogOpen(true)}
                >
                    {data.displayMode === 'block' ? (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" component="div">
                                {data.latex}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography variant="body1">
                            {data.latex}
                        </Typography>
                    )}
                    
                    {/* Overlay controls */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            display: 'flex',
                            gap: 1,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            '&:hover': { opacity: 1 }
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Tooltip title="Copy LaTeX">
                            <IconButton size="small" onClick={handleCopyLatex}>
                                <CopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            );
        } catch (error) {
            setRenderError('Error rendering equation');
            return (
                <Alert severity="error">
                    Error rendering equation: {data.latex}
                </Alert>
            );
        }
    };

    const renderEditDialog = () => (
        <Dialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MathIcon />
                    Edit Mathematical Equation
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, height: '60vh' }}>
                    {/* Left side - Editor */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            LaTeX Code
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={8}
                            value={latexPreview}
                            onChange={(e) => handleLatexChange(e.target.value)}
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                        />

                        <Box sx={{ mt: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Display Mode</InputLabel>
                                <Select
                                    value={data.displayMode}
                                    onChange={(e) => onUpdate({ ...data, displayMode: e.target.value as 'inline' | 'block' })}
                                    label="Display Mode"
                                >
                                    <MenuItem value="inline">Inline</MenuItem>
                                    <MenuItem value="block">Block</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={data.category || ''}
                                    onChange={(e) => onUpdate({ ...data, category: e.target.value as any })}
                                    label="Category"
                                >
                                    <MenuItem value="equation">Equation</MenuItem>
                                    <MenuItem value="formula">Formula</MenuItem>
                                    <MenuItem value="expression">Expression</MenuItem>
                                    <MenuItem value="theorem">Theorem</MenuItem>
                                    <MenuItem value="proof">Proof</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Label"
                                value={data.label || ''}
                                onChange={(e) => onUpdate({ ...data, label: e.target.value })}
                                size="small"
                                placeholder="e.g., Equation 1, Theorem 2.1"
                            />
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={data.description || ''}
                                onChange={(e) => onUpdate({ ...data, description: e.target.value })}
                                multiline
                                rows={2}
                                size="small"
                            />
                        </Box>
                    </Box>

                    {/* Right side - Preview and Helpers */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Preview
                        </Typography>
                        <Box sx={{ mb: 2, minHeight: 100, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            {renderMath()}
                        </Box>

                        <Typography variant="subtitle2" gutterBottom>
                            Quick Templates
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {Object.keys(latexTemplates).map((template) => (
                                <Chip
                                    key={template}
                                    label={template}
                                    size="small"
                                    onClick={() => handleTemplateSelect(template)}
                                    variant="outlined"
                                />
                            ))}
                        </Box>

                        <Typography variant="subtitle2" gutterBottom>
                            Scientific Helpers
                        </Typography>
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {Object.entries(scientificHelpers).map(([category, helpers]) => (
                                <Box key={category} sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {category}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                        {helpers.map((helper) => (
                                            <Chip
                                                key={helper}
                                                label={helper}
                                                size="small"
                                                onClick={() => handleHelperClick(helper)}
                                                variant="outlined"
                                                sx={{ fontSize: '0.7rem' }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Metadata section */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Scientific Metadata
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                        <TextField
                            label="Subject"
                            value={data.metadata?.subject || ''}
                            onChange={(e) => onUpdate({
                                ...data,
                                metadata: { ...data.metadata, subject: e.target.value }
                            })}
                            size="small"
                            placeholder="e.g., Calculus, Physics, Chemistry"
                        />
                        <TextField
                            label="Source"
                            value={data.metadata?.source || ''}
                            onChange={(e) => onUpdate({
                                ...data,
                                metadata: { ...data.metadata, source: e.target.value }
                            })}
                            size="small"
                            placeholder="e.g., Textbook, Paper, Lecture"
                        />
                        <TextField
                            label="Reference"
                            value={data.metadata?.reference || ''}
                            onChange={(e) => onUpdate({
                                ...data,
                                metadata: { ...data.metadata, reference: e.target.value }
                            })}
                            size="small"
                            placeholder="e.g., Chapter 3, Section 2.1"
                        />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Notes"
                            value={data.metadata?.notes || ''}
                            onChange={(e) => onUpdate({
                                ...data,
                                metadata: { ...data.metadata, notes: e.target.value }
                            })}
                            multiline
                            rows={2}
                            size="small"
                            placeholder="Additional notes about this equation..."
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setEditDialogOpen(false)} variant="contained">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Box sx={{ my: 2 }}>
            {/* Label */}
            {data.label && (
                <Typography variant="subtitle2" color="primary" gutterBottom>
                    {data.label}
                </Typography>
            )}

            {/* Math content */}
            {renderMath()}

            {/* Description */}
            {data.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {data.description}
                </Typography>
            )}

            {/* Metadata display */}
            {data.metadata && Object.keys(data.metadata).length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {data.category && (
                        <Chip label={data.category} size="small" icon={<MathIcon />} />
                    )}
                    {data.metadata.subject && (
                        <Chip label={data.metadata.subject} size="small" variant="outlined" />
                    )}
                    {data.metadata.source && (
                        <Chip label={`Source: ${data.metadata.source}`} size="small" variant="outlined" />
                    )}
                </Box>
            )}

            {/* Action buttons */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Tooltip title="Copy LaTeX">
                    <IconButton size="small" onClick={handleCopyLatex}>
                        <CopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton size="small" onClick={onDelete} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {renderEditDialog()}
        </Box>
    );
};

export default MathBlock; 