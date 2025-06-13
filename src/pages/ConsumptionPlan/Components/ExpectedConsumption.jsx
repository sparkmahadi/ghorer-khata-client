import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import SelectProductForCon from './Reusable/SelectProductForCon';

function ExpectedConsumption({products}) {
    const { userInfo, loading: Authloading, } = useAuth();
    const userId = userInfo?._id;

    const [product_id, setProductId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [totalExpectedQuantity, setTotalExpectedQuantity] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleCalculateExpected = async () => {
        setTotalExpectedQuantity(null);
        setMessage('');
        setError('');
        setLoading(true);

        if (!userId) {
            setError("User not authenticated.");
            setLoading(false);
            return;
        }
        if (!product_id || !fromDate || !toDate) {
            setError("Please enter Product ID, From Date, and To Date.");
            setLoading(false);
            return;
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (start > end) {
            setError("From Date cannot be after To Date.");
            setLoading(false);
            return;
        }

        try {
            // Make API call to backend controller
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/consumptions/expected?product_id=${product_id}&userId=${userId}&fromDate=${fromDate}&toDate=${toDate}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            setTotalExpectedQuantity(data.totalExpectedQuantity.toFixed(2)); // Backend already calculates and provides as a number
            setMessage("Expected consumption calculated successfully!");

        } catch (err) {
            console.error("Failed to calculate expected consumption:", err);
            setError(`Error: ${err.message || "Failed to calculate expected consumption."}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-green-50 p-6 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">Calculate Expected Consumption</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <div className="md:col-span-2 text-center">
                    <button
                        onClick={handleCalculateExpected}
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        disabled={loading}
                    >
                        {loading ? 'Calculating...' : 'Calculate Expected'}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-600 mb-4">{error}</p>}
            {message && <p className="text-green-600 mb-4">{message}</p>}

            {totalExpectedQuantity !== null && (
                <div className="mt-4 bg-white p-4 rounded-md shadow-md">
                    <p><strong>Total Expected Quantity:</strong> <span className="text-lg font-semibold">{totalExpectedQuantity}</span></p>
                </div>
            )}

            <SelectProductForCon products={products} setProductId={setProductId}/>
        </div>
    );
}

export default ExpectedConsumption;