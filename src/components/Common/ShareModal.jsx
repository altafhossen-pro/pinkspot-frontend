'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ShareModal({ isOpen, onClose, url, title = 'Share Link' }) {
    const [copied, setCopied] = useState(false)
    const [fullUrl, setFullUrl] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined' && url) {
            const baseUrl = window.location.origin
            setFullUrl(`${baseUrl}${url}`)
        }
    }, [url])

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(fullUrl)
            setCopied(true)
            toast.success('Link copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
            toast.error('Failed to copy link')
        }
    }

    if (!isOpen) return null

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl max-w-lg w-full transform transition-all overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 bg-white">
                    {/* URL Display */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product URL
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={fullUrl}
                                readOnly
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            />
                            <button
                                onClick={handleCopy}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors cursor-pointer ${
                                    copied
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-pink-600 hover:bg-pink-700'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Info text */}
                    <p className="text-xs text-gray-500">
                        Copy this link and share it with your customers.
                    </p>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-sm font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
