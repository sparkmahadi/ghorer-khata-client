import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useProductsAndCategories } from "../../contexts/ProductAndCategoryContext";
import { useNavigate } from "react-router"; // Using react-router as per your clarification

function AddConsumptionPlan() {
    const { userInfo, loading: authLoading } = useAuth();
    const userId = userInfo?._id;
    const { products, loading: productsLoading } = useProductsAndCategories();
    const navigate = useNavigate();

    // Form states
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [daily_quantity, setDailyQuantity] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");

    // UI states
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false); // For form submission
    const [searchTerm, setSearchTerm] = useState("");
    const [isProductModalOpen, setIsProductModalOpen] = useState(false); // State for the product selection modal

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    useEffect(() => {
        if (selectedProduct) {
            setDailyQuantity(""); // Clear quantity when a new product is selected
            setNotes(selectedProduct.notes || "");
        }
    }, [selectedProduct]);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const setCurrentMonthDates = () => {
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(formatDate(today));
        setEndDate(formatDate(lastDayOfMonth));
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setIsProductModalOpen(false); // Close modal after selection
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        if (!userId) {
            setError("User not authenticated. Please log in.");
            setLoading(false);
            return;
        }

        if (!selectedProduct) {
            setError("Please select a product first.");
            setLoading(false);
            return;
        }

        try {
            const newPlan = {
                product_id: selectedProduct.id,
                item_name: selectedProduct.item_name,
                userId,
                startDate,
                endDate,
                daily_quantity: parseFloat(daily_quantity),
                unit: selectedProduct.unit,
                notes: notes || "",
            };

            if (isNaN(newPlan.daily_quantity) || newPlan.daily_quantity <= 0) {
                throw new Error("Daily quantity must be a positive number.");
            }
            if (new Date(newPlan.startDate) >= new Date(newPlan.endDate)) {
                throw new Error("Start date must be before end date.");
            }

            const response = await fetch(`${API_BASE_URL}/api/consumptions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newPlan),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            setMessage("Consumption plan added successfully!");
            setSelectedProduct(null);
            setDailyQuantity("");
            setStartDate("");
            setEndDate("");
            setNotes("");
        } catch (err) {
            console.error("Failed to add plan:", err);
            setError(`Error: ${err.message || "Failed to add plan."}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(
        (product) =>
            product.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.subcategory?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || productsLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:p-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-8">
                    Add New Consumption Plan
                </h1>

                {/* Consumption Plan Form */}
                <div className="bg-blue-50 p-6 rounded-lg shadow-inner mb-8">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Product Selection Input */}
                        <div className="md:col-span-2">
                            <label htmlFor="product_select_input" className="block text-sm font-medium text-gray-700 mb-1">
                                Product to Plan: <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    id="product_select_input"
                                    value={selectedProduct ? selectedProduct.item_name : ""}
                                    placeholder="Click 'Select Product' to choose..."
                                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white cursor-pointer focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    readOnly
                                    onClick={() => setIsProductModalOpen(true)} // Open modal on click
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm"
                                >
                                    Select Product
                                </button>
                                {selectedProduct && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProduct(null)}
                                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm"
                                        title="Clear selected product"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                            {selectedProduct && (
                                <p className="mt-2 text-sm text-gray-600">
                                    <span className="font-medium">Selected:</span> {selectedProduct.item_name} (Unit: {selectedProduct.unit}, ID: {selectedProduct._id})
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="daily_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                                Daily Quantity: <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="daily_quantity"
                                value={daily_quantity}
                                onChange={(e) => setDailyQuantity(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                step="0.01"
                                min="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="unit_display" className="block text-sm font-medium text-gray-700 mb-1">
                                Unit (Auto-filled):
                            </label>
                            <input
                                type="text"
                                id="unit_display"
                                value={selectedProduct?.unit || ""}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                                readOnly
                            />
                        </div>

                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date: <span className="text-red-500">*</span>
                            </label>
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
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                                End Date: <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={setCurrentMonthDates}
                                className="w-full flex items-center justify-center py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-sm transition-colors"
                            >
                                <span className="mr-2">📅</span> Set Current Month Dates
                            </button>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                Notes:
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="3"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-y"
                            ></textarea>
                        </div>

                        <div className="md:col-span-2 text-center mt-4">
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center py-2.5 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || !selectedProduct}
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Adding...
                                    </>
                                ) : (
                                    "Add Plan"
                                )}
                            </button>
                        </div>

                        {message && (
                            <p className="mt-4 text-center text-green-600 font-semibold md:col-span-2">{message}</p>
                        )}
                        {error && (
                            <p className="mt-4 text-center text-red-600 font-semibold md:col-span-2">{error}</p>
                        )}
                    </form>
                </div>

                {/* Product Selection Modal */}
                {isProductModalOpen && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                            <button
                                onClick={() => setIsProductModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold"
                                title="Close"
                            >
                                &times;
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Select a Product</h2>

                            <div className="mb-6">
                                <input
                                    type="text"
                                    placeholder="Search products by name, category, or subcategory..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out"
                                />
                            </div>

                            {filteredProducts.length === 0 ? (
                                <div className="text-center text-gray-600 p-6 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-lg">No products found matching your search criteria.</p>
                                    <p className="text-sm mt-2">Try a different search term or add new products.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                                    <table className="min-w-full bg-white divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item Name</th>
                                                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                                                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit</th>
                                                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredProducts.map((product) => (
                                                <tr
                                                    key={product._id}
                                                    className={`hover:bg-gray-50 transition duration-150 ease-in-out ${
                                                        selectedProduct?._id === product._id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                                                    }`}
                                                >
                                                    <td className="py-3.5 px-5 font-medium text-gray-900">{product.item_name}</td>
                                                    <td className="py-3.5 px-5 text-gray-700">{product.category?.name || "N/A"}</td>
                                                    <td className="py-3.5 px-5 text-gray-700">{product.unit || ''}</td>
                                                    <td className="py-3.5 px-5">
                                                        <button
                                                            onClick={() => handleSelectProduct(product)}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-3 rounded-lg shadow-sm text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={selectedProduct?._id === product._id}
                                                        >
                                                            {selectedProduct?._id === product._id ? "Selected" : "Select This"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => navigate('/categories')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                                >
                                    Go to Product Management
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AddConsumptionPlan;