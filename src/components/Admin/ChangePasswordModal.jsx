import { useState } from 'react'
import { X, Key, RefreshCw, Eye, EyeOff, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { userAPI } from '@/services/api'
import { getCookie } from 'cookies-next'

export default function ChangePasswordModal({ isOpen, onClose, userId, userName }) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const generatePassword = () => {
        const length = 12
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
        let retVal = ""
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n))
        }
        setPassword(retVal)
        setShowPassword(true) // Show the generated password automatically so admin can copy it
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!password || password.length < 6) {
            toast.error('Password must be at least 6 characters long')
            return
        }

        try {
            setLoading(true)
            const token = getCookie('token')
            
            const payload = { password }
            const data = await userAPI.updateUserById(userId, payload, token)
            
            if (data.success) {
                toast.success('Password updated successfully!')
                onClose()
                setPassword('')
                setShowPassword(false)
            } else {
                toast.error(data.message || 'Failed to update password')
            }
        } catch (error) {
            console.error('Error updating password:', error)
            toast.error('Error updating password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Key className="h-5 w-5" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Change Password
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                            Set a new password for <span className="font-semibold text-gray-900">{userName || 'this user'}</span>.
                        </p>
                        
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-3 pr-24 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                placeholder="Enter new password"
                                minLength={6}
                                required
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={generatePassword}
                                    className="p-1.5 text-blue-600 hover:text-blue-700 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-1"
                                    title="Generate random password"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm hover:shadow"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
