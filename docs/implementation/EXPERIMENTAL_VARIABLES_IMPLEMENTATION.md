# Experimental Variables Implementation Guide

## Overview

The Experimental Variable Tracker is a comprehensive system for managing experimental parameters, variables, and their values across research projects. It provides sophisticated category management, real-time value recording, and analytical insights.

## Architecture

### Database Schema

The system uses a three-table design:

1. **VariableCategory**: Defines reusable variable categories with data types and validation rules
2. **ExperimentVariable**: Links variables to specific experiments with custom configurations
3. **VariableValue**: Stores individual value recordings with timestamps and metadata

### API Endpoints

#### Categories
- `GET /experimental-variables/categories` - Get all categories for user
- `POST /experimental-variables/categories` - Create new category
- `PUT /experimental-variables/categories/:id` - Update category
- `DELETE /experimental-variables/categories/:id` - Delete category

#### Experiment Variables
- `GET /experimental-variables/experiments/:experimentId/variables` - Get variables for experiment
- `POST /experimental-variables/experiments/:experimentId/variables` - Add variable to experiment
- `PUT /experimental-variables/variables/:id` - Update variable
- `DELETE /experimental-variables/variables/:id` - Delete variable

#### Variable Values
- `GET /experimental-variables/variables/:id/values` - Get values for variable
- `POST /experimental-variables/variables/:id/values` - Add value to variable

#### Analytics
- `GET /experimental-variables/analytics` - Get analytics data

## Recent Bug Fixes and Improvements

### Fixed Issues (January 27, 2025)

#### 1. Analytics API Endpoint Handling
**Problem**: Analytics were being fetched even when no experiment was selected, causing unnecessary API calls and potential errors.

**Solution**: Added validation to prevent analytics fetching when `selectedExperiment` is empty:
```typescript
const fetchAnalytics = async () => {
    if (!selectedExperiment) return; // Don't fetch if no experiment selected
    
    try {
        const response = await api.get('/experimental-variables/analytics', {
            headers: { Authorization: `Bearer ${token}` },
            params: { experimentId: selectedExperiment }
        });
        setAnalytics(response.data);
    } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setError('Failed to fetch analytics');
    }
};
```

#### 2. Boolean Value Handling
**Problem**: Frontend only provided 'true'/'false' options, but backend validation accepted multiple formats.

**Solution**: Enhanced boolean input to support multiple formats:
```typescript
case 'boolean':
    return (
        <FormControl fullWidth>
            <InputLabel>Value</InputLabel>
            <Select
                value={valueForm.value}
                onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                label="Value"
            >
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
                <MenuItem value="1">Yes (1)</MenuItem>
                <MenuItem value="0">No (0)</MenuItem>
            </Select>
        </FormControl>
    );
```

#### 3. JSON Parsing Error Handling
**Problem**: Invalid JSON in select options would crash the component.

**Solution**: Added try-catch block around JSON.parse():
```typescript
case 'select':
    let selectOptions: string[] = [];
    try {
        selectOptions = options ? JSON.parse(options) : [];
    } catch (parseError) {
        console.error('Failed to parse select options:', parseError);
        selectOptions = [];
    }
    return (
        <FormControl fullWidth>
            <InputLabel>Value</InputLabel>
            <Select
                value={valueForm.value}
                onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                label="Value"
            >
                {selectOptions.map((option: string) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
            </Select>
        </FormControl>
    );
```

#### 4. Experiment Data Structure
**Problem**: Incorrect API endpoint was being used for fetching experiments.

**Solution**: Fixed to use the correct endpoint:
```typescript
const fetchExperiments = async () => {
    try {
        // Use the correct endpoint for experiments
        const response = await api.get('/projects/experiments/all', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setExperiments(response.data);
    } catch (error) {
        console.error('Failed to fetch experiments:', error);
        setError('Failed to fetch experiments');
    }
};
```

#### 5. Form Validation
**Problem**: No client-side validation before form submission.

