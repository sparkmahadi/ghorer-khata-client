import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useParams } from 'react-router'; // Use react-router-dom for useParams
import { useAuth } from '../../contexts/AuthContext';
import { useProductsAndCategories } from '../../contexts/ProductAndCategoryContext';
import ConShortFormModal from './ConShortFormModal'; // Assuming this is your refactored single modal component
import { createTransaction } from '../../api/transactionService';
import { addBudgetItem, fetchBudgetById, updateBudgetFromTransactionAPI } from '../../api/budgetService';
import ProductSelectionModal from '../../components/Modals/ProductSelectionModal';
import IncludeProductModal from '../Budget/BudgetDetails/Components/IncludeProductModal';

function AddTransactionForm() {
    // --- Authentication & Context Hooks ---
    const { userInfo, loading: authLoading, isAuthenticated } = useAuth();
    const { products, categories } = useProductsAndCategories();
    const { budgetId } = useParams();

    // --- Form State ---
    const [budget, setBudget] = useState({});
    const [itemName, setItemName] = useState('');
    const [product_id, setProductId] = useState('');
    const [amount, setAmount] = useState(0);
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const [unit, setUnit] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- Product Selection & Search State ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // --- Budget Item Allocation State (for IncludeProductModal) ---
    const [isBudgetItemAllocationModalOpen, setIsBudgetItemAllocationModalOpen] = useState(false);
    const [allocatedQuantity, setAllocatedQuantity] = useState('');
    const [manualAllocatedAmount, setManualAllocatedAmount] = useState('');
    const [isManualAllocation, setIsManualAllocation] = useState(false);
    const [budgetItemNotes, setBudgetItemNotes] = useState('');
    const [editingBudgetItem, setEditingBudgetItem] = useState(null); // Used if you were editing an existing budget item

    // --- Confirmation & Consumption Modal State ---
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [confirmationDetails, setConfirmationDetails] = useState(null);
    const [isConShortFormModalOpen, setIsConShortFormModalOpen] = useState(false);

    // --- Effects ---

    // Effect to adjust subcategory if parent category changes or becomes invalid
    useEffect(() => {
        const currentCategory = categories?.find(cat => cat.id === selectedCategoryId);
        if (!currentCategory || (currentCategory.subcategories && !currentCategory.subcategories.some(sub => sub.id === selectedSubcategoryId))) {
            setSelectedSubcategoryId('');
        }
    }, [selectedCategoryId, categories, selectedSubcategoryId]);

    // Effect to calculate amount based on price and quantity
    useEffect(() => {
        if (price && quantity) {
            setAmount(parseFloat((price * quantity).toFixed(2)));
        } else {
            setAmount(0); // Reset amount if price or quantity are invalid
        }
    }, [price, quantity]);

    // Effect to fetch budget details
    useEffect(() => {
        if (budgetId) {
            fetchBudgetDetails(budgetId);
        }
    }, [budgetId]); // Dependency on budgetId ensures it refetches if ID changes

    // --- API Call Functions ---

    // Fetches budget details
    const fetchBudgetDetails = async (id) => {
        try {
            const fetchedBudget = await fetchBudgetById(id);
            if (fetchedBudget) {
                setBudget(fetchedBudget);
            } else {
                toast.error("Budget not found.");
            }
        } catch (err) {
            console.error("Error fetching budget:", err);
            toast.error("Failed to load budget details.");
        }
    };

    // --- Handlers for Form Fields and Modals ---

    // Handles category selection
    const handleCategoryChange = useCallback((e) => {
        setSelectedCategoryId(e.target.value);
        setSelectedSubcategoryId(''); // Reset subcategory when category changes
    }, []);

    // Handles product selection from ProductSelectionModal
    const handleSelectProduct = useCallback((product) => {
        setSelectedProduct(product);
        setProductId(product.id);
        setItemName(product.item_name);
        setPrice(product.price || 0); // Default to 0 if price is undefined
        setUnit(product.unit || '');
        setSelectedCategoryId(product.category_id || '');
        setSelectedSubcategoryId(product.subcategory_id || '');
        setQuantity(1); // Default quantity
        setIsProductSelectionModalOpen(false); // Close modal after selection
    }, []);

    // Opens the product selection modal
    const openProductSelectionModal = useCallback(() => {
        setIsProductSelectionModalOpen(true);
    }, []);

    // Opens the consumption short form modal
    const openConShortFormModal = useCallback(() => {
        setIsConShortFormModalOpen(true);
    }, []);

    // Closes the consumption short form modal
    const handleCloseConShortFormModal = useCallback(() => {
        setIsConShortFormModalOpen(false);
    }, []);

    // Callback for successful consumption plan submission
    const handleConsumptionPlanSuccess = useCallback((data) => {
        console.log("Consumption plan added successfully:", data);
        toast.success("Consumption plan saved!");
        // ConShortForm will close itself via its onClose prop
    }, []);

    // Handles adding a product to the budget (from IncludeProductModal)
    const handleAddProductToBudget = async (e, itemData) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!selectedProduct) {
            toast.error('No product selected for allocation.');
            setLoading(false);
            return;
        }

        const payload = { ...itemData };
        if (budgetItemNotes.trim()) {
            payload.notes = budgetItemNotes.trim();
        }

        try {
            await addBudgetItem(budgetId, payload);
            toast.success('Product successfully allocated to budget!');
            setIsBudgetItemAllocationModalOpen(false); // Close modal
            // Optionally refetch budget details to update UI
            fetchBudgetDetails(budgetId);
        } catch (err) {
            console.error(`Error adding product to budget:`, err);
            setError(err.message);
            toast.error(`Failed to allocate product: ${err.message}`);
        } finally {
            setLoading(false);
            // Reset relevant states
            setAllocatedQuantity('');
            setManualAllocatedAmount('');
            setBudgetItemNotes('');
            setIsManualAllocation(false);
            setEditingBudgetItem(null);
        }
    };

    // --- Main Transaction Submission Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const currentCategory = categories?.find(cat => cat.id === selectedCategoryId);
        if (!currentCategory) {
            setError('Please select a valid category.');
            setLoading(false);
            return;
        }

        const selectedSubcategory = currentCategory.subcategories?.find(subcat => subcat.id === selectedSubcategoryId);

        const transactionPayload = {
            budgetId,
            userId: userInfo._id,
            username: userInfo.name,
            product_id,
            itemName,
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            unit,
            amount: parseFloat(amount),
            transactionDate: new Date(transactionDate).toISOString(),
            categoryId: selectedCategoryId,
            subcategoryId: selectedSubcategory ? selectedSubcategory.id : undefined,
            notes,
            transactionType: 'expense'
        };

        const itemExistsInBudget = budget.budgetItems?.some(item => item.product_id === selectedProduct?.id);

        if (!itemExistsInBudget) {
            const confirmAllocation = window.confirm("The product is not allocated with the selected budget. Do you want to allocate it first?");
            if (confirmAllocation) {
                if (selectedProduct?.id) {
                    setIsBudgetItemAllocationModalOpen(true); // Open allocation modal
                } else {
                    toast.error("Selected product details are incomplete for allocation.");
                }
            } else {
                toast.info("Transaction cannot be linked without product allocation in selected budget. Please allocate the product first or cancel.");
            }
            setLoading(false);
            return; // Stop here, wait for allocation
        }

        // If item exists in budget, or if allocation was handled, proceed to confirmation modal
        setConfirmationDetails({
            ...transactionPayload,
            budgetName: budget.name, // Pass budget name for confirmation modal clarity
            action: itemExistsInBudget ? 'update' : 'add', // Indicate if it's an update or new allocation
            budgetId: budgetId, // Pass budgetId for final execution
        });
        setIsConfirmationModalOpen(true); // Open confirmation modal
        setLoading(false); // Stop loading, as confirmation modal is now open
    };

    // --- Final Execution after User Confirmation ---
    const confirmAndExecuteTransaction = async () => {
        setIsConfirmationModalOpen(false); // Close confirmation modal immediately
        setLoading(true); // Re-engage loading state for actual API calls

        try {
            // 1. Create the transaction record
            await createTransaction(confirmationDetails, budgetId);
            toast.success('Transaction added successfully!');

            // 2. Offer to update the budget (this was a separate confirm, now part of unified flow)
            const confirmBudgetUpdate = window.confirm("Do you want to update your budget with this transaction?");
            if (confirmBudgetUpdate) {
                const budgetUpdatePayload = {
                    product_id: confirmationDetails.product_id,
                    quantity: confirmationDetails.quantity,
                    price: confirmationDetails.price,
                    amount: confirmationDetails.amount,
                    transactionDate: confirmationDetails.transactionDate,
                    categoryId: confirmationDetails.categoryId,
                    subcategoryId: confirmationDetails.subcategoryId,
                };
                await updateBudgetFromTransactionAPI(budgetId, budgetUpdatePayload);
                toast.success('Budget updated successfully!');
            }

            // Clear all form fields after successful submission
            resetForm();

        } catch (err) {
            console.error("Transaction/Budget update failed:", err);
            const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred.';
            setError(`Error: ${errorMessage}`);
            toast.error(`Operation failed: ${errorMessage}`);
        } finally {
            setLoading(false);
            setConfirmationDetails(null); // Clear confirmation details
        }
    };

    // --- Utility Functions ---

    // Resets all form fields
    const resetForm = useCallback(() => {
        setItemName('');
        setProductId('');
        setAmount(0);
        setPrice(0);
        setQuantity(0);
        setUnit('');
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setSelectedCategoryId('');
        setSelectedSubcategoryId('');
        setNotes('');
        setError(null);
        setSelectedProduct(null);
        setConfirmationDetails(null);
    }, []);

    // Filters subcategories based on selected category
    const getFilteredSubcategories = useCallback((categoryId) => {
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        return selectedCategory ? selectedCategory.subcategories || [] : [];
    }, [categories]);

    // Derived state for subcategories
    const subcategories = getFilteredSubcategories(selectedCategoryId);

    // Filtered products for ProductSelectionModal
    const filteredProducts = products.filter(
        (product) =>
            product.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.subcategory?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Render Logic (Auth & Loading) ---
    if (authLoading) {
        return <div className="flex justify-center items-center h-screen text-lg text-gray-700">Loading authentication information...</div>;
    }
    if (!isAuthenticated) {
        return <div className="flex justify-center items-center h-screen text-lg text-red-600">Please log in to add transactions.</div>;
    }

    return (
        <div className='flex flex-col lg:flex-row justify-center items-start lg:space-x-8 p-4 bg-gray-50 min-h-screen'>
            {/* Transaction Form */}
            <div className='w-full lg:w-1/2 max-w-md mx-auto lg:mx-0 bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 lg:mb-0'>
                <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-6">Add New Transaction</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && <p className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded-md border border-red-200">{error}</p>}

                    <div className="flex items-center space-x-2 mb-4">
                        <button
                            type="button"
                            onClick={openProductSelectionModal}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm"
                        >
                            Select Product
                        </button>

                        {/* Button to open ConShortForm Modal */}
                        {selectedProduct && (
                            <button
                                type="button"
                                onClick={openConShortFormModal}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm"
                            >
                                Add Consumption Plan
                            </button>
                        )}
                    </div>

                    {selectedProduct && (
                        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Selected:</span> {selectedProduct.item_name} (Unit: {selectedProduct.unit}, ID: {selectedProduct._id})
                            </p>
                            <button
                                type="button"
                                onClick={() => setSelectedProduct(null)}
                                className="ml-2 p-1 text-gray-500 hover:text-red-600 text-xl leading-none font-bold transition-colors"
                                title="Clear selected product"
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price:</label>
                            <input
                                type="number"
                                id="price"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="relative">
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity:</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    id="quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    step="any"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out"
                                    placeholder="0"
                                />
                                {unit && (
                                    <span className="bg-gray-200 text-gray-700 px-3 py-2 border border-gray-300 border-l-0 rounded-r-lg font-medium text-sm">
                                        {unit}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Total Amount:</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value))} // Ensure parsed as float
                            required
                            step="0.01"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="relative">
                        <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                        <input
                            type="date"
                            id="transactionDate"
                            value={transactionDate}
                            onChange={(e) => setTransactionDate(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out"
                        />
                    </div>

                    <div className="relative">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category:</label>
                        <select
                            id="category"
                            value={selectedCategoryId}
                            onChange={handleCategoryChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out appearance-none bg-white pr-8"
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-6">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>

                    {selectedCategoryId && subcategories.length > 0 && (
                        <div className="relative">
                            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">Subcategory:</label>
                            <select
                                id="subcategory"
                                value={selectedSubcategoryId}
                                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out appearance-none bg-white pr-8"
                            >
                                <option value="">-- Select Subcategory (Optional) --</option>
                                {subcategories.map(subcat => (
                                    <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-6">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes:</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out"
                            placeholder="Add any relevant notes here..."
                        ></textarea>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="submit"
                            disabled={loading || !selectedProduct}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            {loading ? 'Adding...' : 'Add Transaction'}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={resetForm}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            {/* --- Modals --- */}
            {isConShortFormModalOpen && selectedProduct && (
                <ConShortFormModal
                    isOpen={isConShortFormModalOpen}
                    onClose={handleCloseConShortFormModal}
                    itemName={itemName}
                    initialProductId={product_id}
                    initialUnit={unit}
                    onSuccess={handleConsumptionPlanSuccess}
                />
            )}

            {isProductSelectionModalOpen && (
                <ProductSelectionModal
                    setIsProductModalOpen={setIsProductSelectionModalOpen} // Prop for closing
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filteredProducts={filteredProducts}
                    selectedProduct={selectedProduct}
                    handleSelectProduct={handleSelectProduct}
                />
            )}

            {isBudgetItemAllocationModalOpen && selectedProduct && budgetId && (
                <IncludeProductModal
                    editingBudgetItem={editingBudgetItem} // Will likely be null for new allocations
                    handleAddProductSubmit={handleAddProductToBudget}
                    loading={loading}
                    isManualAllocation={isManualAllocation}
                    setIsManualAllocation={setIsManualAllocation}
                    manualAllocatedAmount={manualAllocatedAmount}
                    setManualAllocatedAmount={setManualAllocatedAmount}
                    allocatedQuantity={allocatedQuantity}
                    setAllocatedQuantity={setAllocatedQuantity}
                    budgetItemNotes={budgetItemNotes}
                    setBudgetItemNotes={setBudgetItemNotes}
                    setShowAddProductModal={setIsBudgetItemAllocationModalOpen} // Use the correct state setter
                    setEditingBudgetItem={setEditingBudgetItem}
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                    setIsConfirmationModalOpen={setIsConfirmationModalOpen} // Pass for potential next step
                />
            )}

            {isConfirmationModalOpen && confirmationDetails && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold text-gray-800">Confirm Action</h3>
                            <button
                                onClick={() => setIsConfirmationModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-semibold p-2 rounded-full hover:bg-gray-100"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="mb-6 text-gray-700">
                            {confirmationDetails.action === 'update' ? (
                                <p>
                                    The item "<span className="font-semibold">{confirmationDetails.itemName}</span>" (Product ID: <span className="font-semibold">{confirmationDetails?.product_id}</span>) already exists in budget "<span className="font-semibold">{confirmationDetails.budgetName}</span>".
                                    Do you want to <span className="font-bold text-orange-600">update its consumption plan</span>?
                                </p>
                            ) : (
                                <p>
                                    Are you sure you want to <span className="font-bold text-green-600">add</span> the item "<span className="font-semibold">{confirmationDetails.itemName}</span>" (Product ID: <span className="font-semibold">{confirmationDetails?.product_id}</span>) to budget "<span className="font-semibold">{confirmationDetails.budgetName}</span>"?
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsConfirmationModalOpen(false)}
                                className="px-6 py-2.5 rounded-md font-semibold text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAndExecuteTransaction}
                                className="px-6 py-2.5 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : (confirmationDetails.action === 'update' ? 'Confirm Update' : 'Confirm Add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

export default AddTransactionForm;