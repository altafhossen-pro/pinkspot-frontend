'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            // This would be implemented when backend supports password reset
            toast.info('Password reset functionality coming soon!')
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            toast.success('If an account exists with this email, you will receive a password reset link.')
            setEmail('')
        } catch (error) {
            console.error('Error:', error)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                            <span className="text-xl font-bold text-white">G</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Forgot your password?
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                    placeholder="Enter your email address"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    Send reset link
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="text-center mt-6">
                        <Link
                            href="/login"
                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center mx-auto group"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to sign in
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 mt-6">
                    <p>Remember your password? <Link href="/login" className="text-blue-600 hover:text-blue-500">Sign in here</Link></p>
                </div>
            </div>
        </div>
    )
}
