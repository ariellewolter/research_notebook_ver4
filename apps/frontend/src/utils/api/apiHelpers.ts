import { AxiosError } from 'axios';

export function handleApiError(error: any): string {
    if (error instanceof AxiosError) {
        // Handle axios errors
        if (error.response?.data?.error) {
            return error.response.data.error;
        }
        if (error.response?.status === 401) {
            return 'Authentication required. Please log in again.';
        }
        if (error.response?.status === 403) {
            return 'You do not have permission to perform this action.';
        }
        if (error.response?.status === 404) {
            return 'The requested resource was not found.';
        }
        if (error.response?.status >= 500) {
            return 'Server error. Please try again later.';
        }
        return error.message || 'An error occurred while making the request.';
    }
    
    // Handle other errors
    return error.message || 'An unexpected error occurred.';
}

export function isNetworkError(error: any): boolean {
    return error instanceof AxiosError && !error.response;
}

export function isServerError(error: any): boolean {
    return error instanceof AxiosError && error.response?.status >= 500;
}

export function isClientError(error: any): boolean {
    return error instanceof AxiosError && error.response?.status >= 400 && error.response?.status < 500;
}

export function createQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
                value.forEach(item => searchParams.append(key, item.toString()));
            } else {
                searchParams.append(key, value.toString());
            }
        }
    });
    
    return searchParams.toString();
}

export function parseQueryString(queryString: string): Record<string, string> {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string> = {};
    
    params.forEach((value, key) => {
        result[key] = value;
    });
    
    return result;
}

export function buildApiUrl(baseUrl: string, endpoint: string, params?: Record<string, any>): string {
    const url = `${baseUrl}${endpoint}`;
    
    if (params && Object.keys(params).length > 0) {
        const queryString = createQueryString(params);
        return `${url}?${queryString}`;
    }
    
    return url;
} 