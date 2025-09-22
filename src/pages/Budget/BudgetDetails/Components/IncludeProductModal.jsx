import React, { useEffect, useState } from 'react';
import ProductSelectionModal from './../../../../components/Modals/ProductSelectionModal';

function IncludeProductModal({
    editingBudgetItem,
    handleAddProductSubmit,
    handleUpdateProductSubmit,
    loading,
    isManualAllocation,
    setIsManualAllocation,
    manualAllocatedAmount,
    setManualAllocatedAmount,
    allocatedQuantity,
    setAllocatedQuantity,
    budgetItemNotes,
    setBudgetItemNotes,
    setShowAddProductModal,
    setEditingBudgetItem,
    filteredProducts,
    selectedProduct,
    setSelectedProduct,
    setIsConfirmationModalOpen,
}) {
    // --- Internal states for the modal's form fields ---
    const [currentAllocatedQuantity, setCurrentAllocatedQuantity] = useState(allocatedQuantity);
    const [currentPricePerUnit, setCurrentPricePerUnit] = useState(''); // New state for editable price
    const [currentManualAllocatedAmount, setCurrentManualAllocatedAmount] = useState(manualAllocatedAmount);
    const [currentBudgetItemNotes, setCurrentBudgetItemNotes] = useState(budgetItemNotes);
    const [currentIsManualAllocation, setCurrentIsManualAllocation] = useState(isManualAllocation);

    const [searchTerm, setSearchTerm] = useState("");
    const [isProductModalOpen, setIsProductModalOpen] = useState(false); // State for the product selection modal
    // const [selectedProduct, setSelectedProduct] = useState(null); // The product selected to add/edit
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    // --- useEffect to synchronize internal states with props ---
    useEffect(() => {
        console.log("Modal useEffect triggered.");
        console.log("editingBudgetItem:", editingBudgetItem);
        console.log("selectedProduct:", selectedProduct);

        if (editingBudgetItem) {
            // If we are editing an existing budget item
            // setCurrentSearchTerm(editingBudgetItem.item_name || '');
            setCurrentIsManualAllocation(editingBudgetItem.manual_allocated_amount != null);
            setCurrentManualAllocatedAmount(editingBudgetItem.manual_allocated_amount?.toString() || '');
            setCurrentAllocatedQuantity(editingBudgetItem.allocated_quantity?.toString() || '');
            // When editing, if a quantity was allocated, use the calculated price or a stored price
            if (editingBudgetItem.allocated_quantity && editingBudgetItem.manual_allocated_amount == null) {
                setCurrentPricePerUnit(editingBudgetItem?.price_per_unit);
            } else {
                setCurrentPricePerUnit(''); // Clear if not applicable
            }
            setCurrentBudgetItemNotes(editingBudgetItem.notes || '');
        } else if (selectedProduct) {
            // If a new product is selected from the search results
            // setCurrentSearchTerm(selectedProduct.item_name || '');
            setCurrentAllocatedQuantity('');
            // Pre-fill price per unit with selected product's base price
            setCurrentPricePerUnit(selectedProduct.price?.toString() || '');
            setCurrentManualAllocatedAmount('');
            setCurrentIsManualAllocation(false); // Default to quantity allocation
            setCurrentBudgetItemNotes('');
        } else {
            // If the modal is opened freshly for adding, without a selected product initially
            // setCurrentSearchTerm('');
            setCurrentAllocatedQuantity('');
            setCurrentPricePerUnit(''); // Clear price when no product
            setCurrentManualAllocatedAmount('');
            setCurrentIsManualAllocation(false);
            setCurrentBudgetItemNotes('');
        }
    }, [editingBudgetItem, selectedProduct]); // Dependencies: re-run when these props change

    const handleSelectProduct = (product) => {
        console.log(product);
        setSelectedProduct(product);
        // Reset allocation fields for a new product
        setAllocatedQuantity('');
        setManualAllocatedAmount('');
        setIsManualAllocation(false);
        setBudgetItemNotes('');
        setIsProductModalOpen(false);
    };

    // --- Handlers for internal state changes ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProduct && !editingBudgetItem) {
            alert('Please select a product or choose an item to edit.');
            return;
        }

        let itemData = {
            product_id: selectedProduct?.id || editingBudgetItem?.product_id,
        };
        if (currentIsManualAllocation) {
            const amount = parseFloat(currentManualAllocatedAmount);
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid manual allocated amount.');
                return;
            }
            itemData.manual_allocated_amount = amount;
            itemData.allocated_quantity = null;
            itemData.price_per_unit = null; // Ensure this is nullified for manual allocation
        } else {
            const qty = parseFloat(currentAllocatedQuantity);
            const price = parseFloat(currentPricePerUnit);
            if (isNaN(qty) || qty <= 0) {
                alert('Please enter a valid allocated quantity.');
                return;
            }
            if (isNaN(price) || price <= 0) {
                alert('Please enter a valid price per unit.');
                return;
            }

            itemData.allocated_quantity = qty;
            itemData.price_per_unit = price; // Add the price_per_unit to the data
            itemData.manual_allocated_amount = null; // Ensure this is nullified for quantity allocation
        }

        if (currentBudgetItemNotes.trim()) {
            itemData.notes = currentBudgetItemNotes.trim();
        }

        try {
            if (editingBudgetItem) {
                // When updating, you'll likely need the budget item ID
                itemData.budget_item_id = editingBudgetItem.id; // Make sure your API expects this
                await handleUpdateProductSubmit(e, itemData);
            } else {
                await handleAddProductSubmit(e, itemData);
            }
            handleClose();
            if(setIsConfirmationModalOpen){
                setIsConfirmationModalOpen(true);
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert(`Failed to save allocation: ${error.message || 'An unknown error occurred'}`);
        }
    };

    const handleClose = () => {
        setShowAddProductModal(false);
        setEditingBudgetItem(null);
        // Reset the prop states in parent
        setAllocatedQuantity('');
        setManualAllocatedAmount('');
        setBudgetItemNotes('');
        setIsManualAllocation(false);

        // Also reset internal modal states for next open
        setCurrentAllocatedQuantity('');
        setCurrentPricePerUnit(''); // Reset the new price field
        setCurrentManualAllocatedAmount('');
        setCurrentIsManualAllocation(false);
        setCurrentBudgetItemNotes('');
    };

    // Calculate estimated total based on current internal states
    const estimatedTotal = (parseFloat(currentAllocatedQuantity) || 0) * (parseFloat(currentPricePerUnit) || 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                    {editingBudgetItem ? 'Edit Product Allocation' : 'Add Product Allocation'}
                </h3>
                {loading && <p className="text-blue-600 mb-3">Processing...</p>}
                <button
                    type="button"
                    onClick={() => setIsProductModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm"
                >
                    Select Product
                </button>
                <form onSubmit={handleSubmit}>
                    {/* Display selected product details (shows base price as reference) */}
                    {console.log(selectedProduct)}
                    {selectedProduct && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="font-semibold text-blue-800 mb-1">Selected Product:</p>
                            <p className="text-gray-700"><strong>Name:</strong> {selectedProduct.item_name}</p>
                            <p className="text-gray-700"><strong>Categories:</strong> {selectedProduct.category_id} &gt; {selectedProduct?.subcategory_id}</p>
                        </div>
                    )}

                    {/* Allocation Method Toggle */}
                    <div className="mb-4 flex items-center">
                        <input
                            type="checkbox"
                            id="manualAllocationToggle"
                            checked={currentIsManualAllocation}
                            onChange={(e) => setCurrentIsManualAllocation(e.target.checked)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="manualAllocationToggle" className="text-sm font-medium text-gray-700">
                            Manually enter total allocated amount
                        </label>
                    </div>

                    {/* Quantity or Manual Amount Input */}
                    {currentIsManualAllocation ? (
                        <div className="mb-4">
                            <label htmlFor="manualAllocatedAmount" className="block text-sm font-medium text-gray-700 mb-1">
                                Manual Total Allocated Amount ($)
                            </label>
                            <input
                                type="number"
                                id="manualAllocatedAmount"
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={currentManualAllocatedAmount}
                                onChange={(e) => setCurrentManualAllocatedAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="e.g., 150.00"
                                required={currentIsManualAllocation}
                                disabled={loading}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label htmlFor="allocatedQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                                    Allocated Quantity {selectedProduct?.unit ? `(${selectedProduct.unit})` : ''}
                                </label>
                                <input
                                    type="number"
                                    id="allocatedQuantity"
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={currentAllocatedQuantity}
                                    onChange={(e) => setCurrentAllocatedQuantity(e.target.value)}
                                    min="0"
                                    step="any"
                                    placeholder="e.g., 10"
                                    required={!currentIsManualAllocation}
                                    disabled={loading}
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1">
                                    Price Per Unit ($)
                                </label>
                                <input
                                    type="number"
                                    id="pricePerUnit"
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={currentPricePerUnit}
                                    onChange={(e) => setCurrentPricePerUnit(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    placeholder="e.g., 15.00"
                                    required={!currentIsManualAllocation}
                                    disabled={loading}
                                />
                            </div>
                            {/* Display Estimated Total */}
                            {(parseFloat(currentAllocatedQuantity) > 0 || parseFloat(currentPricePerUnit) > 0) && (
                                <p className="text-md text-gray-700 mb-4">
                                    Estimated Total: <span className="font-bold text-green-700">${estimatedTotal.toFixed(2)}</span>
                                </p>
                            )}
                        </>
                    )}

                    {/* Notes Input */}
                    <div className="mb-6">
                        <label htmlFor="budgetItemNotes" className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            id="budgetItemNotes"
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={currentBudgetItemNotes}
                            onChange={(e) => setCurrentBudgetItemNotes(e.target.value)}
                            rows="3"
                            placeholder="Add any specific notes for this allocation..."
                            disabled={loading}
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || (!selectedProduct && !editingBudgetItem) || (!currentIsManualAllocation && (parseFloat(currentAllocatedQuantity) <= 0 || parseFloat(currentPricePerUnit) <= 0)) || (currentIsManualAllocation && parseFloat(currentManualAllocatedAmount) <= 0)}
                        >
                            {editingBudgetItem ? 'Update Allocation' : 'Add Allocation'}
                        </button>
                    </div>
                </form>
            </div>


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
    );
}

export default IncludeProductModal; 