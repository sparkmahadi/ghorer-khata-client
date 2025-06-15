import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import IncludeProductModal from './Components/IncludeProductModal';
import BasicBudgetForm from './Components/BasicBudgetForm';
import FinancialSummary from './Components/FinancialSummary';
import BasicBudgetInfo from './Components/BasicBudgetInfo';
import AddProductForm from '../../Products/AddProductForm';
import { useProductsAndCategories } from '../../../contexts/ProductAndCategoryContext';

const handleApiResponse = (response) => {
    if (response.data.success) {
        return response.data.data;
    } else {
        throw new Error(response.data.message || 'An unknown error occurred');
    }
};

const deleteBudget = async (id) => {
    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${id}`);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in deleteBudget:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to delete budget');
    }
};

const addBudgetItem = async (budgetId, itemData) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${budgetId}/items`, itemData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in addBudgetItem:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to add budget item');
    }
};

const updateBudgetItem = async (budgetId, budgetItemId, itemData) => {
    try {
        const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${budgetId}/items/${budgetItemId}`, itemData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in updateBudgetItem:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update budget item');
    }
};

const deleteBudgetItem = async (budgetId, budgetItemId) => {
    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${budgetId}/items/${budgetItemId}`);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in deleteBudgetItem:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to delete budget item');
    }
};

