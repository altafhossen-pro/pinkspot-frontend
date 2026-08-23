'use client'

import React, { useState, useEffect } from 'react'
import { X, Share2, Copy, Check, Facebook, Linkedin, Instagram, Twitter, MessageCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductShareModal({ isOpen, onClose, url, productName = '' }) {
    const [copied, setCopied] = useState(false)
    const [fullUrl, setFullUrl] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const baseUrl = window.location.origin
            // If the url provided is already full, use it, else append
            const finalUrl = url?.startsWith('http') ? url : `${baseUrl}${url}`
            setFullUrl(finalUrl)
        }
    }, [url])

    if (!isOpen) return null

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

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: <MessageCircle className="w-5 h-5 text-white" />,
            bgColor: 'bg-[#25D366]',
            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${productName}: ${fullUrl}`)}`
        },
        {
            name: 'Messenger',
            icon: <MessageCircle className="w-5 h-5 text-white" fill="currentColor" />,
            bgColor: 'bg-[#0084FF]',
            url: `fb-messenger://share/?link=${encodeURIComponent(fullUrl)}` 
        },
        {
            name: 'LinkedIn',
            icon: <Linkedin className="w-5 h-5 text-white" />,
            bgColor: 'bg-[#0A66C2]',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`
        },
        {
            name: 'Facebook',
            icon: <Facebook className="w-5 h-5 text-white" />,
            bgColor: 'bg-[#1877F2]',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`
        },
        {
            name: 'Telegram',
            icon: <Send className="w-5 h-5 text-white -ml-0.5" />,
            bgColor: 'bg-[#0088cc]',
            url: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(productName)}`
        },
        {
            name: 'Twitter',
            icon: <Twitter className="w-5 h-5 text-white" />,
            bgColor: 'bg-[#1DA1F2]',
            url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(`Check out ${productName}`)}`
        }
    ]

    const handleShare = (shareUrl) => {
        window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div 
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-[420px] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center shrink-0">
                            <Share2 className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Share Product</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Spread the word about this product</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6">
                    {/* Link Section */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Product Link</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg bg-gray-50 px-4 py-2.5">
                                <p className="text-sm text-gray-600 truncate">{fullUrl}</p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors shrink-0 cursor-pointer"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Social Media Section */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-4">Share on Social Media</label>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-6">
                            {shareLinks.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => handleShare(link.url)}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${link.bgColor} cursor-pointer`}
                                    title={`Share on ${link.name}`}
                                >
                                    {link.icon}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex justify-center">
                            <button 
                                onClick={async () => {
                                    if (navigator.share) {
                                        try {
                                            await navigator.share({
                                                title: 'Share Product',
                                                text: productName,
                                                url: fullUrl
                                            });
                                        } catch (err) {
                                            console.error("Error sharing", err);
                                        }
                                    } else {
                                        handleCopy();
                                    }
                                }}
                                className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-full transition-colors cursor-pointer"
                            >
                                <span className="font-bold pb-1 tracking-wider">...</span>
                                More Options
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
