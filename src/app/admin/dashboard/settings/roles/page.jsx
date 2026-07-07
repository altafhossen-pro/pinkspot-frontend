'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Search, Save, X, Check, KeyRound, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCookie } from 'cookies-next'
import { roleAPI } from '@/services/api'
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'

export default function RoleManagementPage() {
    const { hasPermission, contextLoading } = useAppContext()
    const [roles, setRoles] = useState([])
    const [permissions, setPermissions] = useState({ all: [], grouped: {} })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingRole, setEditingRole] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [roleToDelete, setRoleToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasReadPermission, setHasReadPermission] = useState(false)
    const [hasCreatePermission, setHasCreatePermission] = useState(false)
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false)
    const [hasDeletePermission, setHasDeletePermission] = useState(false)
    const [permissionError, setPermissionError] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [],
        isDefault: false,
        isActive: true,
    })

    useEffect(() => {
        if (contextLoading) return
        
        const canRead = hasPermission('role', 'read')
        const canCreate = hasPermission('role', 'create')
        const canUpdate = hasPermission('role', 'update')
        const canDelete = hasPermission('role', 'delete')
        
        setHasReadPermission(canRead)
        setHasCreatePermission(canCreate)
        setHasUpdatePermission(canUpdate)
        setHasDeletePermission(canDelete)
        setCheckingPermission(false)
        
        if (canRead) {
            fetchRoles()
            fetchPermissions()
        } else {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextLoading])

    const fetchRoles = useCallback(async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            const data = await roleAPI.getRoles({}, token)

            if (data.success) {
                setRoles(data.data || [])
            } else {
                if (data.status === 403) {
                    setPermissionError(data.message || "You don't have permission to view roles")
                } else {
                    toast.error(data.message || 'Failed to fetch roles')
                }
            }
        } catch (error) {
            console.error('Error fetching roles:', error)
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to view roles")
            } else {
                toast.error('Error fetching roles')
            }
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchPermissions = useCallback(async () => {
        try {
            const token = getCookie('token')
            const data = await roleAPI.getPermissions(null, token)

            if (data.success) {
                setPermissions({
                    all: data.data.all || [],
                    grouped: data.data.grouped || {},
                })
            }
        } catch (error) {
            console.error('Error fetching permissions:', error)
        }
    }, [])

    const handleCreateRole = () => {
        setFormData({
            name: '',
            description: '',
            permissions: [],
            isDefault: false,
            isActive: true,
        })
        setEditingRole(null)
        setShowCreateModal(true)
    }

    const handleEditRole = (role) => {
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions?.map(p => p._id || p) || [],
            isDefault: role.isDefault || false,
            isActive: role.isActive !== undefined ? role.isActive : true,
        })
        setEditingRole(role)
        setShowCreateModal(true)
    }

    const handleDeleteRole = (role) => {
        setRoleToDelete(role)
        setShowDeleteModal(true)
    }

    const confirmDeleteRole = async () => {
        if (!roleToDelete) return

        if (!hasDeletePermission) {
            toast.error("You don't have permission to delete roles")
            setShowDeleteModal(false)
            setRoleToDelete(null)
            return
        }

        try {
            setDeleting(true)
            const token = getCookie('token')
            const data = await roleAPI.deleteRole(roleToDelete._id, token)

            if (data.success) {
                toast.success('Role deleted successfully!')
                setShowDeleteModal(false)
                setRoleToDelete(null)
                fetchRoles()
            } else {
                toast.error(data.message || 'Failed to delete role')
            }
        } catch (error) {
            console.error('Error deleting role:', error)
            toast.error('Error deleting role')
        } finally {
            setDeleting(false)
        }
    }

    const handleTogglePermission = (permissionId) => {
        setFormData(prev => {
            const isSelected = prev.permissions.includes(permissionId)
            return {
                ...prev,
                permissions: isSelected
                    ? prev.permissions.filter(id => id !== permissionId)
                    : [...prev.permissions, permissionId]
            }
        })
    }

    const handleSelectAllCategory = (category) => {
        const categoryPermissions = permissions.all.filter(p => p.category === category)
        const categoryIds = categoryPermissions.map(p => p._id)
        const allSelected = categoryIds.every(id => formData.permissions.includes(id))

        setFormData(prev => ({
            ...prev,
            permissions: allSelected
                ? prev.permissions.filter(id => !categoryIds.includes(id))
                : [...new Set([...prev.permissions, ...categoryIds])]
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Role name is required')
            return
        }

        // Check permissions
        if (editingRole && !hasUpdatePermission) {
            toast.error("You don't have permission to update roles")
            return
        }

        if (!editingRole && !hasCreatePermission) {
            toast.error("You don't have permission to create roles")
            return
        }

        try {
            const token = getCookie('token')
            let data

            if (editingRole) {
                data = await roleAPI.updateRole(editingRole._id, formData, token)
            } else {
                data = await roleAPI.createRole(formData, token)
            }

            if (data.success) {
                toast.success(editingRole ? 'Role updated successfully!' : 'Role created successfully!')
                setShowCreateModal(false)
                setEditingRole(null)
                setFormData({
                    name: '',
                    description: '',
                    permissions: [],
                    isDefault: false,
                    isActive: true,
                })
                fetchRoles()
            } else {
                toast.error(data.message || 'Failed to save role')
            }
        } catch (error) {
            console.error('Error saving role:', error)
            toast.error('Error saving role')
        }
    }

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const categoryLabels = {
        product: 'Products',
        order: 'Orders',
        user: 'Users',
        category: 'Categories',
        coupon: 'Coupons',
        ads: 'Ads',
        settings: 'Settings',
        content: 'Content',
        analytics: 'Analytics',
        system: 'System',
        admin: 'Admin'
        
    }

    if (checkingPermission || contextLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!hasReadPermission || permissionError) {
        return (
            <PermissionDenied 
                title="Access Denied"
                message={permissionError || "You don't have permission to view roles"}
                action="Contact your administrator for access"
                showBackButton={true}
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <KeyRound className="h-6 w-6" />
                            Role Based Access Control
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage roles and their permissions
                        </p>
                    </div>
                    {hasCreatePermission && (
                        <button
                            onClick={handleCreateRole}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Role
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Roles List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Permissions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRoles.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm ? 'No roles found matching your search.' : 'No roles found. Create one to get started.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredRoles.map((role) => (
                                    <tr key={role._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                        {role.isSuperAdmin && <Shield className="h-4 w-4 text-yellow-500" />}
                                                        {role.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {role.description || 'No description'}
                                                    </div>
                                                    {role.isSuperAdmin && (
                                                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Super Admin
                                                        </span>
                                                    )}
                                                    {role.isDefault && (
                                                        <span className="inline-flex items-center mt-1 ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {role.permissions?.length || 0} permission(s)
                                            </div>
                                            {role.isSuperAdmin && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Has all permissions
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {role.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {!role.isSuperAdmin && (
                                                    <>
                                                        {hasUpdatePermission && (
                                                            <button
                                                                onClick={() => handleEditRole(role)}
                                                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {hasDeletePermission && (
                                                            <button
                                                                onClick={() => handleDeleteRole(role)}
                                                                className="text-red-600 hover:text-red-900 p-1"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {role.isSuperAdmin && (
                                                    <span className="text-xs text-gray-400">Cannot modify</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        {/* Modal Header - Fixed */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 flex-shrink-0">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingRole ? 'Edit Role' : 'Create New Role'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setEditingRole(null)
                                    setFormData({
                                        name: '',
                                        description: '',
                                        permissions: [],
                                        isDefault: false,
                                        isActive: true,
                                    })
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="h-full flex flex-col">
                                <div className="p-6 space-y-6 flex-1">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Role Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g., Manager, Moderator"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Role description"
                                            />
                                        </div>
                                    </div>

                                    {/* Status Toggles */}
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Active</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isDefault}
                                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Default Role</span>
                                        </label>
                                    </div>

                                    {/* Permissions Selection */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Permissions *
                                            </label>
                                            <span className="text-sm text-gray-500">
                                                {formData.permissions.length} permission(s) selected
                                            </span>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg p-4 space-y-6">
                                            {Object.keys(categoryLabels).map((category) => {
                                                const categoryPerms = permissions.all.filter(p => p.category === category)
                                                if (categoryPerms.length === 0) return null

                                                const categoryIds = categoryPerms.map(p => p._id)
                                                const allSelected = categoryIds.every(id => formData.permissions.includes(id))

                                                return (
                                                    <div key={category} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-sm font-semibold text-gray-900">
                                                                {categoryLabels[category]}
                                                            </h4>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectAllCategory(category)}
                                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                            >
                                                                {allSelected ? 'Deselect All' : 'Select All'}
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {categoryPerms.map((perm) => {
                                                                const isSelected = formData.permissions.includes(perm._id)
                                                                return (
                                                                    <label
                                                                        key={perm._id}
                                                                        className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${isSelected
                                                                                ? 'bg-blue-50 border-blue-200'
                                                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => handleTogglePermission(perm._id)}
                                                                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                        />
                                                                        <div className="ml-2 flex-1">
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {perm.action}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                {perm.module}
                                                                            </div>
                                                                            {perm.description && (
                                                                                <div className="text-xs text-gray-400 mt-1">
                                                                                    {perm.description}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </label>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer - Fixed */}
                                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-10 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            setEditingRole(null)
                                            setFormData({
                                                name: '',
                                                description: '',
                                                permissions: [],
                                                isDefault: false,
                                                isActive: true,
                                            })
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {editingRole ? 'Update Role' : 'Create Role'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false)
                    setRoleToDelete(null)
                }}
                onConfirm={confirmDeleteRole}
                title="Delete Role"
                message="Are you sure you want to delete this role? Users with this role may lose access. This action cannot be undone."
                itemName={roleToDelete?.name}
                itemType="role"
                isLoading={deleting}
                confirmText="Delete Role"
                cancelText="Cancel"
                dangerLevel="high"
            />
        </div>
    )
}
