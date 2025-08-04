import React, { useState } from 'react';
import { useProjects } from '../../hooks/api/useProjects';
import { useModal } from '../../hooks/ui/useModal';
import { formatDate } from '../../utils/formatting/dateFormatters';
import { Project } from '../../types/project.types';

interface ProjectListProps {
    onProjectSelect?: (project: Project) => void;
}

export function ProjectList({ onProjectSelect }: ProjectListProps) {
    const [filters, setFilters] = useState({
        status: '',
        search: '',
    });

    const {
        projects,
        loading,
        error,
        pagination,
        fetchProjects,
        deleteProject,
        clearError,
    } = useProjects({
        autoFetch: true,
        ...filters,
    });

    const createModal = useModal();

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = () => {
        fetchProjects(filters);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            await deleteProject(id);
        }
    };

    const handleProjectClick = (project: Project) => {
        onProjectSelect?.(project);
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <p className="text-red-800">{error}</p>
                    <button
                        onClick={clearError}
                        className="text-red-600 hover:text-red-800"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
                <input
                    type="text"
                    placeholder="Search projects..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                </select>
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                    Search
                </button>
                <button
                    onClick={createModal.open}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                >
                    Create Project
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Projects List */}
            {!loading && projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No projects found. Create your first project to get started.
                </div>
            )}

            {!loading && projects.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleProjectClick(project)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg text-gray-900 truncate">
                                    {project.title}
                                </h3>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                                    project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                                    project.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                    project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {project.status}
                                </span>
                            </div>
                            
                            {project.description && (
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                    {project.description}
                                </p>
                            )}
                            
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Created {formatDate(project.createdAt)}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle edit
                                        }}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(project.id);
                                        }}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => fetchProjects({ ...filters, page: pagination.page - 1 })}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => fetchProjects({ ...filters, page: pagination.page + 1 })}
                        disabled={!pagination.hasNext}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Create Project Modal */}
            {createModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
                        {/* Add form here */}
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={createModal.close}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createModal.close}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 