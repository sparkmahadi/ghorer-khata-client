import React, {  useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import SelectProductForCon from "./Components/Reusable/SelectProductForCon";
import { useProductsAndCategories } from "../../contexts/ProductAndCategoryContext";

function AddConsumptionPlan() {
    const { userInfo, loading: Authloading, } = useAuth();
    const userId = userInfo?._id;
    const {products} = useProductsAndCategories();
    const [product_id, setProductId] = useState('');
    const [item_name, setItem_name] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [daily_quantity, setDailyQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Day 0 of next month is last day of current

        setStartDate(formatDate(today)); // Start date is today
        setEndDate(formatDate(lastDayOfMonth)); // End date is last day of current month
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
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
                product_id,
                item_name,
                userId,
                startDate, // Send as ISO string for backend parsing
                endDate,   // Send as ISO string for backend parsing
                daily_quantity: parseFloat(daily_quantity),
                unit,
                notes: notes || "",
            };

            console.log(newPlan);

            if (isNaN(newPlan.daily_quantity) || newPlan.daily_quantity <= 0) {
                throw new Error("Daily quantity must be a positive number.");
            }
            if (new Date(newPlan.startDate) >= new Date(newPlan.endDate)) {
                throw new Error("Start date must be before end date.");
            }

            // Make API call to backend controller
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/consumptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Optionally include an auth token if your backend requires it
                    // 'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify(newPlan),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            setMessage("Consumption plan added successfully!");
            setProductId('');
            setStartDate('');
            setEndDate('');
            setDailyQuantity('');
            setUnit('');
            setNotes('');
        } catch (err) {
            console.error("Failed to add plan:", err);
            setError(`Error: ${err.message || "Failed to add plan."}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-blue-50 p-6 rounded-lg shadow-inner mx-auto">
            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Add New Consumption Plan</h2>
            <div className="flex justify-center">
                <div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">Product ID:</label>
                            <input
                                type="text"
                                id="product_id"
                                value={product_id}
                                onChange={(e) => setProductId(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="daily_quantity" className="block text-sm font-medium text-gray-700">Daily Quantity:</label>
                            <input
                                type="number"
                                id="daily_quantity"
                                value={daily_quantity}
                                onChange={(e) => setDailyQuantity(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                step="0.01"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit (e.g., kg, pcs):</label>
                            <input
                                type="text"
                                id="unit"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
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
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : 'Add Plan'}
                            </button>
                        </div>
                    </form>
                    {message && <p className="mt-4 text-center text-green-600">{message}</p>}
                    {error && <p className="mt-4 text-center text-red-600">{error}</p>}
                </div>


                {/* Products Component */}
                <div className='w-full lg:w-1/2 mt-8 lg:mt-0'>
                    <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-6">Select Product for Expense</h2>
                    <SelectProductForCon
                        products={products}
                        setProductId={setProductId}
                        setUnit={setUnit}
                        setNotes={setNotes}
                        setItem_name={setItem_name}
                    />
                </div>
            </div>
        </div>
    );
}

export default AddConsumptionPlan;