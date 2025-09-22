import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useProductsAndCategories } from "../../contexts/ProductAndCategoryContext";
import { Loader } from "lucide-react";
import ProductSelectionModal from "../../components/Modals/ProductSelectionModal";

function AddConsumptionPlan() {
    const { userInfo, loading: authLoading } = useAuth();
    const userId = userInfo?._id;
    const { products, loading: productsLoading } = useProductsAndCategories();

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
                            <div className="lg:flex items-center space-x-2">
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
                                    <Loader />
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
                    <ProductSelectionModal
                        setIsProductModalOpen={setIsProductModalOpen}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filteredProducts={filteredProducts}
                        selectedProduct={selectedProduct}
                        handleSelectProduct={handleSelectProduct}
                    />
                )}
            </div>
        </div>
    );
}

export default AddConsumptionPlan;