'use client'

import { useState } from 'react'
import { 
    Mail, 
    Phone, 
    MapPin, 
    Clock, 
    Send,
    User,
    MessageSquare,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Youtube,
    Github
} from 'lucide-react'
import toast from 'react-hot-toast'
import Footer from '@/components/Footer/Footer'
import { siteConfig } from '@/config/siteConfig'
import { contactAPI } from '@/services/api'

export default function ContactUsPage() {
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    })

    // Dynamic social media data
    const socialLinks = [
        {
            name: 'Facebook',
            url: 'https://facebook.com/forpink',
            icon: Facebook,
            color: 'bg-blue-600',
            followers: '25.2K',
            description: 'Follow us for updates'
        },
        {
            name: 'Instagram',
            url: 'https://instagram.com/forpink',
            icon: Instagram,
            color: 'bg-pink-600',
            followers: '18.7K',
            description: 'See our latest products'
        },
        {
            name: 'Twitter',
            url: 'https://twitter.com/forpink',
            icon: Twitter,
            color: 'bg-blue-400',
            followers: '12.3K',
            description: 'Get news and updates'
        },
        {
            name: 'LinkedIn',
            url: 'https://linkedin.com/company/forpink',
            icon: Linkedin,
            color: 'bg-blue-700',
            followers: '8.9K',
            description: 'Connect professionally'
        },
        {
            name: 'YouTube',
            url: 'https://youtube.com/forpink',
            icon: Youtube,
            color: 'bg-red-600',
            followers: '15.6K',
            description: 'Watch our tutorials'
        },
        {
            name: 'GitHub',
            url: 'https://github.com/forpink',
            icon: Github,
            color: 'bg-gray-800',
            followers: '2.1K',
            description: 'View our code'
        }
    ]

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required'
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters'
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address'
            }
        }

        // Phone validation (optional but if provided, should be valid)
        if (formData.phone.trim()) {
            const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
            if (!phoneRegex.test(formData.phone.trim())) {
                newErrors.phone = 'Please enter a valid phone number'
            }
        }

        // Subject validation
        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required'
        } else if (formData.subject.trim().length < 3) {
            newErrors.subject = 'Subject must be at least 3 characters'
        }

        // Message validation
        if (!formData.message.trim()) {
            newErrors.message = 'Message is required'
        } else if (formData.message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters'
        } else if (formData.message.trim().length > 2000) {
            newErrors.message = 'Message must be less than 2000 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Validate form
        if (!validateForm()) {
            toast.error('Please fix the errors in the form')
            return
        }

        setLoading(true)

        try {
            const response = await contactAPI.submitContact({
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim() || undefined,
                subject: formData.subject.trim(),
                message: formData.message.trim()
            })
            
            if (response.success) {
                toast.success('Message sent successfully! We\'ll get back to you soon.')
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: ''
                })
                setErrors({})
            } else {
                toast.error(response.message || 'Failed to send message. Please try again.')
            }
        } catch (error) {
            console.error('Error submitting contact form:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send message. Please try again.'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            
            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Contact Form - Centered */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-12">
                    <h2 className="text-2xl text-center font-bold text-gray-900 mb-6">
                        Send us a message
                    </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                                errors.name 
                                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }`}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                                errors.email 
                                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            }`}
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                            errors.phone 
                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    className={`block w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                        errors.subject 
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                    placeholder="What is this about?"
                                />
                                {errors.subject && (
                                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    Message <span className="text-red-500">*</span>
                                    <span className="text-gray-400 text-xs font-normal ml-2">
                                        ({formData.message.length}/2000 characters)
                                    </span>
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3 left-4 flex items-start pointer-events-none">
                                        <MessageSquare className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={6}
                                        required
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        maxLength={2000}
                                        className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                                            errors.message 
                                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                        placeholder="Tell us more about your inquiry..."
                                    />
                                </div>
                                {errors.message && (
                                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                </div>

                {/* Contact Information - Below Form */}
                <div className="space-y-8">
                    {/* Contact Info Cards */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Mail className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                                        <p className="text-gray-600">{siteConfig.contact.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <Phone className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
                                        <p className="text-gray-600">{siteConfig.contact.phone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <MapPin className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                                        <p className="text-gray-600">
                                            {siteConfig.contact.address.split(', ').map((line, index, array) => (
                                                <span key={index}>
                                                    {line}
                                                    {index < array.length - 1 && <br />}
                                                </span>
                                            ))}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <Clock className="h-6 w-6 text-orange-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Business Hours</h3>
                                        {siteConfig.contact.hours.split(', ').map((hour, index) => (
                                            <p key={index} className="text-gray-600">{hour}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Follow Us on Social Media</h3>
                        <div className="flex justify-center items-center space-x-4">
                            {socialLinks.map((social, index) => {
                                const IconComponent = social.icon
                                return (
                                    <a
                                        key={index}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group"
                                    >
                                        <div className={`w-10 h-10 ${social.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                            <IconComponent className="h-5 w-5 text-white" />
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
