import React, { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import SelectProductForCon from "./Reusable/SelectProductForCon";

function ActiveConPlans({products}) {
    const { userInfo, loading: Authloading, } = useAuth();
    const userId = userInfo?._id;

    const [product_id, setProductId] = useState('');
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const handleGetActivePlan = async () => {
        setPlan(null);
        setMessage('');
        setError('');
        setLoading(true);

        if (!userId) {
            setError("User not authenticated.");
            setLoading(false);
            return;
        }
        if (!product_id) {
            setError("Please enter Product ID, From Date, and To Date.");
            setLoading(false);
            return;
        }
        // if (!product_id || !fromDate || !toDate) {
        //     setError("Please enter Product ID, From Date, and To Date.");
        //     setLoading(false);
        //     return;
        // }

        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (start > end) {
            setError("From Date cannot be after To Date.");
            setLoading(false);
            return;
        }

        try {
            // Make API call to backend controller
            const response = await fetch(`${BASE_URL}/api/consumptions/active?product_id=${product_id}&userId=${userId}`);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    setMessage(data.message || "No active plan found for this product today.");
                    return;
                }
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            // Convert date strings from backend to readable format
            setPlan({
                ...data,
                startDate: new Date(data.startDate).toLocaleDateString(),
                endDate: new Date(data.endDate).toLocaleDateString(),
                createdAt: new Date(data.createdAt).toLocaleString()
            });
            setMessage("Active plan retrieved successfully!");
        } catch (err) {
            console.error("Failed to get active plan:", err);
            setError(`Error: ${err.message || "Failed to get active plan."}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-yellow-50 p-6 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-yellow-700 mb-4 text-center">Get Active Consumption Plan</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
                <div>
                    <label htmlFor="exp_product_id" className="block text-sm font-medium text-gray-700">Product ID:</label>
                    <input
                        type="text"
                        id="exp_product_id"
                        value={product_id}
                        onChange={(e) => setProductId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        required
                    />
                </div>
                <div></div> {/* Placeholder for layout */}
                <div>
                    <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">From Date:</label>
                    <input
                        type="date"
                        id="fromDate"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="toDate" className="block text-sm font-medium text-gray-700">To Date:</label>
                    <input
                        type="date"
                        id="toDate"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        required
                    />
                </div>
                <button
                    onClick={handleGetActivePlan}
                    className="px-6 py-2 rounded-md font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
                    disabled={loading}
                >
                    {loading ? 'Searching...' : 'Get Active Plan'}
                </button>
            </div>

            {error && <p className="text-red-600 mb-4">{error}</p>}
            {message && <p className="text-green-600 mb-4">{message}</p>}

            {plan && (
                <div className="bg-white p-4 rounded-md shadow-md">
                    <p><strong>Product ID:</strong> {plan.product_id}</p>
                    <p><strong>Daily Quantity:</strong> {plan.daily_quantity} {plan.unit}</p>
                    <p><strong>Period:</strong> {plan.startDate} - {plan.endDate}</p>
                    <p><strong>Notes:</strong> {plan.notes || 'N/A'}</p>
                </div>
            )}

            <SelectProductForCon products={products} setProductId={setProductId}/>
        </div>
    );
}

export default ActiveConPlans;