**Solution**: Implemented comprehensive validation with user feedback:
```typescript
const validateCategoryForm = (): string | null => {
    if (!categoryForm.name.trim()) {
        return 'Category name is required';
    }
    const dataType = categoryForm.dataType;
    if (dataType === 'select' && !categoryForm.options.trim()) {
        return 'Options are required for select type';
    }
    if (dataType === 'number' && categoryForm.minValue && categoryForm.maxValue) {
        const min = parseFloat(categoryForm.minValue);
        const max = parseFloat(categoryForm.maxValue);
        if (min >= max) {
            return 'Min value must be less than max value';
        }
    }
    return null;
};
```

### Additional Improvements

#### Error State Management
- Added comprehensive error handling with dismissible alerts
- Implemented proper error state management across all API calls
- Added user-friendly error messages with backend error details

#### Form Enhancements
- Added required field indicators in forms
- Implemented helper text for JSON array input
- Enhanced form validation with clear error messages

#### User Experience
- Added loading states and progress indicators
- Implemented proper error feedback for all operations
- Enhanced boolean value input with multiple format support

## Data Types Supported

### Number Variables
- **Examples**: Temperature, pH, concentration, time, weight
- **Features**: Min/max validation, unit specification, decimal precision
- **Validation**: Automatic number validation with range checking

### Text Variables
- **Examples**: Notes, observations, sample IDs, equipment settings
- **Features**: Free-form text entry, length validation
- **Validation**: Required field validation

### Boolean Variables
- **Examples**: Equipment on/off, presence/absence, success/failure
- **Features**: Multiple format support (true/false, 1/0, yes/no)
- **Validation**: Backend validation for multiple boolean formats

### Date Variables
- **Examples**: Sample collection date, experiment start time, measurement time
- **Features**: Date and time picker, automatic timestamp recording
- **Validation**: Date format validation

### Select Variables
- **Examples**: Equipment types, sample sources, experimental conditions
- **Features**: Dropdown selection, predefined options as JSON array
- **Validation**: JSON parsing with error handling

## Usage Guidelines

### Creating Categories
1. Navigate to the Experimental Variables section
2. Click "Add Category" button
3. Fill in required fields (name, data type)
4. For select type, provide options as JSON array: `["Option 1", "Option 2"]`
5. Set validation rules (min/max values for numbers)
6. Choose if category should be global or project-specific

### Adding Variables to Experiments
1. Select an experiment from the dropdown
2. Click "Add Variable" button
3. Choose a category and provide variable details
4. Set custom units and ordering if needed
5. Mark as required if critical for experiment completion

### Recording Values
1. Select an experiment and navigate to "Value Tracking" tab
2. Click "Record Value" for the desired variable
3. Enter value according to data type requirements
4. Add optional notes for context
5. Submit to save with automatic timestamp

### Viewing Analytics
1. Click "Analytics" button to open analytics dialog
2. View variable distribution by category
3. Check recent value recordings
4. Monitor trends and patterns

## Best Practices

### Category Management
- Use descriptive names for categories
- Set appropriate data types and validation rules
- Use global categories for common variables across projects
- Provide clear descriptions for complex categories

### Variable Configuration
- Inherit data types from categories when possible
- Use consistent units across similar variables
- Set logical ordering for data entry workflow
- Mark critical variables as required

### Value Recording
- Record values immediately after measurements
- Use consistent value formats within variables
- Add notes for context and observations
- Review value history for trends and anomalies

### Error Handling
- Monitor error alerts for validation issues
- Check JSON format for select options
- Verify experiment selection before analytics
- Use proper boolean formats for backend compatibility

## Technical Notes

### API Integration
- All endpoints require authentication via Bearer token
- Error responses include detailed error messages
- Analytics require experiment ID parameter
- Values are automatically timestamped on creation

### Data Validation
- Backend validates all data types and formats
- Frontend provides immediate feedback for validation errors
- JSON parsing errors are handled gracefully
- Boolean values support multiple input formats

### Performance Considerations
- Analytics are only fetched when experiment is selected
- Large datasets are paginated in value history
- Categories are cached and reused across experiments
- Error states prevent unnecessary API calls

## Future Enhancements

### Planned Features
- Real-time value updates via WebSocket
- Advanced analytics with trend analysis
- Bulk value import/export functionality
- Variable templates for common experiment types
- Integration with external data sources

### Technical Improvements
- Enhanced caching for better performance
- Offline support for value recording
- Advanced validation rules and constraints
- Automated data quality checks
- Integration with lab equipment APIs 