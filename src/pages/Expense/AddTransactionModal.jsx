import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProductsAndCategories } from '../../contexts/ProductAndCategoryContext';
import { addBudgetItem, fetchBudgetById, updateBudgetFromTransactionAPI, updateBudgetItem } from '../../api/budgetService';
import { toast } from 'react-toastify';
import { createTransaction } from '../../api/transactionService';
import ProductSelectionModal from '../../components/Modals/ProductSelectionModal';
import IncludeProductModal from '../Budget/BudgetDetails/Components/IncludeProductModal';
import ConShortFormModal from './ConShortFormModal';
import CustomConfirmationModal from './CustomConfirmationModal';

const AddTransactionModal = ({ isOpen, onClose, budgetId, allocatedItem }) => {
    console.log("allocatedItem", allocatedItem);
    const { userInfo, loading: authLoading, isAuthenticated } = useAuth();
    const { products, categories } = useProductsAndCategories();

    // --- Main Transaction Form State ---
    const [budget, setBudget] = useState({});
    const [itemName, setItemName] = useState(allocatedItem?.item_name || '');
    const [product_id, setProductId] = useState(allocatedItem?.product_id || '');
    const [amount, setAmount] = useState(0);
    const [price, setPrice] = useState(allocatedItem?.price_per_unit || 0);
    const [quantity, setQuantity] = useState(allocatedItem?.allocated_quantity ? 1 : 0);
    const [unit, setUnit] = useState(allocatedItem?.unit || '');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(allocatedItem?.category_id || '');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(allocatedItem?.subcategory_id || '');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- Product Selection Modal Internal State ---
    const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(allocatedItem || null);

    // --- Budget Item Allocation Modal Internal State ---
    const [isBudgetItemAllocationModalOpen, setIsBudgetItemAllocationModalOpen] = useState(false);
    const [allocatedQuantity, setAllocatedQuantity] = useState('');
    const [manualAllocatedAmount, setManualAllocatedAmount] = useState('');
    const [isManualAllocation, setIsManualAllocation] = useState(false);
    const [budgetItemNotes, setBudgetItemNotes] = useState('');
    const [editingBudgetItem, setEditingBudgetItem] = useState(null);

    // --- Consumption Plan Modal Internal State ---
    const [isConShortFormModalOpen, setIsConShortFormModalOpen] = useState(false);

    // --- Confirmation Modal Internal State ---
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [confirmationDetails, setConfirmationDetails] = useState(null);
    const [pendingTransactionPayload, setPendingTransactionPayload] = useState(null);


    // --- Effects ---
    useEffect(() => {
        if (allocatedItem) {
            setItemName(allocatedItem.item_name || '');
            setProductId(allocatedItem.product_id || '');
            setPrice(allocatedItem.price_per_unit || 0);
            setQuantity(1);
            setUnit(allocatedItem.unit || '');
            setSelectedCategoryId(allocatedItem.category_id || '');
            setSelectedSubcategoryId(allocatedItem.subcategory_id || '');
            setSelectedProduct(allocatedItem);
        }
    }, [allocatedItem]);

    useEffect(() => {
        const currentCategory = categories?.find(cat => cat.id === selectedCategoryId);
        if (!currentCategory || (currentCategory.subcategories && !currentCategory.subcategories.some(sub => sub.id === selectedSubcategoryId))) {
            setSelectedSubcategoryId('');
        }
    }, [selectedCategoryId, categories, selectedSubcategoryId]);

    useEffect(() => {
        if (price && quantity) {
            setAmount(parseFloat((price * quantity).toFixed(2)));
        } else {
            setAmount(0);
        }
    }, [price, quantity]);

    useEffect(() => {
        if (budgetId) {
            fetchBudgetDetails(budgetId);
        }
    }, [budgetId]);

    // --- API Call Functions ---
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
    const handleCategoryChange = useCallback((e) => {
        setSelectedCategoryId(e.target.value);
        setSelectedSubcategoryId('');
    }, []);

    const handleSelectProductFromProductSelectionModal = useCallback((product) => {
        setSelectedProduct(product);
        setProductId(product.id);
        setItemName(product.item_name);
        setPrice(product.price || 0);
        setUnit(product.unit || '');
        setSelectedCategoryId(product.category_id || (product.category?.id || ''));
        setSelectedSubcategoryId(product.subcategory_id || (product.subcategory?.id || ''));
        setQuantity(1);
        setIsProductSelectionModalOpen(false);
    }, []);

    const openProductSelectionModal = useCallback(() => {
        setIsProductSelectionModalOpen(true);
    }, []);

    const openConShortFormModal = useCallback(() => {
        setIsConShortFormModalOpen(true);
    }, []);

    const handleCloseConShortFormModal = useCallback(() => {
        setIsConShortFormModalOpen(false);
    }, []);

    const handleConsumptionPlanSuccess = useCallback((data) => {
        console.log("Consumption plan added successfully:", data);
        toast.success("Consumption plan saved!");
        setSelectedProduct(prev => ({
            ...prev,
            consumption_plan: {
                startDate: data.startDate,
                endDate: data.endDate,
                daily_quantity: data.dailyQuantity,
            },
            balance: true
        }));
        handleCloseConShortFormModal();
    }, [handleCloseConShortFormModal]);


    // Handles adding a product to the budget (via IncludeProductModal)
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
            setIsBudgetItemAllocationModalOpen(false);
            fetchBudgetDetails(budgetId);

            if (pendingTransactionPayload) {
                setConfirmationDetails({
                    ...pendingTransactionPayload,
                    budgetName: budget.budgetName,
                    action: 'add'
                });
                setIsConfirmationModalOpen(true);
                setPendingTransactionPayload(null);
            }

        } catch (err) {
            console.error(`Error adding product to budget:`, err);
            setError(err.message);
            toast.error(`Failed to allocate product: ${err.message}`);
        } finally {
            setLoading(false);
            setAllocatedQuantity('');
            setManualAllocatedAmount('');
            setBudgetItemNotes('');
            setIsManualAllocation(false);
            setEditingBudgetItem(null);
        }
    };

    const handleUpdateBudgetItem = async (e, receivedItemData) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!editingBudgetItem) {
            setError('No budget item selected for editing.');
            setLoading(false);
            return;
        }

        let itemData = {};

        if (receivedItemData.manual_allocated_amount) {
            const amountVal = parseFloat(receivedItemData.manual_allocated_amount);
            if (isNaN(amountVal) || amountVal <= 0) {
                setError('Please enter a valid manual allocated amount.');
                setLoading(false);
                return;
            }
            itemData.manual_allocated_amount = amountVal;
            itemData.allocated_quantity = null;
        } else {
            const qtyVal = parseFloat(receivedItemData.allocated_quantity);
            if (isNaN(qtyVal) || qtyVal <= 0) {
                setError('Please enter a valid allocated quantity.');
                setLoading(false);
                return;
            }
            const priceVal = receivedItemData.price_per_unit || selectedProduct?.price || 0;
            if (isNaN(priceVal) || priceVal <= 0) {
                 setError('Price per unit is required for quantity-based allocation.');
                 setLoading(false);
                 return;
            }
            itemData.allocated_quantity = qtyVal;
            itemData.price_per_unit = priceVal;
            itemData.manual_allocated_amount = null;
        }

        itemData.notes = budgetItemNotes.trim();
        itemData.consumption_plan = receivedItemData.consumption_plan;

        console.log("itemData", itemData);

        try {
            const updatedBudget = await updateBudgetItem(budgetId, editingBudgetItem.budgetItemId, itemData);
            setBudget(updatedBudget);
            setIsBudgetItemAllocationModalOpen(false);
            setEditingBudgetItem(null);
            setSelectedProduct(null);
            setAllocatedQuantity('');
            setManualAllocatedAmount('');
            setBudgetItemNotes('');
            setIsManualAllocation(false);
            toast.success('Product allocation updated successfully!');
            fetchBudgetDetails(budgetId);
        } catch (err) {
            setError(err.message);
            toast.error(`Error updating product allocation: ${err.message}`);
        } finally {
            setLoading(false);
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
        setPendingTransactionPayload(null);
    }, []);

    const getFilteredSubcategories = useCallback((categoryId) => {
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        return selectedCategory ? selectedCategory.subcategories || [] : [];
    }, [categories]);

    const subcategories = getFilteredSubcategories(selectedCategoryId);

    const filteredProductsForSelection = products.filter(
        (product) =>
            product.item_name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            product.category?.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            product.subcategory?.name.toLowerCase().includes(productSearchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    if (authLoading) {
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800">Loading...</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-4">
                        <div className="flex justify-center items-center h-24 text-lg text-gray-700">Loading authentication information...</div>
                    </div>
                </div>
            </div>
        );
    }
    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800">Authentication Required</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-4">
                        <div className="flex justify-center items-center h-24 text-lg text-red-600">Please log in to add transactions.</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800">Add New Transaction</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className='p-4'>
                    {/* Main Transaction Form Content */}
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

                            {/* Button to open Consumption Plan section */}
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
                                    <span className="font-medium">Selected:</span> {selectedProduct.item_name} (Unit: {selectedProduct.unit}, ID: {selectedProduct.id})
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
                                onChange={(e) => setAmount(parseFloat(e.target.value))}
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
            </div>

            {/* --- Product Selection Modal --- */}
            {isProductSelectionModalOpen && (
                <ProductSelectionModal
                    isOpen={isProductSelectionModalOpen}
                    setIsProductModalOpen={setIsProductSelectionModalOpen}
                    searchTerm={productSearchTerm}
                    setSearchTerm={setProductSearchTerm}
                    filteredProducts={filteredProductsForSelection}
                    handleSelectProduct={handleSelectProductFromProductSelectionModal}
                />
            )}

            {/* --- Budget Item Allocation Modal --- */}
            {isBudgetItemAllocationModalOpen && selectedProduct && budgetId && (
                <IncludeProductModal
                    isOpen={isBudgetItemAllocationModalOpen}
                    editingBudgetItem={editingBudgetItem}
                    handleAddProductSubmit={handleAddProductToBudget}
                    handleUpdateProductSubmit={handleUpdateBudgetItem}
                    loading={loading}
                    isManualAllocation={isManualAllocation}
                    setIsManualAllocation={setIsManualAllocation}
                    manualAllocatedAmount={manualAllocatedAmount}
                    setManualAllocatedAmount={setManualAllocatedAmount}
                    allocatedQuantity={allocatedQuantity}
                    setAllocatedQuantity={setAllocatedQuantity}
                    budgetItemNotes={budgetItemNotes}
                    setBudgetItemNotes={setBudgetItemNotes}
                    setShowAddProductModal={setIsBudgetItemAllocationModalOpen}
                    setEditingBudgetItem={setEditingBudgetItem}
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                    filteredProducts={[]}
                />
            )}

            {/* --- Consumption Plan Modal --- */}
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

            {/* --- Confirmation Modal --- */}
            {isConfirmationModalOpen && confirmationDetails && (
                <CustomConfirmationModal
                    isOpen={isConfirmationModalOpen}
                    onClose={() => setIsConfirmationModalOpen(false)}
                    onConfirm={confirmAndExecuteTransaction}
                    title="Confirm Transaction"
                    message={
                        confirmationDetails.action === 'update' ?
                            `The item "${confirmationDetails.itemName}" already exists in budget "${confirmationDetails.budgetName}". Do you want to add this transaction and update the budget's utilization?` :
                            `Are you sure you want to add the transaction for "${confirmationDetails.itemName}" to budget "${confirmationDetails.budgetName}"?`
                    }
                />
            )}
        </div>
    );
};

export default AddTransactionModal;