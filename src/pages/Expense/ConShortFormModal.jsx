import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const ConShortFormModal = ({
    isOpen, // Prop to control modal visibility
    onClose, // Prop to close the modal
    itemName,
    initialProductId = '', // Use initialProductId for better reusability
    initialUnit = '', // Use initialUnit for better reusability
    onSuccess // Callback for successful submission
}) => {
    const { userInfo, loading: authLoading } = useAuth();
    const userId = userInfo?._id;

    const [productId, setProductId] = useState(initialProductId);
    const [unit, setUnit] = useState(initialUnit);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dailyQuantity, setDailyQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset form fields when modal opens or initialProductId/initialUnit change
    useEffect(() => {
        setProductId(initialProductId);
        setUnit(initialUnit);
        setStartDate('');
        setEndDate('');
        setDailyQuantity('');
        setNotes('');
        setMessage('');
        setError('');
    }, [isOpen, initialProductId, initialUnit]);

    // If the modal isn't open, don't render anything
    if (!isOpen) return null;

    // Helper function to format date to YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Function to set current month's start and end dates
    const setCurrentMonthDates = () => {
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        setStartDate(formatDate(today));
        setEndDate(formatDate(lastDayOfMonth));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setMessage('');
        setError('');
        setLoading(true);

        if (!userId) {
            setError("User not authenticated.");
            setLoading(false);
            return;
        }

        try {
            const newPlan = {
                product_id: productId,
                item_name: itemName,
                userId,
                startDate,
                endDate,
                daily_quantity: parseFloat(dailyQuantity),
                unit,
                notes: notes || "",
            };

            if (isNaN(newPlan.daily_quantity) || newPlan.daily_quantity <= 0) {
                throw new Error("Daily quantity must be a positive number.");
            }
            if (new Date(newPlan.startDate) >= new Date(newPlan.endDate)) {
                throw new Error("Start date must be before end date.");
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/consumptions`,
                newPlan,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Authorization': `Bearer ${userToken}` // Uncomment if you have an auth token
                    },
                }
            );

            setMessage("Consumption plan added successfully!");
            if (onSuccess) {
                onSuccess(response.data);
            }
            onClose(); // Close modal on success

        } catch (err) {
            console.error("Failed to add plan:", err);
            setError(`Error: ${err.response?.data?.error || err.response?.data?.message || err.message || "Failed to add plan."}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
                onClick={onClose} // Close modal when clicking outside
            ></div>

            {/* Modal Content */}
            <div className="relative w-auto max-w-3xl mx-auto my-6">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t">
                        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                            Add Consumption Plan For {itemName}
                        </h3>
                        <button
                            className="p-1 ml-auto bg-transparent border-0 text-gray-600 opacity-70 hover:opacity-100 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="text-gray-600 h-6 w-6 text-2xl block outline-none focus:outline-none">
                                ×
                            </span>
                        </button>
                    </div>

                    {/* Body - Form */}
                    <div className="relative p-6 flex-auto">
                        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">Product ID:</label>
                                    <input
                                        type="text"
                                        id="product_id"
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <label htmlFor="daily_quantity" className="block text-sm font-medium text-gray-700">Daily Quantity:</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            id="daily_quantity"
                                            value={dailyQuantity}
                                            onChange={(e) => setDailyQuantity(e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            step="0.01"
                                            required
                                        />
                                        {unit && (
                                            <span className="bg-gray-200 text-gray-700 px-3 py-2 border border-gray-300 border-l-0 rounded-r-lg font-medium text-sm">
                                                {unit}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date:</label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date:</label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={setCurrentMonthDates}
                                    className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-sm flex items-center justify-center"
                                >
                                    This Month
                                </button>
                                <div className="md:col-span-2">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes:</label>
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows="3"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    ></textarea>
                                </div>
                                <div className="md:col-span-2 text-center">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                        disabled={loading || authLoading}
                                    >
                                        {loading ? 'Adding...' : 'Add Plan'}
                                    </button>
                                </div>
                            </div>
                        </form>
                        {message && <p className="mt-4 text-center text-green-600">{message}</p>}
                        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConShortFormModal;