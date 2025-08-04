#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🔗 Testing Frontend Deep Linking for Research Notebook...\n');

// Test deep link route mappings
const testDeepLinkRoutes = [
    {
        entityType: 'note',
        entityId: '123',
        params: { mode: 'edit', section: 'content' },
        expectedRoute: '/notes/123?mode=edit&section=content'
    },
    {
        entityType: 'project',
        entityId: '456',
        params: { view: 'overview', tab: 'details' },
        expectedRoute: '/projects/456?view=overview&tab=details'
    },
    {
        entityType: 'pdf',
        entityId: 'document.pdf',
        params: { page: 10, zoom: 1.2 },
        expectedRoute: '/pdfs/document.pdf?page=10&zoom=1.2'
    },
    {
        entityType: 'protocol',
        entityId: '789',
        params: { step: 3, mode: 'edit' },
        expectedRoute: '/protocols/789?step=3&mode=edit'
    },
    {
        entityType: 'recipe',
        entityId: '101',
        params: { step: 1, mode: 'view' },
        expectedRoute: '/recipes/101?step=1&mode=view'
    },
    {
        entityType: 'task',
        entityId: '202',
        params: { mode: 'edit', show: 'details' },
        expectedRoute: '/tasks/202?mode=edit&show=details'
    },
    {
        entityType: 'search',
        entityId: undefined,
        params: { q: 'research', type: 'all' },
        expectedRoute: '/search?q=research&type=all'
    },
    {
        entityType: 'dashboard',
        entityId: undefined,
        params: { view: 'projects', filters: { active: true } },
        expectedRoute: '/dashboard?view=projects&filter_active=true'
    }
];

console.log('🧪 Testing Deep Link Route Mappings...\n');

// Mock route mapping function (simplified version of what's in DeepLinkRouter)
function mockRouteMapping(entityType, entityId, params) {
    const routeHandlers = {
        note: (entityId, params) => {
            if (!entityId) return '/notes';
            const queryParams = new URLSearchParams();
            if (params?.mode) queryParams.set('mode', params.mode);
            if (params?.section) queryParams.set('section', params.section);
            if (params?.highlight) queryParams.set('highlight', params.highlight);
            const queryString = queryParams.toString();
            return `/notes/${entityId}${queryString ? `?${queryString}` : ''}`;
        },
        
        project: (entityId, params) => {
            if (!entityId) return '/projects';
            const queryParams = new URLSearchParams();
            if (params?.view) queryParams.set('view', params.view);
            if (params?.tab) queryParams.set('tab', params.tab);
            if (params?.filter) queryParams.set('filter', params.filter);
            const queryString = queryParams.toString();
            return `/projects/${entityId}${queryString ? `?${queryString}` : ''}`;
        },
        
        pdf: (entityId, params) => {
            if (!entityId) return '/pdfs';
            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.set('page', params.page);
            if (params?.zoom) queryParams.set('zoom', params.zoom);
            if (params?.highlight) queryParams.set('highlight', params.highlight);
            const queryString = queryParams.toString();
            return `/pdfs/${entityId}${queryString ? `?${queryString}` : ''}`;
        },
        
        protocol: (entityId, params) => {
            if (!entityId) return '/protocols';
            const queryParams = new URLSearchParams();
            if (params?.step) queryParams.set('step', params.step);
            if (params?.mode) queryParams.set('mode', params.mode);
            const queryString = queryParams.toString();
            return `/protocols/${entityId}${queryString ? `?${queryString}` : ''}`;
        },
        
        recipe: (entityId, params) => {
            if (!entityId) return '/recipes';
            const queryParams = new URLSearchParams();
            if (params?.step) queryParams.set('step', params.step);
            if (params?.mode) queryParams.set('mode', params.mode);
            const queryString = queryParams.toString();
            return `/recipes/${entityId}${queryString ? `?${queryString}` : ''}`;
        },
        
        task: (entityId, params) => {
            if (!entityId) return '/tasks';
            const queryParams = new URLSearchParams();
            if (params?.mode) queryParams.set('mode', params.mode);
            if (params?.show) queryParams.set('show', params.show);
            const queryString = queryParams.toString();
            return `/tasks/${entityId}${queryString ? `?${queryString}` : ''}`;
        },
        
        search: (entityId, params) => {
            const queryParams = new URLSearchParams();
            if (params?.q) queryParams.set('q', params.q);
            if (params?.query) queryParams.set('q', params.query);
            if (params?.type) queryParams.set('type', params.type);
            if (params?.filters) {
                try {
                    const filters = typeof params.filters === 'string' ? JSON.parse(params.filters) : params.filters;
                    Object.entries(filters).forEach(([key, value]) => {
                        queryParams.set(`filter_${key}`, String(value));
                    });
                } catch (error) {
                    console.warn('Failed to parse filters:', error);
                }
            }
            const queryString = queryParams.toString();
            return `/search${queryString ? `?${queryString}` : ''}`;
        },
        
        dashboard: (entityId, params) => {
            const queryParams = new URLSearchParams();
            if (params?.view) queryParams.set('view', params.view);
            if (params?.tab) queryParams.set('tab', params.tab);
            if (params?.filters) {
                try {
                    const filters = typeof params.filters === 'string' ? JSON.parse(params.filters) : params.filters;
                    Object.entries(filters).forEach(([key, value]) => {
                        queryParams.set(`filter_${key}`, String(value));
                    });
                } catch (error) {
                    console.warn('Failed to parse filters:', error);
                }
            }
            const queryString = queryParams.toString();
            return `/dashboard${queryString ? `?${queryString}` : ''}`;
        }
    };
    
    const handler = routeHandlers[entityType.toLowerCase()];
    if (!handler) {
        throw new Error(`No route handler found for entity type: ${entityType}`);
    }
    
    return handler(entityId, params);
}

