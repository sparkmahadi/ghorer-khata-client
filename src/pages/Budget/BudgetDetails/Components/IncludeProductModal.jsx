import React from 'react';

const IncludeProductModal = ({ editingBudgetItem, handleAddProductSubmit, handleUpdateProductSubmit, searchTerm, setSearchTerm, handleSearchProducts, loading, searchResults, handleSelectProduct, selectedProduct, isManualAllocation, setIsManualAllocation, manualAllocatedAmount, setManualAllocatedAmount, allocatedQuantity, setAllocatedQuantity, budgetItemNotes, setBudgetItemNotes, setShowAddProductModal, setSelectedProduct, setSearchResults, setEditingBudgetItem }) => {

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-transform duration-300 scale-100 animate-slide-up">
                <h3 className="text-2xl font-bold mb-5 text-blue-700 text-center">
                    {editingBudgetItem ? 'Edit Product Allocation' : 'Add Product Allocation'}
                </h3>
                <form onSubmit={editingBudgetItem ? handleUpdateProductSubmit : handleAddProductSubmit} className="space-y-5">
                    {/* Product Search/Selection */}
                    {!editingBudgetItem ? ( // Only show search for adding new item
                        <div className="relative">
                            <label className="block text-gray-700 font-medium mb-2">Search Product:</label>
                            <input
                                type="text"
                                placeholder="Type to search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 text-lg pr-12"
                            />
                            <button
                                type="button"
                                onClick={handleSearchProducts}
                                disabled={loading}
                                className="absolute right-2 top-9 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                            {loading && searchTerm.trim().length > 0 && (
                                <p className="text-sm text-gray-500 mt-1">Searching...</p>
                            )}
                            {searchTerm.trim().length > 0 && searchResults.length === 0 && !loading && (
                                <p className="text-sm text-gray-500 mt-1">No other products found matching your search.</p>
                            )}


                            {searchResults.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-2 max-h-48 overflow-y-auto shadow-xl">
                                    {searchResults.map(product => (
                                        <li
                                            key={product._id}
                                            onClick={() => handleSelectProduct(product)}
                                            className="p-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100 last:border-b-0 text-gray-800 text-base"
                                        >
                                            {product.item_name} (Category: {product.category_id})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        // Display selected product for editing mode
                        <div className="p-3 bg-gray-100 rounded-md border border-gray-200">
                            <p className="font-semibold text-gray-800">Editing Product: {selectedProduct?.item_name}</p>
                            <p className="text-sm text-gray-600">Base Price: ${selectedProduct?.price?.toFixed(2) || 'N/A'}/{selectedProduct?.unit || 'Unit'}</p>
                        </div>
                    )}

                    {selectedProduct && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-800">
                            <p className="font-semibold">Selected Product: {selectedProduct.item_name}</p>
                            <p className="italic">Category: {selectedProduct.category_id}</p>
                            <p className="italic">Subcategory: {selectedProduct.subcategory_id}</p>
                            <p className="text-sm font-semibold">Base Price: ${selectedProduct.price?.toFixed(2) || 'N/A'}/{selectedProduct.unit || 'Unit'}</p>
                        </div>
                    )}

                    {/* Allocation Method Toggle */}
                    <div>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-blue-600 rounded-md"
                                checked={isManualAllocation}
                                onChange={() => setIsManualAllocation(!isManualAllocation)}
                            />
                            <span className="ml-2 text-gray-700 font-medium">Allocate by Manual Amount</span>
                        </label>
                    </div>

                    {/* Allocation Inputs */}
                    {isManualAllocation ? (
                        <label className="block">
                            <span className="text-gray-700 font-medium">Manual Allocated Amount ($):</span>
                            <input
                                type="number"
                                value={manualAllocatedAmount}
                                onChange={(e) => setManualAllocatedAmount(e.target.value)}
                                required
                                step="0.01"
                                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm p-3 text-lg"
                            />
                        </label>
                    ) : (
                        <label className="block">
                            <span className="text-gray-700 font-medium">Allocated Quantity ({selectedProduct?.unit || 'Units'}):</span>
                            <input
                                type="number"
                                value={allocatedQuantity}
                                onChange={(e) => setAllocatedQuantity(e.target.value)}
                                required
                                step="0.01"
                                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm p-3 text-lg"
                            />
                            {selectedProduct && allocatedQuantity && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Calculated Amount: <span className="font-semibold text-blue-600">${(parseFloat(allocatedQuantity) * (selectedProduct.price || 0)).toFixed(2)}</span>
                                </p>
                            )}
                        </label>
                    )}

                    <label className="block">
                        <span className="text-gray-700 font-medium">Notes (Optional):</span>
                        <textarea
                            value={budgetItemNotes}
                            onChange={(e) => setBudgetItemNotes(e.target.value)}
                            rows="3"
                            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm p-3 text-lg"
                        ></textarea>
                    </label>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="submit"
                            disabled={loading || !selectedProduct}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            {loading ? 'Saving...' : (editingBudgetItem ? 'Update Allocation' : 'Add Allocation')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddProductModal(false);
                                setSelectedProduct(null);
                                setEditingBudgetItem(null);
                                setSearchTerm('');
                                setSearchResults([]);
                                setAllocatedQuantity('');
                                setManualAllocatedAmount('');
                                setBudgetItemNotes('');
                                setIsManualAllocation(false);
                            }}
                            disabled={loading}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default IncludeProductModal;