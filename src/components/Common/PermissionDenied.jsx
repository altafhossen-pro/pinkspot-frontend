'use client'

import { ShieldOff, AlertCircle, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PermissionDenied({ 
    title = "Access Denied",
    message = "You don't have permission to perform this action.",
    action = null, // Custom action (e.g., "Read Products")
    showBackButton = true,
    onBack = null
}) {
    const router = useRouter()

    const handleBack = () => {
        if (onBack) {
            onBack()
        } else {
            router.back()
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[400px] py-6 px-4">
            <div className="max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        
                        <div className="relative bg-red-100 rounded-full p-6">
                            <ShieldOff className="h-10 w-10 text-red-500" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {title}
                </h2>

                <div className="space-y-4 mb-6">
                    <p className="text-gray-600 leading-relaxed">
                        {message}
                    </p>

                    

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">What can you do?</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Contact your administrator to request access</li>
                                    <li>Check if your role has the required permissions</li>
                                    <li>Review your assigned permissions in the role settings</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {showBackButton && (
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-200"
                    >
                        Go Back
                    </button>
                )}
            </div>
        </div>
    )
}

