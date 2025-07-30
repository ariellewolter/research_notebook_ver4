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
        molarity: ''
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

    // pH Calculator
    const [phData, setPhData] = useState({
        concentration: '',
        pka: '',
        ph: '',
        conjugateBase: ''
    });

    // Concentration Converter
    const [concentrationData, setConcentrationData] = useState({
        value: '',
        fromUnit: 'M',
        toUnit: 'mM',
        molecularWeight: ''
    });

    // Buffer Calculator
    const [bufferData, setBufferData] = useState({
        pka: '',
        ph: '',
        acidConcentration: '',
        baseConcentration: ''
    });

    // Unit Converter
    const [unitData, setUnitData] = useState({
        value: '',
        fromUnit: 'g',
        toUnit: 'mg',
        category: 'mass'
    });

    // Statistics Calculator
    const [statsData, setStatsData] = useState({
        values: '',
        operation: 'mean'
    });

    // Molecular Weight Calculator
    const [molecularWeightData, setMolecularWeightData] = useState({
        formula: ''
    });

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const calculateMolarity = () => {
        const mass = parseFloat(molarityData.mass);
        const molecularWeight = parseFloat(molarityData.molecularWeight);
        const volume = parseFloat(molarityData.volume);
        const molarity = parseFloat(molarityData.molarity);

        // Count how many values are provided
        const providedValues = [mass, molecularWeight, volume, molarity].filter(val => !isNaN(val) && val > 0);
        
        if (providedValues.length === 3) {
            let result = 0;
            let formula = '';
            let missingVariable = '';

            if (isNaN(mass) || mass <= 0) {
                // Calculate mass: mass = molarity × volume × molecularWeight
                result = molarity * (volume / 1000) * molecularWeight;
                formula = `Mass = M × V × MW = ${molarity}M × ${volume}mL × ${molecularWeight}g/mol = ${result.toFixed(4)} g`;
                missingVariable = 'Mass';
            } else if (isNaN(molecularWeight) || molecularWeight <= 0) {
                // Calculate molecular weight: MW = mass / (molarity × volume)
                result = mass / (molarity * (volume / 1000));
                formula = `MW = Mass / (M × V) = ${mass}g / (${molarity}M × ${volume}mL) = ${result.toFixed(2)} g/mol`;
                missingVariable = 'Molecular Weight';
            } else if (isNaN(volume) || volume <= 0) {
                // Calculate volume: volume = mass / (molarity × molecularWeight)
                result = (mass / (molarity * molecularWeight)) * 1000; // Convert to mL
                formula = `Volume = Mass / (M × MW) = ${mass}g / (${molarity}M × ${molecularWeight}g/mol) = ${result.toFixed(2)} mL`;
                missingVariable = 'Volume';
            } else if (isNaN(molarity) || molarity <= 0) {
                // Calculate molarity: M = mass / (volume × molecularWeight)
                const moles = mass / molecularWeight;
                result = moles / (volume / 1000); // Convert mL to L
                formula = `M = (${mass}g / ${molecularWeight}g/mol) / (${volume}mL / 1000) = ${result.toFixed(4)} M`;
                missingVariable = 'Molarity';
            }

            setResults(prev => ({
                ...prev,
                molarity: {
                    result: result.toFixed(6),
                    missingVariable: missingVariable,
                    formula: formula
                }
            }));
        }
    };

    const calculateDilution = () => {
        const c1 = parseFloat(dilutionData.initialConcentration);
        const v1 = parseFloat(dilutionData.initialVolume);
        const c2 = parseFloat(dilutionData.finalConcentration);
        const v2 = parseFloat(dilutionData.finalVolume);

        // Count how many values are provided
        const providedValues = [c1, v1, c2, v2].filter(val => !isNaN(val) && val > 0);
        
        if (providedValues.length === 3) {
            let result = 0;
            let formula = '';
            let missingVariable = '';

            if (isNaN(c1) || c1 <= 0) {
                // Calculate initial concentration: C₁ = (C₂ × V₂) / V₁
                result = (c2 * v2) / v1;
                formula = `C₁ = (C₂ × V₂) / V₁ = (${c2}M × ${v2}mL) / ${v1}mL = ${result.toFixed(4)} M`;
                missingVariable = 'Initial Concentration';
            } else if (isNaN(v1) || v1 <= 0) {
                // Calculate initial volume: V₁ = (C₂ × V₂) / C₁
                result = (c2 * v2) / c1;
                formula = `V₁ = (C₂ × V₂) / C₁ = (${c2}M × ${v2}mL) / ${c1}M = ${result.toFixed(2)} mL`;
                missingVariable = 'Initial Volume';
            } else if (isNaN(c2) || c2 <= 0) {
                // Calculate final concentration: C₂ = (C₁ × V₁) / V₂
                result = (c1 * v1) / v2;
                formula = `C₂ = (C₁ × V₁) / V₂ = (${c1}M × ${v1}mL) / ${v2}mL = ${result.toFixed(4)} M`;
                missingVariable = 'Final Concentration';
            } else if (isNaN(v2) || v2 <= 0) {
                // Calculate final volume: V₂ = (C₁ × V₁) / C₂
                result = (c1 * v1) / c2;
                formula = `V₂ = (C₁ × V₁) / C₂ = (${c1}M × ${v1}mL) / ${c2}M = ${result.toFixed(2)} mL`;
                missingVariable = 'Final Volume';
            }

            setResults(prev => ({
                ...prev,
                dilution: {
                    result: result.toFixed(6),
                    missingVariable: missingVariable,
                    formula: formula
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

    // pH Calculator functions
    const calculatePH = () => {
        const concentration = parseFloat(phData.concentration);
        const pka = parseFloat(phData.pka);
        const conjugateBase = parseFloat(phData.conjugateBase);
        const ph = parseFloat(phData.ph);

        // Count how many values are provided
        const providedValues = [concentration, pka, conjugateBase, ph].filter(val => !isNaN(val) && val > 0);
        
        if (providedValues.length === 3) {
            let result = 0;
            let formula = '';
            let missingVariable = '';

            if (isNaN(ph) || ph <= 0) {
                // Calculate pH: pH = pKa + log([A⁻]/[HA])
                result = pka + Math.log10(conjugateBase / concentration);
                formula = `pH = pKa + log([A⁻]/[HA]) = ${pka} + log(${conjugateBase}/${concentration}) = ${result.toFixed(3)}`;
                missingVariable = 'pH';
            } else if (isNaN(pka) || pka <= 0) {
                // Calculate pKa: pKa = pH - log([A⁻]/[HA])
                result = ph - Math.log10(conjugateBase / concentration);
                formula = `pKa = pH - log([A⁻]/[HA]) = ${ph} - log(${conjugateBase}/${concentration}) = ${result.toFixed(3)}`;
                missingVariable = 'pKa';
            } else if (isNaN(concentration) || concentration <= 0) {
                // Calculate [HA]: [HA] = [A⁻] / 10^(pH-pKa)
                result = conjugateBase / Math.pow(10, ph - pka);
                formula = `[HA] = [A⁻] / 10^(pH-pKa) = ${conjugateBase} / 10^(${ph}-${pka}) = ${result.toFixed(4)} M`;
                missingVariable = '[HA] Concentration';
            } else if (isNaN(conjugateBase) || conjugateBase <= 0) {
                // Calculate [A⁻]: [A⁻] = [HA] × 10^(pH-pKa)
                result = concentration * Math.pow(10, ph - pka);
                formula = `[A⁻] = [HA] × 10^(pH-pKa) = ${concentration} × 10^(${ph}-${pka}) = ${result.toFixed(4)} M`;
                missingVariable = '[A⁻] Concentration';
            }

            setResults(prev => ({
                ...prev,
                ph: {
                    result: result.toFixed(6),
                    missingVariable: missingVariable,
                    formula: formula
                }
            }));
        }
    };

    // Concentration Converter
    const convertConcentration = () => {
        const value = parseFloat(concentrationData.value);
        const fromUnit = concentrationData.fromUnit;
        const toUnit = concentrationData.toUnit;
        const molecularWeight = parseFloat(concentrationData.molecularWeight);

        if (value && fromUnit && toUnit) {
            let result = value;
            let formula = `${value} ${fromUnit}`;

            // Convert to M first
            if (fromUnit === 'mM') result = value / 1000;
            else if (fromUnit === 'μM') result = value / 1000000;
            else if (fromUnit === 'nM') result = value / 1000000000;
            else if (fromUnit === 'g/L' && molecularWeight) result = value / molecularWeight;
            else if (fromUnit === 'mg/mL' && molecularWeight) result = (value * 1000) / molecularWeight;

            // Convert from M to target unit
            if (toUnit === 'mM') result = result * 1000;
            else if (toUnit === 'μM') result = result * 1000000;
            else if (toUnit === 'nM') result = result * 1000000000;
            else if (toUnit === 'g/L' && molecularWeight) result = result * molecularWeight;
            else if (toUnit === 'mg/mL' && molecularWeight) result = (result * molecularWeight) / 1000;

            setResults(prev => ({
                ...prev,
                concentration: {
                    result: result.toFixed(6),
                    formula: `${formula} = ${result.toFixed(6)} ${toUnit}`
                }
            }));
        }
    };

    // Buffer Calculator
    const calculateBuffer = () => {
        const pka = parseFloat(bufferData.pka);
        const ph = parseFloat(bufferData.ph);
        const acidConcentration = parseFloat(bufferData.acidConcentration);
        const baseConcentration = parseFloat(bufferData.baseConcentration);

        // Count how many values are provided
        const providedValues = [pka, ph, acidConcentration, baseConcentration].filter(val => !isNaN(val) && val > 0);
        
        if (providedValues.length === 3) {
            let result = 0;
            let formula = '';
            let missingVariable = '';

            if (isNaN(ph) || ph <= 0) {
                // Calculate pH: pH = pKa + log([A⁻]/[HA])
                result = pka + Math.log10(baseConcentration / acidConcentration);
                formula = `pH = pKa + log([A⁻]/[HA]) = ${pka} + log(${baseConcentration}/${acidConcentration}) = ${result.toFixed(3)}`;
                missingVariable = 'pH';
            } else if (isNaN(pka) || pka <= 0) {
                // Calculate pKa: pKa = pH - log([A⁻]/[HA])
                result = ph - Math.log10(baseConcentration / acidConcentration);
                formula = `pKa = pH - log([A⁻]/[HA]) = ${ph} - log(${baseConcentration}/${acidConcentration}) = ${result.toFixed(3)}`;
                missingVariable = 'pKa';
            } else if (isNaN(acidConcentration) || acidConcentration <= 0) {
                // Calculate acid concentration: [HA] = [A⁻] / 10^(pH-pKa)
                result = baseConcentration / Math.pow(10, ph - pka);
                formula = `[HA] = [A⁻] / 10^(pH-pKa) = ${baseConcentration} / 10^(${ph}-${pka}) = ${result.toFixed(4)} M`;
                missingVariable = 'Acid Concentration';
            } else if (isNaN(baseConcentration) || baseConcentration <= 0) {
                // Calculate base concentration: [A⁻] = [HA] × 10^(pH-pKa)
                result = acidConcentration * Math.pow(10, ph - pka);
                formula = `[A⁻] = [HA] × 10^(pH-pKa) = ${acidConcentration} × 10^(${ph}-${pka}) = ${result.toFixed(4)} M`;
                missingVariable = 'Base Concentration';
            }

            setResults(prev => ({
                ...prev,
                buffer: {
                    result: result.toFixed(6),
                    missingVariable: missingVariable,
                    formula: formula
                }
            }));
        }
    };

    // Unit Converter
    const convertUnit = () => {
        const value = parseFloat(unitData.value);
        const fromUnit = unitData.fromUnit;
        const toUnit = unitData.toUnit;
        const category = unitData.category;

        if (value && fromUnit && toUnit) {
            let result = value;
            let formula = `${value} ${fromUnit}`;

            // Mass conversions
            if (category === 'mass') {
                if (fromUnit === 'g' && toUnit === 'mg') result = value * 1000;
                else if (fromUnit === 'g' && toUnit === 'μg') result = value * 1000000;
                else if (fromUnit === 'mg' && toUnit === 'g') result = value / 1000;
                else if (fromUnit === 'mg' && toUnit === 'μg') result = value * 1000;
                else if (fromUnit === 'μg' && toUnit === 'g') result = value / 1000000;
                else if (fromUnit === 'μg' && toUnit === 'mg') result = value / 1000;
            }
            // Volume conversions
            else if (category === 'volume') {
                if (fromUnit === 'L' && toUnit === 'mL') result = value * 1000;
                else if (fromUnit === 'L' && toUnit === 'μL') result = value * 1000000;
                else if (fromUnit === 'mL' && toUnit === 'L') result = value / 1000;
                else if (fromUnit === 'mL' && toUnit === 'μL') result = value * 1000;
                else if (fromUnit === 'μL' && toUnit === 'L') result = value / 1000000;
                else if (fromUnit === 'μL' && toUnit === 'mL') result = value / 1000;
            }
            // Length conversions
            else if (category === 'length') {
                if (fromUnit === 'm' && toUnit === 'cm') result = value * 100;
                else if (fromUnit === 'm' && toUnit === 'mm') result = value * 1000;
                else if (fromUnit === 'cm' && toUnit === 'm') result = value / 100;
                else if (fromUnit === 'cm' && toUnit === 'mm') result = value * 10;
                else if (fromUnit === 'mm' && toUnit === 'm') result = value / 1000;
                else if (fromUnit === 'mm' && toUnit === 'cm') result = value / 10;
            }

            setResults(prev => ({
                ...prev,
                unit: {
                    result: result.toFixed(6),
                    formula: `${formula} = ${result.toFixed(6)} ${toUnit}`
                }
            }));
        }
    };

    // Statistics Calculator
    const calculateStats = () => {
        const values = statsData.values.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        const operation = statsData.operation;

        if (values.length > 0) {
            let result = 0;
            let formula = '';

            if (operation === 'mean') {
                result = values.reduce((a, b) => a + b, 0) / values.length;
                formula = `Mean = (${values.join(' + ')}) / ${values.length} = ${result.toFixed(4)}`;
            } else if (operation === 'median') {
                const sorted = [...values].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                result = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
                formula = `Median = ${result.toFixed(4)}`;
            } else if (operation === 'std') {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
                result = Math.sqrt(variance);
                formula = `Standard Deviation = √(Σ(x-μ)²/n) = ${result.toFixed(4)}`;
            } else if (operation === 'sum') {
                result = values.reduce((a, b) => a + b, 0);
                formula = `Sum = ${values.join(' + ')} = ${result.toFixed(4)}`;
            }

            setResults(prev => ({
                ...prev,
                stats: {
                    result: result.toFixed(4),
                    count: values.length,
                    formula: formula
                }
            }));
        }
    };

    // Molecular Weight Calculator
    const calculateMolecularWeight = () => {
        const formula = molecularWeightData.formula.trim();
        
        // Simple molecular weight calculation for common elements
        const atomicWeights: { [key: string]: number } = {
            'H': 1.008, 'He': 4.003, 'Li': 6.941, 'Be': 9.012, 'B': 10.811,
            'C': 12.011, 'N': 14.007, 'O': 15.999, 'F': 18.998, 'Ne': 20.180,
            'Na': 22.990, 'Mg': 24.305, 'Al': 26.982, 'Si': 28.086, 'P': 30.974,
            'S': 32.065, 'Cl': 35.453, 'Ar': 39.948, 'K': 39.098, 'Ca': 40.078,
            'Fe': 55.845, 'Cu': 63.546, 'Zn': 65.38, 'Ag': 107.868, 'Au': 196.967
        };

        let totalWeight = 0;
        let currentElement = '';
        let currentNumber = '';
        let formulaParts: string[] = [];

        // Parse formula like "H2SO4" or "C6H12O6"
        for (let i = 0; i < formula.length; i++) {
            const char = formula[i];
            
            if (char >= 'A' && char <= 'Z') {
                // Save previous element if exists
                if (currentElement) {
                    const count = currentNumber ? parseInt(currentNumber) : 1;
                    formulaParts.push(`${currentElement}${count > 1 ? count : ''}`);
                    totalWeight += atomicWeights[currentElement] * count;
                }
                currentElement = char;
                currentNumber = '';
            } else if (char >= 'a' && char <= 'z') {
                // Two-letter element
                currentElement += char;
            } else if (char >= '0' && char <= '9') {
                currentNumber += char;
            }
        }

        // Handle last element
        if (currentElement) {
            const count = currentNumber ? parseInt(currentNumber) : 1;
            formulaParts.push(`${currentElement}${count > 1 ? count : ''}`);
            totalWeight += atomicWeights[currentElement] * count;
        }

        if (totalWeight > 0) {
            setResults(prev => ({
                ...prev,
                molecularWeight: {
                    weight: totalWeight.toFixed(3),
                    formula: formulaParts.join(''),
                    elements: Object.keys(atomicWeights).filter(el => 
                        formulaParts.some(part => part.startsWith(el))
                    ).join(', ')
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
                        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                            <Tab label="Molarity" />
                            <Tab label="Dilution" />
                            <Tab label="Percentage" />
                            <Tab label="pH" />
                            <Tab label="Concentration" />
                            <Tab label="Buffer" />
                            <Tab label="Unit Converter" />
                            <Tab label="Statistics" />
                            <Tab label="Molecular Weight" />
                        </Tabs>
                    </Box>

                    <TabPanel value={activeTab} index={0}>
                        <Typography variant="h6" gutterBottom>
                            Molarity Calculator
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Calculate any variable from mass, molecular weight, volume, and molarity. Enter any 3 values to find the 4th.
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Mass (g)"
                                    type="number"
                                    value={molarityData.mass}
                                    onChange={(e) => setMolarityData(prev => ({ ...prev, mass: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Molecular Weight (g/mol)"
                                    type="number"
                                    value={molarityData.molecularWeight}
                                    onChange={(e) => setMolarityData(prev => ({ ...prev, molecularWeight: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Volume (mL)"
                                    type="number"
                                    value={molarityData.volume}
                                    onChange={(e) => setMolarityData(prev => ({ ...prev, volume: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Molarity (M)"
                                    type="number"
                                    value={molarityData.molarity}
                                    onChange={(e) => setMolarityData(prev => ({ ...prev, molarity: e.target.value }))}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={calculateMolarity}
                            disabled={
                                [molarityData.mass, molarityData.molecularWeight, molarityData.volume, molarityData.molarity]
                                .filter(val => val && parseFloat(val) > 0).length !== 3
                            }
                        >
                            Calculate
                        </Button>

                        {results.molarity && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Results:
                                    </Typography>
                                    <Typography variant="body2">
                                        {results.molarity.missingVariable}: {results.molarity.result}
                                        {results.molarity.missingVariable === 'Mass' ? ' g' : 
                                         results.molarity.missingVariable === 'Molecular Weight' ? ' g/mol' :
                                         results.molarity.missingVariable === 'Volume' ? ' mL' : ' M'}
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
                            Use the dilution formula: C₁V₁ = C₂V₂. Enter any 3 values to calculate the 4th variable.
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
                                [dilutionData.initialConcentration, dilutionData.initialVolume, 
                                 dilutionData.finalConcentration, dilutionData.finalVolume]
                                .filter(val => val && parseFloat(val) > 0).length !== 3
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
                                    <Typography variant="body2">
                                        {results.dilution.missingVariable}: {results.dilution.result}
                                        {results.dilution.missingVariable.includes('Volume') ? ' mL' : ' M'}
                                    </Typography>
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

                    <TabPanel value={activeTab} index={3}>
                        <Typography variant="h6" gutterBottom>
                            pH Calculator
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Calculate pH, pKa, or concentrations using Henderson-Hasselbalch equation: pH = pKa + log([A⁻]/[HA]). Enter any 3 values to find the 4th.
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="[HA] Concentration (M)"
                                    type="number"
                                    value={phData.concentration}
                                    onChange={(e) => setPhData(prev => ({ ...prev, concentration: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="pKa"
                                    type="number"
                                    value={phData.pka}
                                    onChange={(e) => setPhData(prev => ({ ...prev, pka: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="[A⁻] Concentration (M)"
                                    type="number"
                                    value={phData.conjugateBase}
                                    onChange={(e) => setPhData(prev => ({ ...prev, conjugateBase: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="pH"
                                    type="number"
                                    value={phData.ph}
                                    onChange={(e) => setPhData(prev => ({ ...prev, ph: e.target.value }))}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={calculatePH}
                            disabled={
                                [phData.concentration, phData.pka, phData.conjugateBase, phData.ph]
                                .filter(val => val && parseFloat(val) > 0).length !== 3
                            }
                        >
                            Calculate
                        </Button>

                        {results.ph && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Results:
                                    </Typography>
                                    <Typography variant="body2">
                                        {results.ph.missingVariable}: {results.ph.result}
                                        {results.ph.missingVariable === 'pH' ? '' : 
                                         results.ph.missingVariable === 'pKa' ? '' : ' M'}
                                    </Typography>
                                </Alert>
                                <Typography variant="caption" color="text.secondary">
                                    {results.ph.formula}
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={4}>
                        <Typography variant="h6" gutterBottom>
                            Concentration Converter
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Convert between different concentration units (M, mM, μM, nM, g/L, mg/mL)
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Value"
                                    type="number"
                                    value={concentrationData.value}
                                    onChange={(e) => setConcentrationData(prev => ({ ...prev, value: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>From Unit</InputLabel>
                                    <Select
                                        value={concentrationData.fromUnit}
                                        onChange={(e) => setConcentrationData(prev => ({ ...prev, fromUnit: e.target.value }))}
                                    >
                                        <MenuItem value="M">M</MenuItem>
                                        <MenuItem value="mM">mM</MenuItem>
                                        <MenuItem value="μM">μM</MenuItem>
                                        <MenuItem value="nM">nM</MenuItem>
                                        <MenuItem value="g/L">g/L</MenuItem>
                                        <MenuItem value="mg/mL">mg/mL</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>To Unit</InputLabel>
                                    <Select
                                        value={concentrationData.toUnit}
                                        onChange={(e) => setConcentrationData(prev => ({ ...prev, toUnit: e.target.value }))}
                                    >
                                        <MenuItem value="M">M</MenuItem>
                                        <MenuItem value="mM">mM</MenuItem>
                                        <MenuItem value="μM">μM</MenuItem>
                                        <MenuItem value="nM">nM</MenuItem>
                                        <MenuItem value="g/L">g/L</MenuItem>
                                        <MenuItem value="mg/mL">mg/mL</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Molecular Weight (g/mol)"
                                    type="number"
                                    value={concentrationData.molecularWeight}
                                    onChange={(e) => setConcentrationData(prev => ({ ...prev, molecularWeight: e.target.value }))}
                                    helperText="Required for g/L and mg/mL"
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={convertConcentration}
                            disabled={!concentrationData.value || !concentrationData.fromUnit || !concentrationData.toUnit}
                        >
                            Convert Concentration
                        </Button>

                        {results.concentration && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Result:
                                    </Typography>
                                    <Typography variant="body2">
                                        {results.concentration.result} {concentrationData.toUnit}
                                    </Typography>
                                </Alert>
                                <Typography variant="caption" color="text.secondary">
                                    {results.concentration.formula}
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={5}>
                        <Typography variant="h6" gutterBottom>
                            Buffer Calculator
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Calculate any variable using Henderson-Hasselbalch equation: pH = pKa + log([A⁻]/[HA]). Enter any 3 values to find the 4th.
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="pKa"
                                    type="number"
                                    value={bufferData.pka}
                                    onChange={(e) => setBufferData(prev => ({ ...prev, pka: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Target pH"
                                    type="number"
                                    value={bufferData.ph}
                                    onChange={(e) => setBufferData(prev => ({ ...prev, ph: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="[HA] Concentration (M)"
                                    type="number"
                                    value={bufferData.acidConcentration}
                                    onChange={(e) => setBufferData(prev => ({ ...prev, acidConcentration: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="[A⁻] Concentration (M)"
                                    type="number"
                                    value={bufferData.baseConcentration}
                                    onChange={(e) => setBufferData(prev => ({ ...prev, baseConcentration: e.target.value }))}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={calculateBuffer}
                            disabled={
                                [bufferData.pka, bufferData.ph, bufferData.acidConcentration, bufferData.baseConcentration]
                                .filter(val => val && parseFloat(val) > 0).length !== 3
                            }
                        >
                            Calculate
                        </Button>

                        {results.buffer && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Results:
                                    </Typography>
                                    <Typography variant="body2">
                                        {results.buffer.missingVariable}: {results.buffer.result}
                                        {results.buffer.missingVariable === 'pH' ? '' : 
                                         results.buffer.missingVariable === 'pKa' ? '' : ' M'}
                                    </Typography>
                                </Alert>
                                <Typography variant="caption" color="text.secondary">
                                    {results.buffer.formula}
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={6}>
                        <Typography variant="h6" gutterBottom>
                            Unit Converter
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Convert between common scientific units
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={unitData.category}
                                        onChange={(e) => setUnitData(prev => ({ ...prev, category: e.target.value }))}
                                    >
                                        <MenuItem value="mass">Mass</MenuItem>
                                        <MenuItem value="volume">Volume</MenuItem>
                                        <MenuItem value="length">Length</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Value"
                                    type="number"
                                    value={unitData.value}
                                    onChange={(e) => setUnitData(prev => ({ ...prev, value: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>From Unit</InputLabel>
                                    <Select
                                        value={unitData.fromUnit}
                                        onChange={(e) => setUnitData(prev => ({ ...prev, fromUnit: e.target.value }))}
                                    >
                                        {unitData.category === 'mass' && (
                                            <>
                                                <MenuItem value="g">g</MenuItem>
                                                <MenuItem value="mg">mg</MenuItem>
                                                <MenuItem value="μg">μg</MenuItem>
                                            </>
                                        )}
                                        {unitData.category === 'volume' && (
                                            <>
                                                <MenuItem value="L">L</MenuItem>
                                                <MenuItem value="mL">mL</MenuItem>
                                                <MenuItem value="μL">μL</MenuItem>
                                            </>
                                        )}
                                        {unitData.category === 'length' && (
                                            <>
                                                <MenuItem value="m">m</MenuItem>
                                                <MenuItem value="cm">cm</MenuItem>
                                                <MenuItem value="mm">mm</MenuItem>
                                            </>
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>To Unit</InputLabel>
                                    <Select
                                        value={unitData.toUnit}
                                        onChange={(e) => setUnitData(prev => ({ ...prev, toUnit: e.target.value }))}
                                    >
                                        {unitData.category === 'mass' && (
                                            <>
                                                <MenuItem value="g">g</MenuItem>
                                                <MenuItem value="mg">mg</MenuItem>
                                                <MenuItem value="μg">μg</MenuItem>
                                            </>
                                        )}
                                        {unitData.category === 'volume' && (
                                            <>
                                                <MenuItem value="L">L</MenuItem>
                                                <MenuItem value="mL">mL</MenuItem>
                                                <MenuItem value="μL">μL</MenuItem>
                                            </>
                                        )}
                                        {unitData.category === 'length' && (
                                            <>
                                                <MenuItem value="m">m</MenuItem>
                                                <MenuItem value="cm">cm</MenuItem>
                                                <MenuItem value="mm">mm</MenuItem>
                                            </>
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={convertUnit}
                            disabled={!unitData.value || !unitData.fromUnit || !unitData.toUnit}
                        >
                            Convert Unit
                        </Button>

                        {results.unit && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Result:
                                    </Typography>
                                    <Typography variant="body2">
                                        {results.unit.result} {unitData.toUnit}
                                    </Typography>
                                </Alert>
                                <Typography variant="caption" color="text.secondary">
                                    {results.unit.formula}
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={7}>
                        <Typography variant="h6" gutterBottom>
                            Statistics Calculator
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Basic statistical calculations for research data
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Values (comma-separated)"
                                    value={statsData.values}
                                    onChange={(e) => setStatsData(prev => ({ ...prev, values: e.target.value }))}
                                    helperText="Enter numbers separated by commas (e.g., 1, 2, 3, 4, 5)"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Operation</InputLabel>
                                    <Select
                                        value={statsData.operation}
                                        onChange={(e) => setStatsData(prev => ({ ...prev, operation: e.target.value }))}
                                    >
                                        <MenuItem value="mean">Mean</MenuItem>
                                        <MenuItem value="median">Median</MenuItem>
                                        <MenuItem value="std">Standard Deviation</MenuItem>
                                        <MenuItem value="sum">Sum</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={calculateStats}
                            disabled={!statsData.values}
                        >
                            Calculate Statistics
                        </Button>

                        {results.stats && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Results:
                                    </Typography>
                                    <Typography variant="body2">
                                        {statsData.operation === 'mean' && 'Mean'}
                                        {statsData.operation === 'median' && 'Median'}
                                        {statsData.operation === 'std' && 'Standard Deviation'}
                                        {statsData.operation === 'sum' && 'Sum'}: {results.stats.result}
                                    </Typography>
                                    <Typography variant="body2">
                                        Number of values: {results.stats.count}
                                    </Typography>
                                </Alert>
                                <Typography variant="caption" color="text.secondary">
                                    {results.stats.formula}
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>

                    <TabPanel value={activeTab} index={8}>
                        <Typography variant="h6" gutterBottom>
                            Molecular Weight Calculator
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Calculate molecular weight from chemical formula (e.g., H2SO4, C6H12O6)
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Chemical Formula"
                                    value={molecularWeightData.formula}
                                    onChange={(e) => setMolecularWeightData(prev => ({ ...prev, formula: e.target.value }))}
                                    helperText="Enter formula like H2SO4, C6H12O6, NaCl"
                                    placeholder="H2SO4"
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={calculateMolecularWeight}
                            disabled={!molecularWeightData.formula}
                        >
                            Calculate Molecular Weight
                        </Button>

                        {results.molecularWeight && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Results:
                                    </Typography>
                                    <Typography variant="body2">
                                        Molecular Weight: {results.molecularWeight.weight} g/mol
                                    </Typography>
                                    <Typography variant="body2">
                                        Formula: {results.molecularWeight.formula}
                                    </Typography>
                                    <Typography variant="body2">
                                        Elements: {results.molecularWeight.elements}
                                    </Typography>
                                </Alert>
                            </Box>
                        )}
                    </TabPanel>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Calculators; 