'use client';

import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(endDate) - new Date();
            
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    const formatNumber = (num) => {
        return num < 10 ? `0${num}` : num;
    };

    return (
        <div className="flex gap-2">
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-center">
                <span className="text-lg font-bold text-gray-900">
                    {formatNumber(timeLeft.days)}
                </span>
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-center">
                <span className="text-lg font-bold text-gray-900">
                    {formatNumber(timeLeft.hours)}
                </span>
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-center">
                <span className="text-lg font-bold text-gray-900">
                    {formatNumber(timeLeft.minutes)}
                </span>
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-center">
                <span className="text-lg font-bold text-gray-900">
                    {formatNumber(timeLeft.seconds)}
                </span>
            </div>
        </div>
    );
};

export default CountdownTimer;
