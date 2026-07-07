'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';

function GoogleAuthSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login } = useAppContext();
    const processedRef = useRef(false);

    useEffect(() => {
        // Prevent multiple executions
        if (processedRef.current) return;
        
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const role = searchParams.get('role');

        // Mark as processed immediately
        processedRef.current = true;

        if (token && userId && email) {
            // Create user object
            const user = {
                _id: userId,
                name: decodeURIComponent(name || ''),
                email: email,
                role: role || 'customer',
                emailVerified: true,
                registerType: 'google'
            };

            // Login user
            login(user, token);
            toast.success('Google login successful!');

            // Redirect based on role (use setTimeout to ensure state updates complete)
            setTimeout(() => {
                if (role === 'admin') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/');
                }
            }, 100);
        } else {
            // Handle error
            const error = searchParams.get('error');
            toast.error(error || 'Google authentication failed');
            setTimeout(() => {
                router.push('/login');
            }, 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run once on mount

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing Google login...</p>
            </div>
        </div>
    );
}

export default function GoogleAuthSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <GoogleAuthSuccessContent />
        </Suspense>
    );
}

