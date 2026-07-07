'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    User,
    ArrowRight,
    ArrowLeft,
    MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'
import SocialLogin from '@/components/Authentication/SocialLogin'
import { useAppContext } from '@/context/AppContext'
import { otpAPI } from '@/services/api'

export default function RegisterPage() {
    const router = useRouter()
    const { login } = useAppContext()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [activeTab, setActiveTab] = useState('email') // 'email', 'social'
    
    // Step management for email registration
    const [currentStep, setCurrentStep] = useState(1) // 1: Email, 2: OTP, 3: User Info

    // Register form state
    const [registerForm, setRegisterForm] = useState({
        email: '',
        otp: '',
        name: '',
        password: '',
        confirmPassword: ''
    })
    
    const [otpSent, setOtpSent] = useState(false)
    const [emailError, setEmailError] = useState('')

    const handleRegisterChange = (e) => {
        const { name, value } = e.target
        setRegisterForm(prev => ({
            ...prev,
            [name]: value
        }))
        
        // Clear email error when user types
        if (name === 'email') {
            setEmailError('')
        }
    }

    // Helper function to convert seconds to minutes and seconds format
    const formatTimeRemaining = (seconds) => {
        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`
        }
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        
        if (remainingSeconds === 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`
        }
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`
    }

    // Helper function to extract seconds from message and convert to readable format
    const formatRateLimitMessage = (message) => {
        const secondsMatch = message.match(/wait (\d+) seconds?/i)
        if (secondsMatch) {
            const seconds = parseInt(secondsMatch[1])
            const formattedTime = formatTimeRemaining(seconds)
            return message.replace(/\d+ seconds?/i, formattedTime)
        }
        return message
    }

    // Validate email format
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // Step 1: Send OTP to email
    const handleSendRegisterOTP = async () => {
        if (!registerForm.email) {
            toast.error('Please enter your email address')
            return
        }

        if (!validateEmail(registerForm.email)) {
            setEmailError('Please enter a valid email address')
            return
        }

        setLoading(true)
        try {
            const data = await otpAPI.sendRegisterOTP(registerForm.email)
            
            if (data.success) {
                setOtpSent(true)
                setCurrentStep(2) // Move to OTP step
                toast.success('OTP sent to your email address')
            } else {
                const formattedMessage = formatRateLimitMessage(data.message || 'Failed to send OTP')
                toast.error(formattedMessage)
            }
        } catch (error) {
            console.error('Send OTP error:', error)
            
            let errorMessage = 'Failed to send OTP. Please try again.'
            
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage
            } else if (error.message) {
                errorMessage = error.message
            }
            
            const formattedMessage = formatRateLimitMessage(errorMessage)
            toast.error(formattedMessage)
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault()
        if (!registerForm.otp) {
            toast.error('Please enter OTP')
            return
        }

        setLoading(true)
        try {
            // Verify OTP via API (without creating account)
            const data = await otpAPI.verifyRegisterOTPOnly(
                registerForm.email,
                registerForm.otp
            )

            if (data.success) {
                setCurrentStep(3) // Move to final step
                toast.success('OTP verified! Please complete your registration')
            } else {
                toast.error(data.message || 'Invalid OTP. Please try again.')
            }
        } catch (error) {
            console.error('Verify OTP error:', error)
            
            let errorMessage = 'Invalid OTP. Please try again.'
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage
            } else if (error.message) {
                errorMessage = error.message
            }
            
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Complete registration
    const handleCompleteRegistration = async (e) => {
        e.preventDefault()
        setLoading(true)

        // Validate passwords match
        if (registerForm.password !== registerForm.confirmPassword) {
            toast.error('Passwords do not match')
            setLoading(false)
            return
        }

        // Validate password strength
        if (registerForm.password.length < 6) {
            toast.error('Password must be at least 6 characters long')
            setLoading(false)
            return
        }

        try {
            const data = await otpAPI.verifyRegisterOTP(
                registerForm.email,
                registerForm.otp,
                registerForm.name,
                registerForm.password,
            )

            if (data.success) {
                // Auto-login after successful registration
                if (data.data && data.data.user && data.data.token) {
                    login(data.data.user, data.data.token)
                    toast.success('Registration successful! Welcome!')
                    
                    // Redirect based on user role
                    if (data.data.user?.role === 'admin') {
                        router.push('/admin/dashboard')
                    } else {
                        router.push('/')
                    }
                } else {
                    toast.error('Registration completed but login failed. Please login manually.')
                    router.push('/login')
                }
            } else {
                toast.error(data.message || 'Registration failed')
            }
        } catch (error) {
            console.error('Registration error:', error)
            
            let errorMessage = 'Registration failed. Please try again.'
            
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage
            } else if (error.message) {
                errorMessage = error.message
            }
            
            toast.error(errorMessage)
            
            // If OTP is invalid/expired, go back to step 2
            if (errorMessage.includes('otp') || errorMessage.includes('OTP')) {
                setCurrentStep(2)
                setRegisterForm(prev => ({ ...prev, otp: '' }))
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSocialLogin = (provider) => {
        toast.info(`${provider} registration coming soon!`)
    }
    
    // Reset to step 1
    const handleChangeEmail = () => {
        setCurrentStep(1)
        setOtpSent(false)
        setRegisterForm(prev => ({ ...prev, email: '', otp: '' }))
        setEmailError('')
    }

    return (
        <div className="min-h-screen bg-gray-50  flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-300 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Please Register
                        </h1>
                        <p className="text-gray-600 mt-2">Choose your preferred registration method</p>
                    </div>

                    {/* Registration Method Tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'email'
                                    ? 'bg-white text-pink-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                        </button>
                        <button
                            onClick={() => setActiveTab('social')}
                            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'social'
                                    ? 'bg-white text-pink-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <User className="w-4 h-4 mr-2" />
                            Social
                        </button>
                    </div>
                    {/* Email Registration Form - 3 Steps */}
                    {activeTab === 'email' && (
                        <div className="space-y-5">
                            {/* Step Indicator */}
                            <div className="flex items-center justify-between mb-6">
                                <div className={`flex items-center ${currentStep >= 1 ? 'text-pink-600' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-pink-600 bg-pink-50' : 'border-gray-300'}`}>
                                        {currentStep > 1 ? (
                                            <span className="text-pink-600 font-bold">✓</span>
                                        ) : (
                                            <span className="font-bold">1</span>
                                        )}
                                    </div>
                                    <span className="ml-2 text-sm font-medium hidden sm:block">Email</span>
                                </div>
                                <div className={`flex-1 h-0.5 mx-2 ${currentStep >= 2 ? 'bg-pink-600' : 'bg-gray-300'}`}></div>
                                <div className={`flex items-center ${currentStep >= 2 ? 'text-pink-600' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-pink-600 bg-pink-50' : 'border-gray-300'}`}>
                                        {currentStep > 2 ? (
                                            <span className="text-pink-600 font-bold">✓</span>
                                        ) : (
                                            <span className="font-bold">2</span>
                                        )}
                                    </div>
                                    <span className="ml-2 text-sm font-medium hidden sm:block">OTP</span>
                                </div>
                                <div className={`flex-1 h-0.5 mx-2 ${currentStep >= 3 ? 'bg-pink-600' : 'bg-gray-300'}`}></div>
                                <div className={`flex items-center ${currentStep >= 3 ? 'text-pink-600' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-pink-600 bg-pink-50' : 'border-gray-300'}`}>
                                        <span className="font-bold">3</span>
                                    </div>
                                    <span className="ml-2 text-sm font-medium hidden sm:block">Details</span>
                                </div>
                            </div>

                            {/* Step 1: Enter Email */}
                            {currentStep === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
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
                                                value={registerForm.email}
                                                onChange={handleRegisterChange}
                                                className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                                                    emailError 
                                                        ? 'border-red-500 focus:border-red-500' 
                                                        : 'border-gray-400 focus:border-pink-500'
                                                }`}
                                                placeholder="Enter your email address"
                                            />
                                        </div>
                                        {emailError && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {emailError}
                                            </p>
                                        )}
                                        {!emailError && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                We'll send a verification code to this email
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSendRegisterOTP}
                                        disabled={loading || !registerForm.email || !validateEmail(registerForm.email)}
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                Send OTP
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Enter OTP */}
                            {currentStep === 2 && (
                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                            Enter OTP
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <MessageSquare className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="otp"
                                                name="otp"
                                                type="text"
                                                maxLength="6"
                                                required
                                                value={registerForm.otp}
                                                onChange={handleRegisterChange}
                                                className="block w-full pl-12 pr-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-gray-50 focus:bg-white text-center text-lg tracking-widest"
                                                placeholder="000000"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Enter the 6-digit code sent to {registerForm.email}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleVerifyOTP}
                                        disabled={loading || !registerForm.otp || registerForm.otp.length !== 6}
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                Verify OTP
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSendRegisterOTP}
                                            disabled={loading}
                                            className="flex-1 text-sm text-pink-600 hover:text-pink-700 font-medium disabled:opacity-50"
                                        >
                                            Resend OTP
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleChangeEmail}
                                            className="flex-1 text-sm text-pink-600 hover:text-pink-700 font-medium"
                                        >
                                            Change email
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Complete Registration */}
                            {currentStep === 3 && (
                                <form onSubmit={handleCompleteRegistration} className="space-y-5">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                autoComplete="name"
                                                required
                                                value={registerForm.name}
                                                onChange={handleRegisterChange}
                                                className="block w-full pl-12 pr-4 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                required
                                                value={registerForm.password}
                                                onChange={handleRegisterChange}
                                                className="block w-full pl-12 pr-12 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                                placeholder="Create a password"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                id="confirm-password"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                required
                                                value={registerForm.confirmPassword}
                                                onChange={handleRegisterChange}
                                                className="block w-full pl-12 pr-12 py-3 border border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                                placeholder="Confirm your password"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    

                                    <div className="flex items-center">
                                        <input
                                            id="terms"
                                            name="terms"
                                            type="checkbox"
                                            required
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                                            I agree to the{' '}
                                            <Link href="/terms-and-conditions" className="text-pink-600 hover:text-pink-500">
                                                Terms of Service
                                            </Link>{' '}
                                            and{' '}
                                            <Link href="/privacy-policy" className="text-pink-600 hover:text-pink-500">
                                                Privacy Policy
                                            </Link>
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                Create Account
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Social Registration */}
                    {activeTab === 'social' && (
                        <div className="space-y-5">
                            <div className="text-center">
                                <p className="text-gray-600 mb-4">Sign up with your social account</p>
                            </div>
                            <SocialLogin onSocialLogin={handleSocialLogin} />
                        </div>
                    )}

                    {/* Login Link */}
                    <div className="text-center mt-6">
                        <Link
                            href="/login"
                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center mx-auto group"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Already have an account? <span className="text-pink-600 hover:text-pink-700 font-medium ms-2">Sign in</span>
                        </Link>
                    </div>



                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 mt-6">
                    <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
            </div>
        </div>
    )
}
