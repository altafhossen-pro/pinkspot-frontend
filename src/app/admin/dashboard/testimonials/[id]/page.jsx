'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { testimonialAPI } from '@/services/api'
import { getCookie } from 'cookies-next'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'

export default function TestimonialDetailsPage({ params }) {
    const resolvedParams = use(params)
    const { id: testimonialId } = resolvedParams
    const router = useRouter()
    const { hasPermission, contextLoading } = useAppContext()
    
    const [loading, setLoading] = useState(true)
    const [testimonial, setTestimonial] = useState(null)
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasReadPermission, setHasReadPermission] = useState(false)
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false)
    const [permissionError, setPermissionError] = useState(null)

    useEffect(() => {
        if (!testimonialId) return
        if (contextLoading) return
        const canRead = hasPermission('testimonial', 'read')
        const canUpdate = hasPermission('testimonial', 'update')
        setHasReadPermission(canRead)
        setHasUpdatePermission(!!canUpdate)
        setCheckingPermission(false)
        if (canRead) {
            fetchTestimonial()
        } else {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testimonialId, contextLoading])

    const fetchTestimonial = async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            const response = await testimonialAPI.getTestimonialById(testimonialId, token)
            
            if (response.success) {
                setTestimonial(response.data.testimonial)
            } else {
                if (response.status === 403) {
                    setPermissionError(response.message || "You don't have permission to read testimonials")
                } else {
                    toast.error('Failed to fetch testimonial: ' + response.message)
                    router.push('/admin/dashboard/testimonials')
                }
            }
        } catch (error) {
            console.error('Error fetching testimonial:', error)
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to read testimonials")
            } else {
                toast.error('Error fetching testimonial')
                router.push('/admin/dashboard/testimonials')
            }
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
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
                message={permissionError || "You don't have permission to view this testimonial"}
                action="Contact your administrator for access"
                showBackButton={true}
            />
        )
    }

    if (!testimonial) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Testimonial not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/dashboard/testimonials"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Testimonial Details</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View testimonial screenshot
                            </p>
                        </div>
                    </div>
                    {hasUpdatePermission && (
                        <Link
                            href={`/admin/dashboard/testimonials/${testimonialId}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Testimonial
                        </Link>
                    )}
                </div>
            </div>

            {/* Testimonial Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Screenshot Info */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ImageIcon className="h-5 w-5 mr-2" />
                            Testimonial Screenshot
                        </h2>
                        <div className="flex justify-center border border-gray-200 rounded-lg p-4 bg-gray-50">
                            {testimonial.image ? (
                                <img
                                    src={testimonial.image}
                                    alt="Testimonial screenshot"
                                    className="max-w-full h-auto object-contain max-h-[600px] rounded shadow-sm"
                                />
                            ) : (
                                <p className="text-gray-500 italic">No screenshot provided.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status & Settings */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Settings
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                    testimonial.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {testimonial.isActive ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Display Order
                                </label>
                                <p className="text-sm text-gray-600 mt-1">
                                    {testimonial.order}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Calendar className="h-5 w-5 mr-2" />
                            Timestamps
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Created
                                </label>
                                <p className="text-sm text-gray-600 mt-1">
                                    {formatDate(testimonial.createdAt)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Last Updated
                                </label>
                                <p className="text-sm text-gray-600 mt-1">
                                    {formatDate(testimonial.updatedAt)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Actions
                        </h3>
                        <div className="space-y-3">
                            {hasUpdatePermission && (
                                <Link
                                    href={`/admin/dashboard/testimonials/${testimonialId}/edit`}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Testimonial
                                </Link>
                            )}
                            <Link
                                href="/admin/dashboard/testimonials"
                                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                            >
                                Back to List
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
