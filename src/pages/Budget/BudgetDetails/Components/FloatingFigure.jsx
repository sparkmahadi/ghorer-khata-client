import { useEffect, useState } from "react";
import React from "react";

export const FloatingFigure = ({ label, value, unit = '$', colorClass, previousValue }) => {
    const [animate, setAnimate] = useState(false);

    // Trigger animation when the value changes
    useEffect(() => {
        // Only animate if previousValue is defined and different from current value
        if (previousValue !== undefined && value !== previousValue) {
            setAnimate(true);
            // Reset animation state after a short delay
            const timer = setTimeout(() => {
                setAnimate(false);
            }, 600); // Animation duration
            return () => clearTimeout(timer); // Cleanup timeout
        }
    }, [value, previousValue]);
    return (
        <div className={`p-2 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center
                        transition-all duration-500 ease-in-out transform hover:scale-105 cursor-default
                        ${animate ? 'ring-4 ring-opacity-75 ring-blue-300 bg-blue-50' : 'bg-white'}`}>
            <p className="text-sm font-semibold text-gray-500 mb-2">{label}</p>
            <p className={`lg:text-xl font-extrabold ${colorClass || 'text-gray-900'} transition-colors duration-300`}>
                {unit}{value.toFixed(2)}
            </p>
        </div>
    );
};