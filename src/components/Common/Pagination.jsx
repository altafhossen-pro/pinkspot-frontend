import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    totalItems, 
    itemsPerPage,
    showInfo = true 
}) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages around current page
            let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let end = Math.min(totalPages, start + maxVisiblePages - 1);
            
            // Adjust start if end is at the limit
            if (end === totalPages) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            {/* Page Info */}
            {showInfo && (
                <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                </div>
            )}
            
            {/* Pagination Controls */}
            <div className="flex items-center space-x-1">
                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md transition-colors ${
                        currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                {pageNumbers.map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            page === currentPage
                                ? 'bg-pink-600 text-white'
                                : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                        }`}
                    >
                        {page}
                    </button>
                ))}

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md transition-colors ${
                        currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
