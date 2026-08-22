'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Share2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { productAPI, categoryAPI } from '@/services/api'
import { getCookie } from 'cookies-next'
import PermissionDenied from '@/components/Common/PermissionDenied'
import { useAppContext } from '@/context/AppContext'

// Import Tab Components
import BasicInfoTab from '../components/EditProductTabs/BasicInfoTab'
import ImagesMediaTab from '../components/EditProductTabs/ImagesMediaTab'
import JewelrySpecsTab from '../components/EditProductTabs/JewelrySpecsTab'
import VariantsTab from '../components/EditProductTabs/VariantsTab'
import SettingsTab from '../components/EditProductTabs/SettingsTab'

export default function CreateProductPage() {
    const router = useRouter()
    const { hasPermission, loading: contextLoading } = useAppContext()

    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [categories, setCategories] = useState([])

    // Active Tab State
    const [activeTab, setActiveTab] = useState('basic_info')

    const [formData, setFormData] = useState({
        title: '',
        customSubtitle: '',
        isGlobalSubtitleOn: true,
        shortDescription: '',
        description: '',
        category: '',
        brand: '',
        tags: [],
        status: 'draft',
        isActive: true,
        isFeatured: false,
        isBestselling: false,
        isNewArrival: false,
        // Jewelry specific properties
        isBracelet: false,
        isRing: false,
        braceletSizes: [],
        ringSizes: [],
        slug: '',
        featuredImage: '',
        gallery: [],
        specifications: [],
        productVideos: [],
        variants: [],
        announcementText: ''
    })

    const [customBraceletSize, setCustomBraceletSize] = useState('');
    const [customRingSize, setCustomRingSize] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [videoInput, setVideoInput] = useState({ platform: 'youtube', url: '' });
    const [skuSuggestion, setSkuSuggestion] = useState('');

    const [variantForm, setVariantForm] = useState({
        image: '',
        size: '',
        color: '',
        colorCode: '#000000',
        sku: '',
        oldPrice: '',
        currentPrice: '',
        stock: 0,
        sortOrder: 1
    })

    const [hasColorVariants, setHasColorVariants] = useState(true)

    const tabs = [
        { id: 'basic_info', label: 'Basic Info' },
        { id: 'images', label: 'Images & Media' },
        { id: 'jewelry_specs', label: 'Jewelry & Specs' },
        { id: 'variants', label: 'Variants' },
        { id: 'settings', label: 'Settings' }
    ];

    useEffect(() => {
        // Check permission first
        if (!contextLoading) {
            if (!hasPermission('product', 'create')) {
                setCheckingPermission(false)
            } else {
                setCheckingPermission(false)
                fetchCategories()
            }
        }
    }, [contextLoading, hasPermission])

    const fetchCategories = async () => {
        try {
            const data = await categoryAPI.getCategories()
            if (data.success) {
                setCategories(data.data)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const handleInputChange = async (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        // Auto-fetch SKU on category change
        if (name === 'category') {
            if (value) {
                try {
                    const token = getCookie('token')
                    const res = await productAPI.getNextSkuForCategory(value, token)
                    if (res.success && res.data && res.data.sku) {
                        setVariantForm(prev => {
                            if (!prev.sku) {
                                return { ...prev, sku: res.data.sku }
                            }
                            return prev
                        })
                        setSkuSuggestion(`Auto-filled next SKU. Previous highest was: ${res.data.previousMax || 0}`)
                    } else {
                        setSkuSuggestion('')
                    }
                } catch (error) {
                    console.error('Error fetching next SKU:', error)
                    setSkuSuggestion('')
                }
            } else {
                setSkuSuggestion('')
            }
        }
    }

    const addTag = () => {
        const trimmedTag = tagInput.trim()
        if (trimmedTag && !formData.tags.includes(trimmedTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, trimmedTag]
            }))
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const handleTagInputKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag()
        }
    }

    const addSpecification = () => {
        setFormData(prev => ({
            ...prev,
            specifications: [...prev.specifications, { key: '', value: '', group: '' }]
        }))
    }

    const removeSpecification = (index) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.filter((_, i) => i !== index)
        }))
    }

    const updateSpecification = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.map((spec, i) =>
                i === index ? { ...spec, [field]: value } : spec
            )
        }))
    }

    const addProductVideo = () => {
        const trimmedUrl = videoInput.url.trim()
        if (!trimmedUrl) {
            toast.error('Please enter a video URL')
            return
        }

        const platform = videoInput.platform.toLowerCase()
        let isValid = false
        let processedUrl = trimmedUrl

        switch (platform) {
            case 'youtube':
                if (trimmedUrl.includes('youtube.com/watch?v=') || trimmedUrl.includes('youtu.be/') || trimmedUrl.includes('youtube.com/shorts/')) {
                    isValid = true
                    let videoId = ''
                    if (trimmedUrl.includes('youtu.be/')) {
                        videoId = trimmedUrl.split('youtu.be/')[1].split('?')[0]
                    } else if (trimmedUrl.includes('youtube.com/shorts/')) {
                        videoId = trimmedUrl.split('youtube.com/shorts/')[1].split('?')[0]
                    } else {
                        videoId = trimmedUrl.split('watch?v=')[1].split('&')[0]
                    }
                    processedUrl = `https://www.youtube.com/embed/${videoId}`
                } else if (trimmedUrl.includes('youtube.com/embed/')) {
                    isValid = true
                    processedUrl = trimmedUrl
                }
                break
            case 'tiktok':
                if (trimmedUrl.includes('tiktok.com/') || trimmedUrl.includes('vm.tiktok.com/')) {
                    isValid = true
                    processedUrl = trimmedUrl
                }
                break
            case 'vimeo':
                if (trimmedUrl.includes('vimeo.com/')) {
                    isValid = true
                    const videoId = trimmedUrl.split('vimeo.com/')[1].split('?')[0]
                    processedUrl = `https://player.vimeo.com/video/${videoId}`
                } else if (trimmedUrl.includes('player.vimeo.com/video/')) {
                    isValid = true
                    processedUrl = trimmedUrl
                }
                break
            case 'facebook':
                if (trimmedUrl.includes('facebook.com/') || trimmedUrl.includes('fb.watch/')) {
                    isValid = true
                    processedUrl = trimmedUrl
                }
                break
            case 'instagram':
                if (trimmedUrl.includes('instagram.com/')) {
                    isValid = true
                    processedUrl = trimmedUrl
                }
                break
            default:
                isValid = true
        }

        if (!isValid) {
            toast.error(`Invalid ${videoInput.platform} URL format`)
            return
        }

        if (!formData.productVideos.includes(processedUrl)) {
            setFormData(prev => ({
                ...prev,
                productVideos: [...prev.productVideos, processedUrl]
            }))
            setVideoInput({ platform: 'youtube', url: '' })
            toast.success('Video URL added successfully')
        } else {
            toast.error('This video URL is already added')
        }
    }

    const removeProductVideo = (urlToRemove) => {
        setFormData(prev => ({
            ...prev,
            productVideos: prev.productVideos.filter(url => url !== urlToRemove)
        }))
    }

    const getVideoPlatformName = (url) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
        if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'TikTok'
        if (url.includes('vimeo.com')) return 'Vimeo'
        if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook'
        if (url.includes('instagram.com')) return 'Instagram'
        return 'Other'
    }

    const handleVariantInputChange = (e) => {
        const { name, value } = e.target
        setVariantForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const addVariant = () => {
        if (!variantForm.currentPrice) {
            toast.error('Please fill in current price')
            return
        }

        if (hasColorVariants && !variantForm.color) {
            toast.error('Please fill in color')
            return
        }

        const attributes = []

        if (variantForm.size && variantForm.size.trim()) {
            attributes.push({
                name: 'Size',
                value: variantForm.size.trim(),
                displayValue: variantForm.size.trim()
            })
        }

        if (hasColorVariants && variantForm.color && variantForm.color.trim()) {
            attributes.push({
                name: 'Color',
                value: variantForm.color.trim(),
                displayValue: variantForm.color.trim(),
                hexCode: variantForm.colorCode
            })
        }

        const generateUniqueSKU = () => {
            const timestamp = Date.now();
            return `SKU-${timestamp}`;
        }
        const sku = variantForm.sku || generateUniqueSKU()

        const newVariant = {
            sku,
            attributes,
            currentPrice: parseFloat(variantForm.currentPrice),
            originalPrice: variantForm.oldPrice ? parseFloat(variantForm.oldPrice) : null,
            stockQuantity: parseInt(variantForm.stock),
            images: variantForm.image ? [{ url: variantForm.image, isPrimary: true }] : [],
            isActive: true,
            sortOrder: parseInt(variantForm.sortOrder) || 1
        }

        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, newVariant]
        }))

        let nextSku = '';
        if (sku) {
            const match = sku.match(/(.*?)(\d+)$/);
            if (match) {
                const prefix = match[1];
                const numberStr = match[2];
                const nextNumber = (parseInt(numberStr, 10) + 1).toString();
                nextSku = prefix + nextNumber.padStart(numberStr.length, '0');
            }
        }

        setVariantForm({
            image: '',
            size: '',
            color: '',
            colorCode: '#000000',
            sku: nextSku,
            oldPrice: '',
            currentPrice: '',
            stock: 0,
            sortOrder: 1
        })
    }

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }))
    }

    const moveVariant = (index, direction) => {
        setFormData(prev => {
            const newVariants = [...prev.variants];
            if (direction === 'up' && index > 0) {
                [newVariants[index - 1], newVariants[index]] = [newVariants[index], newVariants[index - 1]];
            } else if (direction === 'down' && index < newVariants.length - 1) {
                [newVariants[index + 1], newVariants[index]] = [newVariants[index], newVariants[index + 1]];
            }
            return { ...prev, variants: newVariants };
        });
    }

    const updateVariant = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((variant, i) =>
                i === index ? { ...variant, [field]: value } : variant
            )
        }))
    }

    const updateVariantAttribute = (variantIndex, attributeIndex, field, value) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((variant, i) => {
                if (i === variantIndex) {
                    const updatedAttributes = [...variant.attributes]
                    updatedAttributes[attributeIndex] = {
                        ...updatedAttributes[attributeIndex],
                        [field]: value,
                        ...(field === 'value' ? { displayValue: value } : {})
                    }
                    return { ...variant, attributes: updatedAttributes }
                }
                return variant
            })
        }))
    }

    const handleManageStock = (variant, index) => {
        toast.info('Advanced stock management is available after creating the product.');
    }

    const generateSlug = () => {
        const slug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
        setFormData(prev => ({ ...prev, slug }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMessage(null)
        const token = getCookie('token')

        try {
            const data = await productAPI.createProduct(formData, token)

            if (data.success) {
                toast.success('Product created successfully!')
                router.push('/admin/dashboard/products')
            } else {
                setErrorMessage(data.message)
                toast.error('Failed to create product')
            }
        } catch (error) {
            console.error('Error creating product:', error)
            const msg = error.response?.data?.message || error.message || 'Error creating product'
            setErrorMessage(msg)
            toast.error('Error creating product')
        } finally {
            setLoading(false)
        }
    }

    if (checkingPermission || contextLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Checking permissions...</span>
                </div>
            </div>
        )
    }

    if (!hasPermission('product', 'create')) {
        return (
            <PermissionDenied
                title="Access Denied"
                message="You don't have permission to create products."
                action="Create Products"
            />
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-0 z-40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/dashboard/products"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Products
                        </Link>
                        <div className="border-l border-gray-300 pl-4">
                            <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Add a new product to your catalog
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="mt-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab(tab.id);
                                }}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer
                                    ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700 font-medium">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Form Content */}
            <form id="create-product-form" onSubmit={handleSubmit} className="space-y-6">

                {activeTab === 'basic_info' && (
                    <BasicInfoTab
                        formData={formData}
                        handleInputChange={handleInputChange}
                        categories={categories}
                        tagInput={tagInput}
                        setTagInput={setTagInput}
                        handleTagInputKeyPress={handleTagInputKeyPress}
                        addTag={addTag}
                        removeTag={removeTag}
                        generateSlug={generateSlug}
                    />
                )}

                {activeTab === 'images' && (
                    <ImagesMediaTab
                        formData={formData}
                        setFormData={setFormData}
                        videoInput={videoInput}
                        setVideoInput={setVideoInput}
                        addProductVideo={addProductVideo}
                        removeProductVideo={removeProductVideo}
                        getVideoPlatformName={getVideoPlatformName}
                    />
                )}

                {activeTab === 'jewelry_specs' && (
                    <JewelrySpecsTab
                        formData={formData}
                        setFormData={setFormData}
                        handleInputChange={handleInputChange}
                        customBraceletSize={customBraceletSize}
                        setCustomBraceletSize={setCustomBraceletSize}
                        customRingSize={customRingSize}
                        setCustomRingSize={setCustomRingSize}
                        addSpecification={addSpecification}
                        removeSpecification={removeSpecification}
                        updateSpecification={updateSpecification}
                    />
                )}

                {activeTab === 'variants' && (
                    <VariantsTab
                        formData={formData}
                        setFormData={setFormData}
                        variantForm={variantForm}
                        setVariantForm={setVariantForm}
                        skuSuggestion={skuSuggestion}
                        handleVariantInputChange={handleVariantInputChange}
                        hasColorVariants={hasColorVariants}
                        setHasColorVariants={setHasColorVariants}
                        addVariant={addVariant}
                        removeVariant={removeVariant}
                        updateVariant={updateVariant}
                        updateVariantAttribute={updateVariantAttribute}
                        onManageStock={handleManageStock}
                        moveVariant={moveVariant}
                    />
                )}

                {activeTab === 'settings' && (
                    <SettingsTab
                        formData={formData}
                        handleInputChange={handleInputChange}
                    />
                )}

            </form>
        </div>
    )
}
