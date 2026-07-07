'use client'

import { useState, useEffect } from 'react'
import { 
    Star, 
    Plus, 
    History, 
    Coins, 
    AlertCircle,
    CheckCircle,
    X,
    Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getCookie } from 'cookies-next'

export default function LoyaltyPointsSection({ userId, customerName }) {
    const [loyaltyData, setLoyaltyData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    
    // Form states
    const [addForm, setAddForm] = useState({
        coins: '',
        notes: ''
    })
    const [inputError, setInputError] = useState('')

    useEffect(() => {
        if (userId) {
            fetchLoyaltyData()
        }
    }, [userId])

    const fetchLoyaltyData = async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/loyalty/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            
            const data = await response.json()
            
            if (data.success) {
                setLoyaltyData(data.data)
            } else {
                toast.error('Failed to fetch loyalty data')
            }
        } catch (error) {
            console.error('Error fetching loyalty data:', error)
            toast.error('Error fetching loyalty data')
        } finally {
            setLoading(false)
        }
    }

    const fetchLoyaltyHistory = async () => {
        try {
            setHistoryLoading(true)
            const token = getCookie('token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/loyalty/user/${userId}/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            
            const data = await response.json()
            
            if (data.success) {
                setHistory(data.data.history)
            } else {
                toast.error('Failed to fetch loyalty history')
            }
        } catch (error) {
            console.error('Error fetching loyalty history:', error)
            toast.error('Error fetching loyalty history')
        } finally {
            setHistoryLoading(false)
        }
    }

    const handleAddCoins = async (e) => {
        e.preventDefault()
        
        const coins = parseInt(addForm.coins)
        
        if (!addForm.coins || isNaN(coins) || coins <= 0) {
            toast.error('Please enter a valid positive number of coins')
            return
        }

        try {
            setActionLoading(true)
            const token = getCookie('token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/loyalty/add-coins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: userId,
                    coins: parseInt(addForm.coins),
                    notes: addForm.notes
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(`${addForm.coins} coins added successfully!`)
                setAddForm({ coins: '', notes: '' })
                setInputError('')
                setShowAddModal(false)
                fetchLoyaltyData() // Refresh data
            } else {
                toast.error(data.message || 'Failed to add coins')
            }
        } catch (error) {
            console.error('Error adding coins:', error)
            toast.error('Error adding coins')
        } finally {
            setActionLoading(false)
        }
    }


    const handleShowHistory = () => {
        setShowHistoryModal(true)
        fetchLoyaltyHistory()
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString()
    }

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'earn':
                return <Plus className="h-4 w-4 text-green-500" />
            case 'redeem':
                return <Coins className="h-4 w-4 text-orange-500" />
            case 'topup':
                return <Plus className="h-4 w-4 text-green-500" />
            case 'adjust':
                return <Star className="h-4 w-4 text-blue-500" />
            default:
                return <Coins className="h-4 w-4 text-gray-500" />
        }
    }

    const getTransactionColor = (type) => {
        switch (type) {
            case 'earn':
                return 'text-green-600'
            case 'redeem':
                return 'text-red-600'
            case 'topup':
                return 'text-green-600'
            case 'adjust':
                return 'text-blue-600'
            default:
                return 'text-gray-600'
        }
    }

    const getTransactionTypeLabel = (type) => {
        switch (type) {
            case 'earn':
                return 'Earned'
            case 'redeem':
                return 'Redeemed'
            case 'topup':
                return 'Top Up'
            case 'adjust':
                return 'Adjusted'
            default:
                return 'Transaction'
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                        <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Loyalty Points Management</h3>
                        <p className="text-sm text-gray-500">Manage {customerName}'s loyalty points</p>
                    </div>
                </div>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-pink-500 rounded-xl shadow-sm">
                            <Coins className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-pink-700 mb-1">Total Coins</p>
                            <p className="text-2xl font-bold text-pink-900">
                                {loyaltyData?.loyalty?.coins || 0}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-purple-500 rounded-xl shadow-sm">
                            <Star className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-purple-700 mb-1">Total Points</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {loyaltyData?.loyalty?.points || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 border border-rose-200 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-rose-500 rounded-xl shadow-sm">
                            <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-rose-700 mb-1">Account Status</p>
                            <p className="text-lg font-semibold text-rose-900">
                                {loyaltyData?.loyalty?.coins > 0 ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-6">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center space-x-3 px-5 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-300 font-semibold cursor-pointer shadow-lg hover:shadow-xl "
                >
                    <Plus className="h-5 w-5" />
                    <span>Add Coins</span>
                </button>
                
                <button
                    onClick={handleShowHistory}
                    className="flex items-center justify-center space-x-3 px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-semibold cursor-pointer shadow-lg hover:shadow-xl "
                >
                    <History className="h-5 w-5" />
                    <span>View History</span>
                </button>
            </div>

            {/* Add Coins Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-pink-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-pink-800">Add Coins</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddCoins} className="space-y-4">
                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    Number of Coins to Add *
                                </label>
                                <input
                                    type="text"
                                    value={addForm.coins}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Only allow digits and empty string
                                        if (value === '') {
                                            setAddForm(prev => ({ ...prev, coins: value }));
                                            setInputError('')
                                        } else if (/^\d+$/.test(value)) {
                                            // Only allow positive numbers (no leading zeros except for single digit)
                                            const numValue = parseInt(value);
                                            if (numValue > 0) {
                                                setAddForm(prev => ({ ...prev, coins: value }));
                                                setInputError('')
                                            } else {
                                                setInputError('Please enter a positive number')
                                            }
                                        }
                                        // If not digits, don't update the value (prevent invalid input)
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        inputError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter number of coins"
                                    required
                                />
                                {inputError && (
                                    <p className="text-red-500 text-sm mt-1">{inputError}</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={addForm.notes}
                                    onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Add a note for this transaction"
                                    rows={3}
                                />
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 transition-all duration-300 font-semibold cursor-pointer disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {actionLoading ? 'Adding...' : 'Add Coins'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-pink-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-pink-800">Transaction History</h3>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            {historyLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8">
                                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No transaction history found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((transaction, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0">
                                                {getTransactionIcon(transaction.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-medium text-gray-900">
                                                    {transaction.description}
                                                </p>
                                                <p className="text-base text-gray-500">
                                                    {getTransactionTypeLabel(transaction.type)} • {formatDate(transaction.date)}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className={`text-base font-semibold ${getTransactionColor(transaction.type)}`}>
                                                    {transaction.coins > 0 ? '+' : ''}{transaction.coins} coins
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