// Test each route mapping
testDeepLinkRoutes.forEach((test, index) => {
    try {
        const actualRoute = mockRouteMapping(test.entityType, test.entityId, test.params);
        const passed = actualRoute === test.expectedRoute;
        
        console.log(`Test ${index + 1}: ${test.entityType}${test.entityId ? `/${test.entityId}` : ''}`);
        console.log(`  Expected: ${test.expectedRoute}`);
        console.log(`  Actual:   ${actualRoute}`);
        console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
        console.log('');
        
    } catch (error) {
        console.log(`Test ${index + 1}: ${test.entityType}${test.entityId ? `/${test.entityId}` : ''}`);
        console.log(`  Error:    ${error.message}`);
        console.log(`  Status:   ❌ FAIL`);
        console.log('');
    }
});

console.log('🔧 Testing Frontend Deep Link Integration...\n');

// Check if frontend files exist
const frontendFiles = [
    'apps/frontend/src/components/DeepLinkRouter.tsx',
    'apps/frontend/src/hooks/useDeepLinking.ts',
    'apps/frontend/src/components/DeepLinkDemo.tsx'
];

const fs = require('fs');

frontendFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
    }
});

console.log('\n📝 Frontend Deep Link Test Complete!');
console.log('💡 To test manually:');
console.log('   - Start the development server: pnpm dev');
console.log('   - Navigate to: http://localhost:5173/deep-link-demo');
console.log('   - Test the deep link generation and opening functionality');
console.log('   - Try opening deep links from external applications');

console.log('\n🔗 Example Deep Links to Test:');
console.log('   Note: researchenotebook://note/123?mode=edit&section=content');
console.log('   Project: researchenotebook://project/456?view=overview&tab=details');
console.log('   PDF: researchenotebook://pdf/document.pdf?page=10&zoom=1.2');
console.log('   Search: researchenotebook://search?q=protocol&type=all');
console.log('   Dashboard: researchenotebook://dashboard?view=projects&filter_active=true');

console.log('\n🎯 Integration Points:');
console.log('   - DeepLinkRouter listens for Electron deep link events');
console.log('   - useDeepLinking hook provides deep link functionality');
console.log('   - DeepLinkDemo component showcases all features');
console.log('   - React Router integration handles navigation');
console.log('   - Query parameter parsing and validation'); 