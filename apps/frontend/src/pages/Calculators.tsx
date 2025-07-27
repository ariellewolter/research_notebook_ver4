import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Divider
} from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`calculator-tabpanel-${index}`}
            aria-labelledby={`calculator-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const Calculators: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [results, setResults] = useState<{ [key: string]: any }>({});

    // Molarity Calculator
    const [molarityData, setMolarityData] = useState({
        mass: '',
        molecularWeight: '',
        volume: '',
        concentration: ''
    });

    // Dilution Calculator
    const [dilutionData, setDilutionData] = useState({
        initialConcentration: '',
        initialVolume: '',
        finalConcentration: '',
        finalVolume: ''
    });

    // Percentage Calculator
    const [percentageData, setPercentageData] = useState({
        part: '',
        whole: '',
        percentage: ''
    });

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const calculateMolarity = () => {
        const mass = parseFloat(molarityData.mass);
        const molecularWeight = parseFloat(molarityData.molecularWeight);
        const volume = parseFloat(molarityData.volume);

        if (mass && molecularWeight && volume) {
            const moles = mass / molecularWeight;
            const molarity = moles / (volume / 1000); // Convert mL to L
            setResults(prev => ({
                ...prev,
                molarity: {
                    moles: moles.toFixed(4),
                    molarity: molarity.toFixed(4),
                    formula: `M = (${mass}g / ${molecularWeight}g/mol) / (${volume}mL / 1000) = ${molarity.toFixed(4)} M`
                }
            }));
        }
    };

    const calculateDilution = () => {
        const c1 = parseFloat(dilutionData.initialConcentration);
        const v1 = parseFloat(dilutionData.initialVolume);
        const c2 = parseFloat(dilutionData.finalConcentration);
        const v2 = parseFloat(dilutionData.finalVolume);

        if (c1 && v1 && c2 && !v2) {
            // Calculate final volume
            const finalVolume = (c1 * v1) / c2;
            setResults(prev => ({
                ...prev,
                dilution: {
                    finalVolume: finalVolume.toFixed(2),
                    formula: `V₂ = (C₁ × V₁) / C₂ = (${c1}M × ${v1}mL) / ${c2}M = ${finalVolume.toFixed(2)} mL`
                }
            }));
        } else if (c1 && v1 && !c2 && v2) {
            // Calculate final concentration
            const finalConcentration = (c1 * v1) / v2;
            setResults(prev => ({
                ...prev,
                dilution: {
                    finalConcentration: finalConcentration.toFixed(4),
                    formula: `C₂ = (C₁ × V₁) / V₂ = (${c1}M × ${v1}mL) / ${v2}mL = ${finalConcentration.toFixed(4)} M`
                }
            }));
        }
    };

    const calculatePercentage = () => {
        const part = parseFloat(percentageData.part);
        const whole = parseFloat(percentageData.whole);
        const percentage = parseFloat(percentageData.percentage);

        if (part && whole && !percentage) {
            const calculatedPercentage = (part / whole) * 100;
            setResults(prev => ({
                ...prev,
                percentage: {
                    percentage: calculatedPercentage.toFixed(2),
                    formula: `% = (${part} / ${whole}) × 100 = ${calculatedPercentage.toFixed(2)}%`
                }
            }));
        } else if (part && !whole && percentage) {
            const calculatedWhole = (part / percentage) * 100;
            setResults(prev => ({
                ...prev,
                percentage: {
                    whole: calculatedWhole.toFixed(2),
                    formula: `Whole = (${part} / ${percentage}%) × 100 = ${calculatedWhole.toFixed(2)}`
                }
            }));
        } else if (!part && whole && percentage) {
            const calculatedPart = (percentage / 100) * whole;
            setResults(prev => ({
                ...prev,
                percentage: {
                    part: calculatedPart.toFixed(2),
                    formula: `Part = (${percentage}% / 100) × ${whole} = ${calculatedPart.toFixed(2)}`
                }
            }));
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Scientific Calculators
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Essential calculators for laboratory work and research calculations.
            </Typography>

            <Card>
                <CardContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={handleTabChange}>
                            <Tab label="Molarity Calculator" />
                            <Tab label="Dilution Calculator" />
                            <Tab label="Percentage Calculator" />
                        </Tabs>
                    </Box>

                    <TabPanel value={activeTab} index={0}>
                        <Typography variant="h6" gutterBottom>
                            Molarity Calculator
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Calculate molarity from mass, molecular weight, and volume.
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Mass (g)"
                                    type="number"
                                    value={molarityData.mass}
                                    onChange={(e) => setMolarityData(prev => ({ ...prev, mass: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Molecular Weight (g/mol)"
                                    type="number"
                                    value={molarityData.molecularWeight}
                                    onChange={(e) => setMolarityData(prev => ({ ...prev, molecularWeight: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Volume (mL)"
                                    type="number"
                                    value={molarityData.volume}
                                    onChange={(e) => setMolarityData(prev => ({ ...prev, volume: e.target.value }))}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={calculateMolarity}
                            disabled={!molarityData.mass || !molarityData.molecularWeight || !molarityData.volume}
                        >
                            Calculate Molarity
                        </Button>

                        {results.molarity && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Results:
                                    </Typography>
                                    <Typography variant="body2">
                                        Moles: {results.molarity.moles} mol
                                    </Typography>
                                    <Typography variant="body2">
                                        Molarity: {results.molarity.molarity} M
                                    </Typography>
                                </Alert>
                                <Typography variant="caption" color="text.secondary">
                                    {results.molarity.formula}
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={1}>
                        <Typography variant="h6" gutterBottom>
                            Dilution Calculator
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Use the dilution formula: C₁V₁ = C₂V₂
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Initial Concentration (M)"
                                    type="number"
                                    value={dilutionData.initialConcentration}
                                    onChange={(e) => setDilutionData(prev => ({ ...prev, initialConcentration: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Initial Volume (mL)"
                                    type="number"
                                    value={dilutionData.initialVolume}
                                    onChange={(e) => setDilutionData(prev => ({ ...prev, initialVolume: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Final Concentration (M)"
                                    type="number"
                                    value={dilutionData.finalConcentration}
                                    onChange={(e) => setDilutionData(prev => ({ ...prev, finalConcentration: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Final Volume (mL)"
                                    type="number"
                                    value={dilutionData.finalVolume}
                                    onChange={(e) => setDilutionData(prev => ({ ...prev, finalVolume: e.target.value }))}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={calculateDilution}
                            disabled={
                                !dilutionData.initialConcentration || 
                                !dilutionData.initialVolume || 
                                (!dilutionData.finalConcentration && !dilutionData.finalVolume)
                            }
                        >
                            Calculate Dilution
                        </Button>

                        {results.dilution && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Results:
                                    </Typography>
                                    {results.dilution.finalVolume && (
                                        <Typography variant="body2">
                                            Final Volume: {results.dilution.finalVolume} mL
                                        </Typography>
                                    )}
                                    {results.dilution.finalConcentration && (
                                        <Typography variant="body2">
                                            Final Concentration: {results.dilution.finalConcentration} M
                                        </Typography>
                                    )}
                                </Alert>
                                <Typography variant="caption" color="text.secondary">
                                    {results.dilution.formula}
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={2}>
                        <Typography variant="h6" gutterBottom>
                            Percentage Calculator
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Calculate percentage, part, or whole value.
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Part"
                                    type="number"
                                    value={percentageData.part}
                                    onChange={(e) => setPercentageData(prev => ({ ...prev, part: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Whole"
                                    type="number"
                                    value={percentageData.whole}
                                    onChange={(e) => setPercentageData(prev => ({ ...prev, whole: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Percentage (%)"
                                    type="number"
                                    value={percentageData.percentage}
                                    onChange={(e) => setPercentageData(prev => ({ ...prev, percentage: e.target.value }))}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={calculatePercentage}
                            disabled={
                                Boolean(
                                    (!percentageData.part && !percentageData.whole && !percentageData.percentage) ||
                                    (percentageData.part && percentageData.whole && percentageData.percentage)
                                )
                            }
                        >
                            Calculate Percentage
                        </Button>

                        {results.percentage && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Results:
                                    </Typography>
                                    {results.percentage.percentage && (
                                        <Typography variant="body2">
                                            Percentage: {results.percentage.percentage}%
                                        </Typography>
                                    )}
                                    {results.percentage.whole && (
                                        <Typography variant="body2">
                                            Whole: {results.percentage.whole}
                                        </Typography>
                                    )}
                                    {results.percentage.part && (
                                        <Typography variant="body2">
                                            Part: {results.percentage.part}
                                        </Typography>
                                    )}
                                </Alert>
                                <Typography variant="caption" color="text.secondary">
                                    {results.percentage.formula}
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Calculators; 