// New API function to search master products (if not already existing)
const searchMasterProducts = async (searchTerm) => {
    try {
        // This endpoint needs to exist on your backend to search master products
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/search?q=${searchTerm}`);
        console.log(response);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error searching master products:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to search products');
    }
};

function BudgetDetails() {
    const { budgetId } = useParams();
    const {products, loadingProducts, categories, fetchProducts } = useProductsAndCategories();
    const navigate = useNavigate();

    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false); // For main budget details

    // State for the main budget edit form fields
    const [editName, setEditName] = useState('');
    const [editOverallBudgetAmount, setEditOverallBudgetAmount] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');

    // --- NEW STATES FOR PRODUCT ALLOCATIONS ---
    const [showAddProductModal, setShowAddProductModal] = useState(false); // Controls add product modal visibility
    const [searchTerm, setSearchTerm] = useState(''); // For searching master products
    const [searchResults, setSearchResults] = useState([]); // Master product search results
    const [selectedProduct, setSelectedProduct] = useState(null); // The product selected to add/edit

    const [allocatedQuantity, setAllocatedQuantity] = useState(''); // Quantity for calculation
    const [manualAllocatedAmount, setManualAllocatedAmount] = useState(''); // Manual fixed amount
    const [isManualAllocation, setIsManualAllocation] = useState(false); // Toggle between quantity/manual
    const [budgetItemNotes, setBudgetItemNotes] = useState(''); // Notes for budget item

    const [editingBudgetItem, setEditingBudgetItem] = useState(null); // The budget item being edited

      const [apiInProgress, setApiInProgress] = useState(false);


    // --- Data Fetching ---
    const fetchBudgetById = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${id}`);
            const fetchedBudget = handleApiResponse(response);
            setBudget(fetchedBudget);
            // Initialize main budget edit form states
            setEditName(fetchedBudget.budgetName || ''); // Using budgetName from your structure
            setEditOverallBudgetAmount(fetchedBudget.overallBudgetAmount?.toString() || '');
            setEditStartDate(fetchedBudget.period?.startDate ? fetchedBudget.period.startDate.split('T')[0] : '');
            setEditEndDate(fetchedBudget.period?.endDate ? fetchedBudget.period.endDate.split('T')[0] : '');
        } catch (err) {
            setError(err.message);
            console.error('Error in fetchBudgetById:', err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (budgetId) {
            fetchBudgetById(budgetId);
        }
    }, [budgetId]);

    // Ref for debounce timer
    const debounceTimeoutRef = useRef(null); // Added debounce ref

    // --- Live Search with Debounce and Exclusion ---
    useEffect(() => {
        // Clear previous timeout if exists
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        // Only search if searchTerm is not empty and we are in the add product modal
        // Also, exclude search if we are in edit mode (as product is already selected)
        if (showAddProductModal && searchTerm.trim().length > 0 && !editingBudgetItem) {
            setLoading(true); // Indicate loading for search
            debounceTimeoutRef.current = setTimeout(async () => {
                setError(null);
                try {
                    const results = await searchMasterProducts(searchTerm);
                    // Get IDs of products already in the current budget
                    const existingBudgetItemIds = new Set(
                        (budget?.budgetItems || []).map(item => item.product_id)
                    );
                    // Filter out products that are already in the budget
                    const filteredResults = results.filter(
                        product => !existingBudgetItemIds.has(product.id)
                    );
                    setSearchResults(filteredResults);
                } catch (err) {
                    setError(err.message);
                    setSearchResults([]); // Clear results on error
                } finally {
                    setLoading(false); // End loading for search
                }
            }, 300); // Debounce time: 300ms
        } else {
            setSearchResults([]); // Clear search results if search term is empty or not in add mode
            setLoading(false); // Reset loading state
        }
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchTerm, showAddProductModal, budget, editingBudgetItem]); // Re-run effect when searchTerm, modal visibility, or budget changes

    // Helper function to format date strings
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString.trim());
            if (isNaN(date.getTime())) {
                throw new Error("Invalid Date");
            }
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            console.error("Invalid date string for formatting:", dateString, e);
            return 'Invalid Date';
        }
    };

    const handleDeleteBudget = async () => {
        // Replace with custom modal/confirmation dialog
        if (window.confirm('Are you absolutely sure you want to delete this budget and ALL its associated data? This action cannot be undone!')) {
            setLoading(true);
            setError(null);
            try {
                await deleteBudget(budgetId);
                // alert('Budget deleted successfully!');
                console.log('Budget deleted successfully!'); // Replace with toast/modal
                navigate('/');
            } catch (err) {
                setError(err.message);
                // alert(`Error deleting budget: ${err.message}`);
                console.error(`Error deleting budget: ${err.message}`); // Replace with toast/modal
            } finally {
                setLoading(false);
            }
        }
    };
    // --- Product Allocation Handlers ---

    const handleSearchProducts = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const results = await searchMasterProducts(searchTerm);
            setSearchResults(results);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProduct = (product) => {
        console.log(product);
        setSelectedProduct(product);
        setSearchTerm(product.item_name); // Display selected product name in search
        setSearchResults([]); // Clear search results
        // Reset allocation fields for a new product
        setAllocatedQuantity('');
        setManualAllocatedAmount('');
        setIsManualAllocation(false);
        setBudgetItemNotes('');
    };

    const handleAddProductSubmit = async (e, itemData) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!selectedProduct) {
            setError('Please select a product.');
            setLoading(false);
            return;
        }
        
        if (budgetItemNotes.trim()) {
            itemData.notes = budgetItemNotes.trim();
        }

        try {
            console.log('itemdata', itemData);
            const updatedBudget = await addBudgetItem(budgetId, itemData);
            setBudget(updatedBudget); // Update UI with latest budget data from backend
            setShowAddProductModal(false); // Close modal
            setSelectedProduct(null); // Clear selected product
            setSearchTerm('');
            setAllocatedQuantity('');
            setManualAllocatedAmount('');
            setBudgetItemNotes('');
            setIsManualAllocation(false);
            console.log('Product added to budget successfully!'); // Replace with toast/modal
        } catch (err) {
            setError(err.message);
            console.error(`Error adding product to budget: ${err.message}`); // Replace with toast/modal
        } finally {
            setLoading(false);
        }
    };

    const handleEditProductClick = (item) => {
        setEditingBudgetItem(item);
        setSelectedProduct({ // Pre-fill selected product data for editing
            id: item.product_id,
            item_name: item.item_name,
            price: item.base_price_at_allocation // Use the price stored at allocation
        });
        if (item.manual_allocated_amount !== null && item.manual_allocated_amount !== undefined) {
            setIsManualAllocation(true);
            setManualAllocatedAmount(item.manual_allocated_amount.toString());
            setAllocatedQuantity('');
        } else {
            setIsManualAllocation(false);
            setAllocatedQuantity(item.allocated_quantity?.toString() || '');
            setManualAllocatedAmount('');
        }
        setBudgetItemNotes(item.notes || '');
        setShowAddProductModal(true); // Reuse the same modal for editing
    };

    const handleUpdateProductSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!editingBudgetItem) {
            setError('No budget item selected for editing.');
            setLoading(false);
            return;
        }

        let itemData = {};

        if (isManualAllocation) {
            const amount = parseFloat(manualAllocatedAmount);
            if (isNaN(amount) || amount <= 0) {
                setError('Please enter a valid manual allocated amount.');
                setLoading(false);
                return;
            }
            itemData.manual_allocated_amount = amount;
            itemData.allocated_quantity = null; // Ensure the other field is explicitly null
        } else {
            const qty = parseFloat(allocatedQuantity);
            if (isNaN(qty) || qty <= 0) {
                setError('Please enter a valid allocated quantity.');
                setLoading(false);
                return;
            }
            itemData.allocated_quantity = qty;
            itemData.manual_allocated_amount = null; // Ensure the other field is explicitly null
        }

        itemData.notes = budgetItemNotes.trim();

        try {
            const updatedBudget = await updateBudgetItem(budgetId, editingBudgetItem.budgetItemId, itemData);
            setBudget(updatedBudget);
            setShowAddProductModal(false);
            setEditingBudgetItem(null);
            setSelectedProduct(null);
            setAllocatedQuantity('');
            setManualAllocatedAmount('');
            setBudgetItemNotes('');
            setIsManualAllocation(false);
            console.log('Product allocation updated successfully!'); // Replace with toast/modal
        } catch (err) {
            setError(err.message);
            console.error(`Error updating product allocation: ${err.message}`); // Replace with toast/modal
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (budgetItemId, itemName) => {
        // Replace with custom modal/confirmation dialog
        if (window.confirm(`Are you sure you want to remove "${itemName}" from this budget?`)) {
            setLoading(true);
            setError(null);
            try {
                const updatedBudget = await deleteBudgetItem(budgetId, budgetItemId);
                setBudget(updatedBudget); // Update UI
                console.log('Product removed from budget successfully!'); // Replace with toast/modal
            } catch (err) {
                setError(err.message);
                console.error(`Error removing product from budget: ${err.message}`); // Replace with toast/modal
            } finally {
                setLoading(false);
            }
        }
    };

  // Filter subcategories based on selected category for forms
  const getFilteredSubcategories = (categoryId) => {
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    return selectedCategory ? selectedCategory.subcategories : [];
  };


    if (loading && !budget) return <p className="text-center py-4 text-gray-600">Loading budget details...</p>;
    if (loadingProducts) return <p className="text-center py-4 text-gray-600">Loading products and details...</p>;
    if (error) return <p className="text-center text-red-600 py-4 font-medium">Error: {error}</p>;
    if (!budget) return <p className="text-center py-4 text-gray-600">Budget not found or has been deleted.</p>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 mx-auto max-w-4xl my-8 font-inter">
            <h2 className="text-3xl font-extrabold mb-6 text-blue-800 text-center animate-fade-in">
                Budget Overview: {budget?.budgetName}
            </h2>

            {/* Action Buttons: Edit and Delete */}
            <div className="flex justify-center space-x-4 mb-8">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-lg transform hover:scale-105"
                >
                    {isEditing ? 'Cancel Budget Edit' : 'Edit Budget'}
                </button>
                <button
                    onClick={handleDeleteBudget}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-lg transform hover:scale-105"
                >
                    Delete Budget
                </button>
            </div>

            {isEditing ? (
                // Edit Form Mode for overall budget
                <BasicBudgetForm
                    editName={editName}
                    setEditName={setEditName}
                    editOverallBudgetAmount={editOverallBudgetAmount}
                    setEditOverallBudgetAmount={setEditOverallBudgetAmount}
                    editStartDate={editStartDate}
                    editEndDate={editEndDate}
                    setEditStartDate={setEditStartDate}
                    setEditEndDate={setEditEndDate}
                    loading={loading}
                    setIsEditing={setIsEditing}
                    setLoading={setLoading}
                    setError={setError}
                    budgetId={budgetId}
                    setBudget={setBudget}
                />
            ) : (
                // View Mode
                <>
                    {/* Financial Summaries Dashboard Section */}
                    <FinancialSummary
                        budget={budget}
                    />

                    <BasicBudgetInfo budget={budget} formatDate={formatDate} />


                    {/* Categories Section */}
                    <section className="mb-8 p-6 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Categories (Allocations derived from Products)</h3>
                        {budget.categories && budget.categories.length > 0 ? (
                            <ul className="space-y-4">
                                {budget.categories.map(category => (
                                    <li key={category.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 transform transition-transform hover:scale-[1.01] duration-200">
                                        <h4 className="text-lg font-bold text-gray-800 mb-2">{category.name}</h4>
                                        <p className="text-gray-700 text-sm mb-2">
                                            Allocated: <span className="font-semibold text-blue-600">${(category.allocatedAmount || 0).toFixed(2)}</span> |
                                            Utilized: <span className="font-semibold text-red-600">${(category.utilizedAmount || 0).toFixed(2)}</span>
                                        </p>
                                        {category.subcategories && category.subcategories.length > 0 && (
                                            <div className="ml-4 pt-2 border-t border-gray-200">
                                                <p className="text-gray-700 text-sm font-medium mb-1">Subcategories:</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                    {category.subcategories.map(subcat => (
                                                        <li key={subcat.id}>
                                                            {subcat.name} (Allocated: <span className="font-semibold text-blue-500">${(subcat.allocatedAmount || 0).toFixed(2)}</span> | Utilized: <span className="font-semibold text-red-500">${(subcat.utilizedAmount || 0).toFixed(2)}</span>)
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-center py-4">No categories defined for this budget. Add items to create allocations!</p>
                        )}
                    </section>

                    {/* Product Allocations Section */}
                    <section className="mb-8 p-6 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex justify-between items-center">
                            Product Allocations
                            <button
                                onClick={() => {
                                    setShowAddProductModal(true);
                                    setSelectedProduct(null); // Clear any previously selected product
                                    setEditingBudgetItem(null); // Ensure we are in add mode
                                    setSearchTerm(''); // Clear search term
                                    setSearchResults([]); // Clear search results
                                    setAllocatedQuantity('');
                                    setManualAllocatedAmount('');
                                    setBudgetItemNotes('');
                                    setIsManualAllocation(false);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out shadow-md transform hover:scale-105"
                            >
                                Add Product Allocation
                            </button>
                        </h3>

                        {budget?.budgetItems && budget?.budgetItems.length > 0 ? (
                            <ul className="space-y-3">
                                {budget.budgetItems.map(item => (
                                    <li key={item.budgetItemId} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center transform transition-transform hover:scale-[1.01] duration-200">
                                        <div className="mb-2 sm:mb-0">
                                            <p className="text-lg font-bold text-gray-800">{item.item_name}</p>
                                            <p className="text-sm text-gray-600">
                                                Category: {item.category_id || 'N/A'}
                                                {item.subcategory_id && ` > ${item.subcategory_id || 'N/A'}`}
                                            </p>
                                            <p className="text-sm text-gray-700 mt-1">
                                                Allocated: <span className="font-bold text-green-700">${(item.allocated_amount || 0).toFixed(2)}</span>
                                                {item.allocated_quantity && ` (${item.allocated_quantity} ${item.unit || ''} @ $${(item.price_per_unit || 0).toFixed(2)}/${item.unit || ''})`}
                                            </p>
                                            {item.notes && <p className="text-xs text-gray-500 italic">Notes: {item.notes}</p>}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditProductClick(item)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-sm transform hover:scale-105"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(item.budgetItemId, item.item_name)}
                                                className="bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-sm transform hover:scale-105"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-center py-4">No product allocations in this budget. Click "Add Product Allocation" to start!</p>
                        )}
                    </section>

                    {/* Log Timestamps Section */}
                    <section className="p-5 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold mb-3 text-gray-800">Logs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                            <p><strong className="font-semibold text-gray-800">Created At:</strong> {formatDate(budget.createdAt)}</p>
                            <p><strong className="font-semibold text-gray-800">Last Updated At:</strong> {formatDate(budget.lastUpdatedAt)}</p>
                        </div>
                    </section>
                </>
            )}

            {/* all the products */}
            {/* Product List */}
            {products?.length === 0 ? (
                <p className="text-center text-gray-600">No products found. Add a new one!</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <h3>Select items from here...</h3>
                        <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Item Name</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Qty ({products[0]?.unit || 'Unit'})</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Categories</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products?.map(product => (
                                    <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <>
                                            <td className="py-3 px-4 font-medium text-gray-900">{product.item_name}</td>

                                            <td className="py-3 px-4 text-gray-700">{product.quantity} {product.unit}</td>
                                            <td className="py-3 px-4 text-gray-700">{product.category_id} &gt; {product.subcategory_id}</td>
                                            <td className="py-3 px-4 flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setShowAddProductModal(true);
                                                        handleSelectProduct(product)
                                                    }
                                                    }
                                                    className="bg-green-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-xl shadow-md text-sm"
                                                >
                                                    Select
                                                </button>
                                            </td>
                                        </>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Add New Product Button / Form */}
                    <AddProductForm
                        apiInProgress={apiInProgress}
                        fetchProducts={fetchProducts}
                        setApiInProgress={setApiInProgress}
                        getFilteredSubcategories={getFilteredSubcategories}
                        categories={categories}
                    />
                </>
            )}

            {/* Add/Edit Product Allocation Modal */}
            {showAddProductModal && (
                <IncludeProductModal
                    editingBudgetItem={editingBudgetItem}
                    handleAddProductSubmit={handleAddProductSubmit}
                    handleUpdateProductSubmit={handleUpdateProductSubmit}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    handleSearchProducts={handleSearchProducts}
                    loading={loading}
                    searchResults={searchResults}
                    handleSelectProduct={handleSelectProduct}
                    selectedProduct={selectedProduct}
                    isManualAllocation={isManualAllocation}
                    setIsManualAllocation={setIsManualAllocation}
                    manualAllocatedAmount={manualAllocatedAmount}
                    setManualAllocatedAmount={setManualAllocatedAmount}
                    allocatedQuantity={allocatedQuantity}
                    setAllocatedQuantity={setAllocatedQuantity}
                    budgetItemNotes={budgetItemNotes}
                    setBudgetItemNotes={setBudgetItemNotes}
                    setShowAddProductModal={setShowAddProductModal}
                    setSelectedProduct={setSelectedProduct}
                    setSearchResults={setSearchResults}
                    setEditingBudgetItem={setEditingBudgetItem}
                />
            )}
        </div>
    );
}

export default BudgetDetails;