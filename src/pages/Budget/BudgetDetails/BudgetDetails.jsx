import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import IncludeProductModal from './Components/IncludeProductModal';
import BasicBudgetForm from './Components/BasicBudgetForm';
import FinancialSummary from './Components/FinancialSummary';
import { useProductsAndCategories } from '../../../contexts/ProductAndCategoryContext';
import { toast } from 'react-toastify';
import AllocatedItem from './Components/AllocatedItem';
import BudgetSideBarInfo from './Components/BudgetSideBarInfo';
import { addBudgetItem, deleteBudget, deleteBudgetItem, updateBudgetItem } from '../../../api/budgetService';
import { handleApiResponse } from '../../../lib/handleApiResponse';
import { searchMasterProducts } from '../../../api/productService';
import { formatDate } from '../../../lib/utilityFunctions';

function BudgetDetails() {
    const { budgetId } = useParams();
    const { products, loadingProducts, categories, fetchProducts } = useProductsAndCategories();
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

    const [isTableView, setIsTableView] = useState(true);

    // Toggle function for the view mode
    const toggleView = () => {
        setIsTableView(prev => !prev);
    };

    const filteredProducts = products.filter(
        (product) =>
            product.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.subcategory?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    // const handleSearchProducts = async (e) => {
    //     e.preventDefault();
    //     if (!searchTerm.trim()) {
    //         setSearchResults([]);
    //         return;
    //     }
    //     setLoading(true);
    //     setError(null);
    //     try {
    //         const results = await searchMasterProducts(searchTerm);
    //         setSearchResults(results);
    //     } catch (err) {
    //         setError(err.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

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
        console.log('to edit', item);
        setEditingBudgetItem(item);
        setSelectedProduct(item);
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

    const handleUpdateProductSubmit = async (e, receivedItemData) => {
        e.preventDefault();
        console.log("receivedItemData", receivedItemData);
        setLoading(true);
        setError(null);

        if (!editingBudgetItem) {
            setError('No budget item selected for editing.');
            setLoading(false);
            return;
        }

        let itemData = {};

        if (receivedItemData.manual_allocated_amount) {
            const amount = parseFloat(receivedItemData.manual_allocated_amount);
            if (isNaN(amount) || amount <= 0) {
                setError('Please enter a valid manual allocated amount.');
                setLoading(false);
                return;
            }
            itemData.manual_allocated_amount = amount;
            itemData.allocated_quantity = null; // Ensure the other field is explicitly null
        } else {
            const qty = parseFloat(receivedItemData.allocated_quantity);
            if (isNaN(qty) || qty <= 0) {
                setError('Please enter a valid allocated quantity.');
                setLoading(false);
                return;
            }
            const price = parseFloat(receivedItemData.price_per_unit);
            console.log("receivedItemData", receivedItemData);
            if (isNaN(price) || price <= 0) {
                setError('Please enter a valid price.');
                setLoading(false);
                return;
            }
            itemData.allocated_quantity = qty;
            itemData.price_per_unit = price;
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

    const handleRecalculateBudget = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/recalculate-figures/${budgetId}`);
            const updatedBudget = handleApiResponse(response);
            if (response?.data?.success) {
                toast.success("Budget Updated")
            } else {
                return toast.error("Error occured. Not updated")
            }
            setBudget(updatedBudget);
            // Initialize main budget edit form states
            setEditName(updatedBudget.budgetName || ''); // Using budgetName from your structure
            setEditOverallBudgetAmount(updatedBudget.overallBudgetAmount?.toString() || '');
            setEditStartDate(updatedBudget.period?.startDate ? updatedBudget.period.startDate.split('T')[0] : '');
            setEditEndDate(updatedBudget.period?.endDate ? updatedBudget.period.endDate.split('T')[0] : '');
        } catch (err) {
            setError(err.message);
            console.error('Error in fetchBudgetById:', err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleResetFigures = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/reset-figures/${budgetId}`);
            console.log(response);
            const updatedBudget = response.data.data;
            if (response?.data?.success) {
                setBudget(updatedBudget);
                // Initialize main budget edit form states
                setEditName(updatedBudget.budgetName || ''); // Using budgetName from your structure
                setEditOverallBudgetAmount(updatedBudget.overallBudgetAmount?.toString() || '');
                setEditStartDate(updatedBudget.period?.startDate ? updatedBudget.period.startDate.split('T')[0] : '');
                setEditEndDate(updatedBudget.period?.endDate ? updatedBudget.period.endDate.split('T')[0] : '');
                toast.success("Budget Reset");
            } else {
                return toast.error("Error occured. Not Reset")
            }
        } catch (err) {
            setError(err.message);
            console.error('Error in fetchBudgetById:', err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }


    if (loading && !budget) return <p className="text-center py-4 text-gray-600">Loading budget details...</p>;
    if (loadingProducts) return <p className="text-center py-4 text-gray-600">Loading products and details...</p>;
    if (error) return <p className="text-center text-red-600 py-4 font-medium">Error: {error}</p>;
    if (!budget) return <p className="text-center py-4 text-gray-600">Budget not found or has been deleted.</p>;

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 mx-auto  my-8 font-inter ">

                {/* side section */}
                <div className=''>
                    <h2 className="xl:text-2xl font-extrabold mb-6 text-blue-800 text-center animate-fade-in">
                        Budget Overview: {budget?.budgetName}
                    </h2>

                    {/* Action Buttons: Edit and Delete */}
                    <div className="xl:flex justify-center space-x-4 mb-8 text-xs xl:text-base">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-2 rounded-lg transition duration-300 ease-in-out shadow-lg transform hover:scale-105"
                        >
                            {isEditing ? 'Cancel Budget Edit' : 'Edit Budget'}
                        </button>
                        <button
                            onClick={handleDeleteBudget}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-2 rounded-lg transition duration-300 ease-in-out shadow-lg transform hover:scale-105"
                        >
                            Delete Budget
                        </button>
                        <button
                            onClick={handleRecalculateBudget}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-2 rounded-lg transition duration-300 ease-in-out shadow-lg transform hover:scale-105"
                        >
                            Recalcualate Budget
                        </button>
                        <button
                            onClick={handleResetFigures}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-2 rounded-lg transition duration-300 ease-in-out shadow-lg transform hover:scale-105"
                        >
                            Reset Figures
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
                        </>
                    )}

                    <BudgetSideBarInfo budget={budget} formatDate={formatDate} />

                </div>



                {/* second section */}

                <div className=''>
                    {/* Categories Section */}
                    <section className="mb-8 p-6 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Categories (Allocations derived from Products)</h3>
                        {budget.categories && budget.categories.length > 0 ? (
                            <ul className="space-y-4">
                                {budget.categories.map(category => (
                                    <li key={category.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 transform transition-transform hover:scale-[1.01] duration-200">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-2">{category.name}</h4>
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
                    {/* Product Allocations Section */}
                    <section className="mb-8 p-6 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 flex justify-between items-center">
                            Product Allocations
                            <div className="flex items-center space-x-3"> {/* Use flex to align buttons */}
                                {/* Toggle Button */}
                                <button
                                    onClick={toggleView}
                                    className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out shadow-md"
                                    aria-pressed={isTableView}
                                >
                                    Switch to {isTableView ? 'Card View' : 'Table View'}
                                </button>

                                {/* Add Product Allocation Button */}
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out shadow-md transform hover:scale-105"
                                >
                                    Add Product Allocation
                                </button>
                            </div>
                        </h3>

                        {budget?.budgetItems && budget?.budgetItems.length > 0 ? (
                            isTableView ? (
                                // Table View
                                <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 text-xs lg:text-base">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th scope="col" className="lg:px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Item Name</th>
                                                <th scope="col" className="lg:px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Allocated</th>
                                                <th scope="col" className="lg:px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Remaining</th>
                                                <th scope="col" className="lg:px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Days Left</th>
                                                <th scope="col" className="lg:px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {budget.budgetItems.map(item => (
                                                <AllocatedItem
                                                    key={item.budgetItemId}
                                                    item={item}
                                                    budgetId={budgetId}
                                                    handleEditProductClick={handleEditProductClick}
                                                    handleDeleteProduct={handleDeleteProduct}
                                                    formatDate={formatDate}
                                                    isTableView={true} // Pass true for table view
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                // Card View (Original)
                                <ul className="space-y-3">
                                    {budget.budgetItems.map(item => (
                                        <AllocatedItem
                                            key={item.budgetItemId}
                                            item={item}
                                            budgetId={budgetId}
                                            handleEditProductClick={handleEditProductClick}
                                            handleDeleteProduct={handleDeleteProduct}
                                            formatDate={formatDate}
                                            isTableView={false} // Pass false for card view
                                        />
                                    ))}
                                </ul>
                            )
                        ) : (
                            <p className="text-gray-600 text-center py-4">No product allocations in this budget. Click "Add Product Allocation" to start!</p>
                        )}
                    </section>


                </div>



            </div>


            {/* all the products */}
            {/* Product List */}
            <>
                {products?.length === 0 ? (
                    <p className="text-center text-gray-600 p-4">No products found. Add a new one!</p>
                ) : (
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Select an item to add to your budget:</h3>

                        {/* --- Search Input Field --- */}
                        <div className="mb-6"> {/* Margin bottom for spacing */}
                            <input
                                type="text"
                                placeholder="Search products by name..."
                                value={searchTerm} // Bind value to state
                                onChange={(e) => setSearchTerm(e.target.value)} // Update state on change
                                className="
                        w-full p-3 border border-gray-300 rounded-lg shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                        text-gray-800 placeholder-gray-500
                    "
                            />
                        </div>
                        {/* --- End Search Input Field --- */}

                        {/* Filter products based on searchTerm */}
                        {(() => {
                            const filteredProducts = products.filter(product =>
                                product.item_name.toLowerCase().includes(searchTerm.toLowerCase())
                                // You can add more fields to search, e.g.:
                                // || product.category_id.toLowerCase().includes(searchTerm.toLowerCase())
                                // || product.subcategory_id.toLowerCase().includes(searchTerm.toLowerCase())
                            );

                            if (filteredProducts.length === 0 && searchTerm !== '') {
                                return (
                                    <p className="text-center text-gray-600 p-4">No matching products found for "{searchTerm}".</p>
                                );
                            }

                            return (
                                // Product Grid/Flex Container
                                <div className="flex flex-wrap gap-2">
                                    {filteredProducts.map((product, idx) => (
                                        <div
                                            key={product._id}
                                            onClick={() => {
                                                setShowAddProductModal(true);
                                                handleSelectProduct(product);
                                            }}
                                            className="
                                    bg-white rounded-lg shadow-md p-4 cursor-pointer
                                    hover:bg-blue-50 hover:shadow-lg transition-all duration-200
                                    border border-gray-200 hover:border-blue-300
                                    flex flex-col justify-between
                                "
                                        >
                                            <div>
                                                <h4 className="text-md font-bold text-gray-900 mb-1">
                                                    {idx + 1}. {product.item_name}
                                                </h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </>


            {/* Add/Edit Product Allocation Modal */}
            {showAddProductModal && (
                <IncludeProductModal
                    editingBudgetItem={editingBudgetItem}
                    handleAddProductSubmit={handleAddProductSubmit}
                    handleUpdateProductSubmit={handleUpdateProductSubmit}
                    loading={loading}
                    isManualAllocation={isManualAllocation}
                    setIsManualAllocation={setIsManualAllocation}
                    manualAllocatedAmount={manualAllocatedAmount}
                    setManualAllocatedAmount={setManualAllocatedAmount}
                    allocatedQuantity={allocatedQuantity}
                    setAllocatedQuantity={setAllocatedQuantity}
                    budgetItemNotes={budgetItemNotes}
                    setBudgetItemNotes={setBudgetItemNotes}
                    setShowAddProductModal={setShowAddProductModal}
                    setEditingBudgetItem={setEditingBudgetItem}
                    filteredProducts={filteredProducts}
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                />
            )}
        </>
    );
}

export default BudgetDetails;