export interface VariableCategory {
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    unit?: string;
    dataType: 'number' | 'text' | 'boolean' | 'date' | 'select';
    options?: string; // JSON array for select type
    minValue?: number;
    maxValue?: number;
    isRequired: boolean;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ExperimentVariable {
    id: string;
    experimentId: string;
    categoryId: string;
    name: string;
    description?: string;
    unit?: string;
    dataType: 'number' | 'text' | 'boolean' | 'date' | 'select';
    isRequired: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
    category: VariableCategory;
    values: VariableValue[];
}

export interface VariableValue {
    id: string;
    variableId: string;
    value: string;
    timestamp: string;
    notes?: string;
    metadata?: string;
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Experiment {
    id: string;
    name: string;
    description?: string;
    project: {
        id: string;
        name: string;
    };
}

export interface AnalyticsData {
    variableStats: Array<{
        categoryId: string;
        _count: {
            id: number;
        };
    }>;
    recentValues: Array<{
        id: string;
        value: string;
        timestamp: string;
        variable: {
            name: string;
        };
    }>;
}

export interface CategoryFormData {
    name: string;
    description: string;
    color: string;
    icon: string;
    unit: string;
    dataType: 'number' | 'text' | 'boolean' | 'date' | 'select';
    options: string;
    minValue: string;
    maxValue: string;
    isRequired: boolean;
    isGlobal: boolean;
}

export interface VariableFormData {
    categoryId: string;
    name: string;
    description: string;
    unit: string;
    dataType: 'number' | 'text' | 'boolean' | 'date' | 'select';
    isRequired: boolean;
    order: number;
}

export interface ValueFormData {
    value: string;
    notes: string;
} 