'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Bell, Search, X, ChevronLeft, ChevronRight, Info, CheckCircle, AlertTriangle, Tag, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCookie } from 'cookies-next'
import { notificationAPI } from '@/services/api'
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal'
import PermissionDenied from '@/components/Common/PermissionDenied'
import { useAppContext } from '@/context/AppContext'

const TYPE_CONFIG = {
    info: { label: 'Info', color: 'bg-blue-100 text-blue-800', icon: Info, iconColor: 'text-blue-500' },
    success: { label: 'Success', color: 'bg-green-100 text-green-800', icon: CheckCircle, iconColor: 'text-green-500' },
    warning: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, iconColor: 'text-yellow-500' },
    promotion: { label: 'Promotion', color: 'bg-purple-100 text-purple-800', icon: Tag, iconColor: 'text-purple-500' },
    alert: { label: 'Alert', color: 'bg-red-100 text-red-800', icon: AlertCircle, iconColor: 'text-red-500' },
}

const EMPTY_FORM = {
    title: '',
    message: '',
    type: 'info',
    link: '',
    expiresAt: '',
    isActive: true,
}

export default function AdminNotificationsPage() {
    const { hasPermission, contextLoading } = useAppContext()

    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 10

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentNotification, setCurrentNotification] = useState(null)
    const [formData, setFormData] = useState(EMPTY_FORM)
    const [submitting, setSubmitting] = useState(false)

    // Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [notifToDelete, setNotifToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            const params = { page: currentPage, limit }
            if (statusFilter === 'active') params.activeOnly = 'true'
            if (statusFilter === 'inactive') params.activeOnly = 'false'
            if (typeFilter !== 'all') params.type = typeFilter
            if (searchTerm.trim()) params.search = searchTerm.trim()

            const data = await notificationAPI.getNotifications(params, token)
            if (data.success) {
                setNotifications(data.data || [])
                setTotalPages(data.pagination?.totalPages || 1)
                setTotal(data.pagination?.total || 0)
            }
        } catch (err) {
            console.error(err)
            toast.error('Failed to fetch notifications')
        } finally {
            setLoading(false)
        }
    }, [currentPage, statusFilter, typeFilter, searchTerm])

    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, typeFilter, searchTerm])

    useEffect(() => {
        if (contextLoading) return
        const timer = setTimeout(fetchNotifications, searchTerm ? 400 : 0)
        return () => clearTimeout(timer)
    }, [contextLoading, fetchNotifications])

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const openCreateModal = () => {
        setCurrentNotification(null)
        setFormData(EMPTY_FORM)
        setIsModalOpen(true)
    }

    const openEditModal = (notif) => {
        setCurrentNotification(notif)
        setFormData({
            title: notif.title,
            message: notif.message,
            type: notif.type,
            link: notif.link || '',
            expiresAt: notif.expiresAt ? new Date(notif.expiresAt).toISOString().split('T')[0] : '',
            isActive: notif.isActive,
        })
        setIsModalOpen(true)
    }

    const closeModal = () => { setIsModalOpen(false); setCurrentNotification(null) }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            const token = getCookie('token')
            const payload = { ...formData, expiresAt: formData.expiresAt || null }
            const res = currentNotification
                ? await notificationAPI.updateNotification(currentNotification._id, payload, token)
                : await notificationAPI.createNotification(payload, token)

            if (res.success) {
                toast.success(currentNotification ? 'Notification updated!' : 'Notification created!')
                closeModal()
                fetchNotifications()
            } else {
                toast.error(res.message || 'Something went wrong')
            }
        } catch (err) {
            toast.error(err.message || 'Error saving notification')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Delete helpers ────────────────────────────────────────────────────────
    const handleDeleteClick = (notif) => { setNotifToDelete(notif); setShowDeleteModal(true) }

    const confirmDelete = async () => {
        if (!notifToDelete) return
        try {
            setDeleting(true)
            const token = getCookie('token')
            const res = await notificationAPI.deleteNotification(notifToDelete._id, token)
            if (res.success) {
                toast.success('Notification deleted!')
                setShowDeleteModal(false)
                setNotifToDelete(null)
                fetchNotifications()
            }
        } catch (err) {
            toast.error('Error deleting notification')
        } finally {
            setDeleting(false)
        }
    }

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // ── Guards ────────────────────────────────────────────────────────────────
    if (contextLoading) return null

    if (!hasPermission('notification', 'read')) {
        return (
            <PermissionDenied
                title="Access Denied"
                message="You don't have permission to view notifications."
                action="Read Notifications"
            />
        )
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                        <p className="mt-1 text-sm text-gray-500">Create and manage guest-facing notifications</p>
                    </div>
                    {hasPermission('notification', 'create') && (
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Notification
                        </button>
                    )}
                </div>
            </div>

            {/* ── Search & Filters ── */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="sm:w-44">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="sm:w-44">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="info">Info</option>
                            <option value="success">Success</option>
                            <option value="warning">Warning</option>
                            <option value="promotion">Promotion</option>
                            <option value="alert">Alert</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-32">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                                <p className="text-sm text-gray-500">Loading notifications...</p>
                            </div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {notifications.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                                ? 'No notifications found matching your criteria.'
                                                : 'No notifications yet. Create your first one!'}
                                        </td>
                                    </tr>
                                ) : (
                                    notifications.map((notif) => {
                                        const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info
                                        const TypeIcon = cfg.icon
                                        return (
                                            <tr key={notif._id} className="hover:bg-gray-50">
                                                {/* Title + message */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                                                            <TypeIcon className={`h-5 w-5 ${cfg.iconColor}`} />
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">{notif.title}</div>
                                                            <div className="text-xs text-gray-500 max-w-xs truncate">{notif.message}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Type badge */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                {/* Status badge */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${notif.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {notif.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                {/* Expires */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {notif.expiresAt ? new Date(notif.expiresAt).toLocaleDateString() : '—'}
                                                </td>
                                                {/* Created */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </td>
                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {hasPermission('notification', 'update') && (
                                                            <button
                                                                onClick={() => openEditModal(notif)}
                                                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {hasPermission('notification', 'delete') && (
                                                            <button
                                                                onClick={() => handleDeleteClick(notif)}
                                                                className="text-red-600 hover:text-red-900 p-1"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ── Pagination ── */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-500">
                        Showing {notifications.length} of {total} notifications (Page {currentPage} of {totalPages})
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </button>
                            <div className="flex items-center space-x-1">
                                {[...Array(totalPages)].map((_, idx) => {
                                    const page = idx + 1
                                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return <span key={page} className="px-2 text-gray-500">...</span>
                                    }
                                    return null
                                })}
                            </div>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create / Edit Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {currentNotification ? 'Edit Notification' : 'Create Notification'}
                            </h2>
                            <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="notification-form" onSubmit={handleSubmit} className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 15% Off All Gold Items"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="message"
                                        required
                                        rows="3"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Write the full notification message..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                    />
                                </div>

                                {/* Type + Expires */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        >
                                            <option value="info">Info</option>
                                            <option value="success">Success</option>
                                            <option value="warning">Warning</option>
                                            <option value="promotion">Promotion</option>
                                            <option value="alert">Alert</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expires At <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <input
                                            type="date"
                                            name="expiresAt"
                                            value={formData.expiresAt}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Action Link */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Link <span className="text-gray-400 font-normal">(optional)</span></label>
                                    <input
                                        type="text"
                                        name="link"
                                        value={formData.link}
                                        onChange={handleInputChange}
                                        placeholder="/shop/gold-rings or https://..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* Active checkbox */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                        Active (visible to users)
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex-shrink-0 p-6 border-t border-gray-200">
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={submitting}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="notification-form"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        currentNotification ? 'Update Notification' : 'Create Notification'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Modal ── */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setNotifToDelete(null) }}
                onConfirm={confirmDelete}
                title="Delete Notification"
                message="Are you sure you want to delete this notification? This action cannot be undone."
                itemName={notifToDelete?.title}
                itemType="notification"
                isLoading={deleting}
                confirmText="Delete Notification"
                cancelText="Cancel"
                dangerLevel="high"
            />
        </div>
    )
}
