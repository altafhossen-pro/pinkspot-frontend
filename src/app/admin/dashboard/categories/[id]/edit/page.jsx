'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import ImageUpload from '@/components/Common/ImageUpload'
import toast from 'react-hot-toast'
import { categoryAPI } from '@/services/api'

export default function EditCategoryPage() {
    const router = useRouter()
    const params = useParams()
    const categoryId = params.id
    
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [categories, setCategories] = useState([])
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        image: '',
        parent: '',
        isFeatured: false
    })

    useEffect(() => {
        fetchCategory()
        fetchCategories()
    }, [categoryId])

    const fetchCategory = async () => {
        try {
            setFetching(true)
            const data = await categoryAPI.getCategoryById(categoryId)
            
            if (data.success) {
                setFormData({
                    name: data.data.name,
                    slug: data.data.slug,
                    image: data.data.image || '',
                    parent: data.data.parent?._id || '',
                    isFeatured: data.data.isFeatured || false
                })
            } else {
                toast.error('Failed to fetch category: ' + data.message)
                router.push('/admin/dashboard/categories')
            }
        } catch (error) {
            console.error('Error fetching category:', error)
            toast.error('Error fetching category')
            router.push('/admin/dashboard/categories')
        } finally {
            setFetching(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const data = await categoryAPI.getCategories()
            if (data.success) {
                // Filter out the current category from parent options
                const filteredCategories = data.data.filter(cat => cat._id !== categoryId)
                setCategories(filteredCategories)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const generateSlug = () => {
        const slug = formData.name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-')
        setFormData(prev => ({ ...prev, slug }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data = await categoryAPI.updateCategory(categoryId, formData)

            if (data.success) {
                toast.success('Category updated successfully!')
                router.push('/admin/dashboard/categories')
            } else {
                toast.error('Failed to update category: ' + data.message)
            }
        } catch (error) {
            console.error('Error updating category:', error)
            toast.error('Error updating category')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                            href="/admin/dashboard/categories"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Categories
                        </Link>
                        <div className="border-l border-gray-300 pl-4">
                            <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Update category information and settings
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link
                            href="/admin/dashboard/categories"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                        >
                            View All Categories
                        </Link>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form id="edit-category-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Category Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                placeholder="Enter category name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slug
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="category-slug"
                                />
                                <button
                                    type="button"
                                    onClick={generateSlug}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Parent Category
                            </label>
                            <select
                                name="parent"
                                value={formData.parent}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">No Parent (Main Category)</option>
                                {categories.map(category => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <ImageUpload
                                onImageUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                                onImageRemove={() => setFormData(prev => ({ ...prev, image: '' }))}
                                currentImage={formData.image}
                                label="Category Image"
                            />
                        </div>
                    </div>

                    {/* Featured Category Checkbox */}
                    <div className="mt-6">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isFeatured"
                                name="isFeatured"
                                checked={formData.isFeatured}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                                <span className="font-medium">Featured Category</span>
                                <span className="text-gray-500 ml-1">- Show this category in landing page filter options</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-500">
                            Make sure all required fields are filled before updating the category.
                        </div>
                        <div className="flex items-center space-x-3">
                            <Link
                                href="/admin/dashboard/categories"
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? 'Updating...' : 'Update Category'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
