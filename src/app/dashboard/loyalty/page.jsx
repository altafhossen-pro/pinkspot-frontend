'use client'

import React, { useState, useEffect, useContext } from 'react'
import dynamic from 'next/dynamic'
import { Coins, TrendingUp, History, Gift, Star, Clock, CheckCircle, XCircle } from 'lucide-react'
import { getCookie } from 'cookies-next'
import { loyaltyAPI, settingsAPI } from '@/services/api'
import toast from 'react-hot-toast'
import AppContext from '@/context/AppContext'

const LoyaltyPageContent = () => {
    const { user } = useContext(AppContext)
    const [loyaltyData, setLoyaltyData] = useState(null)
    const [history, setHistory] = useState([])
    const [historyMeta, setHistoryMeta] = useState({ total: 0, showing: 0 })
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        if (user && user._id) {
            fetchLoyaltyData()
        }
    }, [user])

    const fetchLoyaltyData = async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            if (!token) {
                toast.error('Please login to view loyalty points')
                return
            }

            // Fetch loyalty data
            const loyaltyResponse = await loyaltyAPI.getLoyalty(user._id, token)
            if (loyaltyResponse.success) {
                setLoyaltyData(loyaltyResponse.data)
            }

            // Fetch loyalty history (limit to 10)
            const historyResponse = await loyaltyAPI.getLoyaltyHistory(user._id, token, 10)
            if (historyResponse.success) {
                setHistory(historyResponse.data)
                setHistoryMeta({
                    total: historyResponse.total || 0,
                    showing: historyResponse.showing || 0
                })
            }

            // Fetch settings for dynamic coin values
            const settingsResponse = await settingsAPI.getSettings()
            if (settingsResponse.success) {
                setSettings(settingsResponse.data)
            }
        } catch (error) {
            toast.error('Failed to load loyalty data')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'earn':
                return <TrendingUp className="h-5 w-5 text-green-600" />
            case 'redeem':
                return <Gift className="h-5 w-5 text-pink-600" />
            case 'topup':
                return <TrendingUp className="h-5 w-5 text-green-600" />
            case 'adjust':
                return <Star className="h-5 w-5 text-blue-600" />
            default:
                return <Coins className="h-5 w-5 text-gray-600" />
        }
    }

    const getTransactionColor = (type) => {
        switch (type) {
            case 'earn':
                return 'text-green-600 bg-green-50 border-green-200'
            case 'redeem':
                return 'text-pink-600 bg-pink-50 border-pink-200'
            case 'topup':
                return 'text-green-600 bg-green-50 border-green-200'
            case 'adjust':
                return 'text-blue-600 bg-blue-50 border-blue-200'
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const formatTransactionDescription = (description) => {
        if (!description) return 'No description available'
        
        // Replace underscores with spaces and capitalize
        let formatted = description.replace(/_/g, ' ')
        
        // Capitalize first letter of each word
        formatted = formatted.replace(/\b\w/g, l => l.toUpperCase())
        
        // Handle specific cases
        if (formatted.includes('Order Delivered Cod')) {
            formatted = formatted.replace('Order Delivered Cod', 'Order Delivered (COD)')
        }
        if (formatted.includes('Order Delivered Online')) {
            formatted = formatted.replace('Order Delivered Online', 'Order Delivered (Online)')
        }
        
        return formatted
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">Loading loyalty data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <Coins className="h-8 w-8 text-pink-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Loyalty Points</h1>
                    </div>
                    <p className="text-gray-600">Track your coins, value, and transaction history</p>
                </div>

                {/* Tabs */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'overview'
                                        ? 'border-pink-500 text-pink-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'history'
                                        ? 'border-pink-500 text-pink-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Transaction History
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Total Coins */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-pink-100 rounded-xl">
                                        <Coins className="h-6 w-6 text-pink-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Coins</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {loyaltyData?.coins || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Value */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Value</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            ৳{loyaltyData?.totalValue || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Coin Value */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Star className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Coin Value</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            ৳{loyaltyData?.coinValue || 1} per coin
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* How to Earn Coins */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Gift className="h-5 w-5 mr-2 text-pink-600" />
                                How to Earn Coins
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-green-800">Order Delivered (COD)</h4>
                                        <p className="text-sm text-green-600">
                                            Earn {settings?.coinPerItem || 1} coin{settings?.coinPerItem !== 1 ? 's' : ''} per item when your Cash on Delivery order is delivered
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-800">Payment Successful</h4>
                                        <p className="text-sm text-blue-600">
                                            Earn {settings?.coinPerItem || 1} coin{settings?.coinPerItem !== 1 ? 's' : ''} per item when your online payment is successful
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Admin Notice */}
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-yellow-800 font-medium">Notice:</p>
                                        <p className="text-xs text-yellow-700">
                                            Coin earning rates and values are subject to change. Admin can update or modify these values at any time.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Usage Info */}
                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Coins className="h-5 w-5 mr-2 text-pink-600" />
                                How to Use Coins
                            </h3>
                            <div className="flex items-start space-x-3">
                                <Gift className="h-5 w-5 text-pink-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-gray-800">Pay with Coins</h4>
                                    <p className="text-sm text-gray-600">
                                        Use your coins to pay for orders at checkout. If you have enough coins to cover the entire order, 
                                        you can pay with coins and save money!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <History className="h-5 w-5 mr-2 text-pink-600" />
                                Transaction History
                            </h3>
                        </div>
                        <div className="p-6">
                            {history.length === 0 ? (
                                <div className="text-center py-8">
                                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                                    <p className="text-gray-600">Your loyalty point transactions will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((transaction, index) => (
                                        <div key={index} className={`p-4 rounded-lg border ${getTransactionColor(transaction.type)}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    {getTransactionIcon(transaction.type)}
                                                    <div>
                                                        <h4 className="font-medium capitalize">
                                                            {transaction.type === 'earn' ? 'Coins Earned' : 
                                                             transaction.type === 'redeem' ? 'Coins Redeemed' : 
                                                             transaction.type === 'topup' ? 'Coins Top Up' :
                                                             'Coins Adjusted'}
                                                        </h4>
                                                        <p className="text-sm opacity-75">
                                                            {formatTransactionDescription(transaction.description)}
                                                        </p>
                                                        {transaction.order && (
                                                            <p className="text-xs opacity-60">
                                                                Order: #{transaction.order.orderId || transaction.order._id?.slice(-8)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-semibold ${
                                                        transaction.type === 'earn' ? 'text-green-600' : 
                                                        transaction.type === 'redeem' ? 'text-pink-600' : 
                                                        transaction.type === 'topup' ? 'text-green-600' :
                                                        'text-blue-600'
                                                    }`}>
                                                        {transaction.type === 'earn' ? '+' : 
                                                         transaction.type === 'redeem' ? '-' : 
                                                         transaction.type === 'topup' ? '+' :
                                                         '±'}{transaction.coins} coins
                                                    </p>
                                                    <p className="text-xs opacity-60">
                                                        {formatDate(transaction.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Show message if there are more transactions */}
                                    {historyMeta.total > historyMeta.showing && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <History className="h-4 w-4 text-blue-600" />
                                                <p className="text-sm text-blue-800">
                                                    Showing latest {historyMeta.showing} transactions. Total transactions: {historyMeta.total}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default dynamic(() => Promise.resolve(LoyaltyPageContent), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="h-12 w-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading loyalty page...</p>
            </div>
        </div>
    )
})
