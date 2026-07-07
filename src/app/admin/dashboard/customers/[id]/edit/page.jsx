'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
    ArrowLeft, 
    Save, 
    X,
    User,
    Star,
    Mail,
    Phone,
    MapPin,
    Calendar,
    AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { userAPI, roleAPI } from '@/services/api'
import { getCookie } from 'cookies-next'
import LoyaltyPointsSection from '@/components/Admin/LoyaltyPointsSection'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'

export default function EditCustomerPage() {
    const router = useRouter()
    const params = useParams()
    const customerId = params.id
    const { hasPermission, contextLoading, roleDetails, user: currentUser } = useAppContext()
    
    const [customer, setCustomer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [roles, setRoles] = useState([])
    const [loadingRoles, setLoadingRoles] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        status: 'active',
        roleId: null
    })
    const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false)
    const [captchaQuestion, setCaptchaQuestion] = useState('')
    const [captchaAnswer, setCaptchaAnswer] = useState('')
    const [captchaInput, setCaptchaInput] = useState('')
    const [isCaptchaCorrect, setIsCaptchaCorrect] = useState(false)
    const [originalRoleId, setOriginalRoleId] = useState(null)
    const [originalEmail, setOriginalEmail] = useState(null)
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false)
    const [hasRoleUpdatePermission, setHasRoleUpdatePermission] = useState(false)
    const [permissionError, setPermissionError] = useState(null)

    useEffect(() => {
        if (!customerId) return
        if (contextLoading) return
        const canUpdate = hasPermission('user', 'update')
        const canUpdateRole = hasPermission('role', 'update')
        // Role update permission requires role.update permission (module: 'role', action: 'update')
        setHasUpdatePermission(canUpdate)
        setHasRoleUpdatePermission(!!canUpdateRole)
        setCheckingPermission(false)
        if (canUpdate) {
            fetchCustomerDetails()
            fetchRoles()
        } else {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId, contextLoading])

    const fetchRoles = async () => {
        try {
            setLoadingRoles(true)
            const token = getCookie('token')
            const data = await roleAPI.getRoles({ limit: 100 }, token)
            
            if (data.success) {
                setRoles(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching roles:', error)
        } finally {
            setLoadingRoles(false)
        }
    }

    const fetchCustomerDetails = async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            const data = await userAPI.getUserById(customerId, token)
            
            if (data.success) {
                const userData = data.data
                
                // Check if target user is staff (has roleId)
                const targetIsStaff = userData.roleId && (userData.roleId._id || userData.roleId)
                const isCurrentUserSuperAdmin = roleDetails?.isSuperAdmin === true
                
                // If target user is staff and current user is not super admin, deny access
                if (targetIsStaff && !isCurrentUserSuperAdmin) {
                    setPermissionError("Only Super Admin can view or edit staff user data")
                    setLoading(false)
                    return
                }
                
                setCustomer(userData)
                const isStaff = userData.roleId && (userData.roleId._id || userData.roleId)
                
                // Only set roleId if user is staff, otherwise keep it null
                setFormData({
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    address: userData.address || '',
                    status: userData.status,
                    roleId: isStaff ? (userData.roleId?._id || userData.roleId || null) : null
                })
                setOriginalRoleId(isStaff ? (userData.roleId?._id || userData.roleId || null) : null)
                setOriginalEmail(userData.email || null)
            } else {
                if (data.status === 403) {
                    setPermissionError(data.message || "You don't have permission to update users")
                } else {
                    toast.error('Customer not found')
                    router.push('/admin/dashboard/customers')
                }
            }
        } catch (error) {
            console.error('Error fetching customer:', error)
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to update users")
            } else {
                toast.error('Error fetching customer details')
            }
        } finally {
            setLoading(false)
        }
    }

    const generateCaptcha = () => {
        const operations = [
            { question: '4 + 4 = ?', answer: 8 },
            { question: '3 - 2 = ?', answer: 1 },
            { question: '5 + 3 = ?', answer: 8 },
            { question: '7 - 1 = ?', answer: 6 },
            { question: '2 + 6 = ?', answer: 8 },
            { question: '9 - 4 = ?', answer: 5 },
            { question: '1 + 7 = ?', answer: 8 },
            { question: '6 - 3 = ?', answer: 3 },
            { question: '4 + 5 = ?', answer: 9 },
            { question: '8 - 2 = ?', answer: 6 }
        ]
        
        const randomOp = operations[Math.floor(Math.random() * operations.length)]
        setCaptchaQuestion(randomOp.question)
        setCaptchaAnswer(randomOp.answer.toString())
        setCaptchaInput('')
        setIsCaptchaCorrect(false)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }


    const handleCaptchaInput = (e) => {
        const value = e.target.value
        setCaptchaInput(value)
        setIsCaptchaCorrect(value === captchaAnswer)
    }

    const handleRoleConfirm = async () => {
        if (!hasRoleUpdatePermission) {
            toast.error("Permission Denied: You don't have permission to change user roles. Please contact your administrator to grant Role Management access.")
            return
        }
        if (isCaptchaCorrect) {
            setShowRoleConfirmModal(false)
            toast.success('Role change confirmed! Proceeding with update...')
            await performUpdate()
        } else {
            toast.error('Please enter the correct answer to confirm role change.')
        }
    }

    const handleRoleCancel = () => {
        setFormData(prev => ({ 
            ...prev, 
            roleId: originalRoleId
        }))
        setShowRoleConfirmModal(false)
        setCaptchaInput('')
        setIsCaptchaCorrect(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Check if user is editing their own profile
        const isSelfEdit = customerId === currentUser?._id
        const isCurrentUserSuperAdmin = roleDetails?.isSuperAdmin === true
        
        // Check if email is being changed
        const emailChanged = formData.email !== originalEmail
        
        // Prevent non-Super Admin from changing email
        if (emailChanged && !isCurrentUserSuperAdmin) {
            toast.error("Only Super Admin can change email addresses")
            return
        }
        
        // Check if roleId is being changed (only if user is staff)
        const isStaff = customer && customer.roleId && (customer.roleId._id || customer.roleId)
        const roleIdChanged = isStaff && formData.roleId !== originalRoleId
        
        // Prevent non-Super Admin from changing their own role
        if (roleIdChanged && isSelfEdit && !isCurrentUserSuperAdmin) {
            toast.error("You cannot update your own role. Only Super Admin can update their own role.")
            return
        }
        
        if (roleIdChanged) {
            // Role is being changed, show confirmation modal
            generateCaptcha()
            setShowRoleConfirmModal(true)
            return
        }
        
        // Same role, proceed with update
        await performUpdate()
    }

    const performUpdate = async () => {
        try {
            setSaving(true)
            const token = getCookie('token')
            
            const isSelfEdit = customerId === currentUser?._id
            const isCurrentUserSuperAdmin = roleDetails?.isSuperAdmin === true
            
            const payload = { ...formData }
            
            // Prevent email changes for non-Super Admin
            if (!isCurrentUserSuperAdmin) {
                payload.email = originalEmail
            }
            
            // Only include roleId in payload if user is staff
            const isStaff = customer && customer.roleId && (customer.roleId._id || customer.roleId)
            if (isStaff) {
                if (!hasRoleUpdatePermission) {
                    payload.roleId = originalRoleId
                } else if (isSelfEdit && !isCurrentUserSuperAdmin) {
                    // Prevent self-role update for non-Super Admin
                    payload.roleId = originalRoleId
                }
            } else {
                // If not staff, don't include roleId in payload
                delete payload.roleId
            }
            const data = await userAPI.updateUserById(customerId, payload, token)
            
            if (data.success) {
                toast.success('Customer updated successfully!')
                router.push(`/admin/dashboard/customers/${customerId}`)
            } else {
                if (data.status === 403) {
                    setPermissionError(data.message || "You don't have permission to update users")
                } else {
                    toast.error('Failed to update customer: ' + data.message)
                }
            }
        } catch (error) {
            console.error('Error updating customer:', error)
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to update users")
            } else {
                toast.error('Error updating customer')
            }
        } finally {
            setSaving(false)
        }
    }

    if (checkingPermission || contextLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!hasUpdatePermission || permissionError) {
        return (
            <PermissionDenied 
                title="Access Denied"
                message={permissionError || "You don't have permission to edit this customer"}
                action="Contact your administrator for access"
                showBackButton={true}
            />
        )
    }

    if (!customer) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
                <p className="text-gray-500 mb-4">The customer you're looking for doesn't exist.</p>
                <Link
                    href="/admin/dashboard/customers"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Customers
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={`/admin/dashboard/customers/${customerId}`}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
                            <p className="text-sm text-gray-500">Update customer information and settings</p>
                            
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    placeholder="Enter full name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                            </label>
                            {(() => {
                                const isCurrentUserSuperAdmin = roleDetails?.isSuperAdmin === true
                                const isEmailDisabled = !isCurrentUserSuperAdmin
                                
                                return (
                                    <>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={(e) => {
                                                    if (!isCurrentUserSuperAdmin) {
                                                        toast.error("Only Super Admin can change email addresses")
                                                        return
                                                    }
                                                    handleInputChange(e)
                                                }}
                                                className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isEmailDisabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
                                                required
                                                disabled={isEmailDisabled}
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        {isEmailDisabled && (
                                            <p className="mt-1 text-xs text-red-500">
                                                Only Super Admin can change email addresses
                                            </p>
                                        )}
                                    </>
                                )
                            })()}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Status *
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="banned">Banned</option>
                                <option value="deleted">Deleted</option>
                            </select>
                        </div>

                        {/* Role Assignment - Only show if user is staff */}
                        {customer && customer.roleId && (customer.roleId._id || customer.roleId) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Admin Role
                                </label>
                                {loadingRoles ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        Loading roles...
                                    </div>
                                ) : (() => {
                                    const isSelfEdit = customerId === currentUser?._id
                                    const isCurrentUserSuperAdmin = roleDetails?.isSuperAdmin === true
                                    const isDisabled = !hasRoleUpdatePermission || (isSelfEdit && !isCurrentUserSuperAdmin)
                                    
                                    return (
                                        <>
                                            <select
                                                name="roleId"
                                                value={formData.roleId || ''}
                                                onChange={(e) => {
                                                    if (!hasRoleUpdatePermission || (isSelfEdit && !isCurrentUserSuperAdmin)) {
                                                        if (!hasRoleUpdatePermission) {
                                                            toast.error("Permission Denied: You don't have permission to change user roles. Please contact your administrator to grant Role Management access.")
                                                        } else {
                                                            toast.error("Cannot Update Own Role: You cannot update your own role. Only Super Admin can update their own role.")
                                                        }
                                                        return
                                                    }
                                                    const roleId = e.target.value || null
                                                    setFormData({ ...formData, roleId })
                                                }}
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDisabled ? 'cursor-not-allowed' : ''}`}
                                                disabled={isDisabled}
                                            >
                                                <option value="">Customer (No Admin Role)</option>
                                                {roles
                                                    .filter(r => r.isActive)
                                                    .filter(r => {
                                                        // Only show Super Admin role if current user is Super Admin
                                                        if (r.isSuperAdmin) {
                                                            return roleDetails?.isSuperAdmin === true
                                                        }
                                                        return true
                                                    })
                                                    .map((role) => (
                                                        <option key={role._id} value={role._id}>
                                                            {role.name} {role.isSuperAdmin && '(Super Admin)'}
                                                        </option>
                                                    ))}
                                            </select>
                                            <p className={`mt-1 text-xs ${isDisabled ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                                {!hasRoleUpdatePermission 
                                                    ? (
                                                        <span className="flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3 inline" />
                                                            <span>You don't have permission to change user roles. Contact your administrator to grant <span className="font-semibold">Role Management</span> access.</span>
                                                        </span>
                                                    )
                                                    : isSelfEdit && !isCurrentUserSuperAdmin
                                                    ? (
                                                        <span className="flex items-center gap-1 text-amber-600">
                                                            <AlertCircle className="h-3 w-3 inline" />
                                                            <span>You cannot update your own role. Only Super Admin can update their own role.</span>
                                                        </span>
                                                    )
                                                    : "Update admin role for this staff member."
                                                }
                                            </p>
                                        </>
                                    )
                                })()}
                            </div>
                        )}

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Enter address"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-500">
                            Make sure all required fields are filled before updating the customer.
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link
                                href={`/admin/dashboard/customers/${customerId}`}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                <X className="h-4 w-4 mr-2 inline" />
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Loyalty Points Section */}
            {customer && (
                <LoyaltyPointsSection 
                    userId={customerId} 
                    customerName={customer.name} 
                />
            )}

            {/* Role Change Confirmation Modal */}
            {showRoleConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Confirm Role Change
                            </h3>
                            <button
                                onClick={handleRoleCancel}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex">
                                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                                    <div>
                                        <h4 className="text-sm font-medium text-yellow-800">
                                            Security Confirmation Required
                                        </h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            You are about to change this user's admin role. 
                                            {formData.roleId !== originalRoleId && (
                                                <> Role: {originalRoleId ? roles.find(r => r._id === originalRoleId)?.name || 'Role assigned' : 'Customer (No role)'} → {formData.roleId ? roles.find(r => r._id === formData.roleId)?.name || 'Role assigned' : 'Customer (No role)'}</>
                                            )}
                                            This action will grant admin panel access. Please confirm you want to proceed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Security Question: {captchaQuestion}
                                </label>
                                <input
                                    type="number"
                                    value={captchaInput}
                                    onChange={handleCaptchaInput}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter your answer"
                                    autoFocus
                                />
                                {captchaInput && !isCaptchaCorrect && (
                                    <p className="text-red-500 text-sm mt-1">Incorrect answer. Please try again.</p>
                                )}
                                {isCaptchaCorrect && (
                                    <p className="text-green-500 text-sm mt-1">✓ Correct answer!</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={handleRoleCancel}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRoleConfirm}
                                disabled={!isCaptchaCorrect}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Confirm Role Change
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
