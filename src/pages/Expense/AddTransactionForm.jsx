import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import SelectProductForExpense from './SelectProductForExpense';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router';
// Import both createTransaction and the new updateBudgetFromTransactionAPI
import { useProductsAndCategories } from '../../contexts/ProductAndCategoryContext';
import ConShortForm from './ConShortForm';
import { createTransaction } from '../../api/transactionService';
import { addBudgetItem, fetchBudgetById, updateBudgetFromTransactionAPI } from '../../api/budgetService';
import ProductSelectionModal from '../../components/Modals/ProductSelectionModal';
import IncludeProductModal from '../Budget/BudgetDetails/Components/IncludeProductModal';

function AddTransactionForm() {
    const { userInfo, loading: Authloading, isAuthenticated } = useAuth();
    const { products, categories } = useProductsAndCategories();
    const { budgetId } = useParams();
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

    const [message, setMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isProductModalOpen, setIsProductModalOpen] = useState(false); // State for the product selection modal
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    const [allocatedQuantity, setAllocatedQuantity] = useState(''); // Quantity for calculation
    const [manualAllocatedAmount, setManualAllocatedAmount] = useState(''); // Manual fixed amount
    const [isManualAllocation, setIsManualAllocation] = useState(false); // Toggle between quantity/manual
    const [budgetItemNotes, setBudgetItemNotes] = useState(''); // Notes for budget item

    const [editingBudgetItem, setEditingBudgetItem] = useState(null);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [confirmationDetails, setConfirmationDetails] = useState(null);


    useEffect(() => {
        const currentCategory = categories?.find(cat => cat.id === selectedCategoryId);
        if (!currentCategory || (currentCategory.subcategories && !currentCategory.subcategories.find(sub => sub.id === selectedSubcategoryId))) {
            setSelectedSubcategoryId('');
        }
    }, [selectedCategoryId, categories, selectedSubcategoryId]);

    useEffect(() => {
        if (price && quantity) {
            setAmount(parseFloat((price * quantity).toFixed(2))); // Ensure amount is rounded
        }
    }, [price, quantity]);

    useEffect(() => {
        if (budgetId) {
            getBudget(budgetId);
        }
    }, [budgetId]);

    const getBudget = async (budgetId) => {
        const fetchedBudget = await fetchBudgetById(budgetId);
        if (fetchedBudget) {
            setBudget(fetchedBudget);
        } else {
            toast.error("Budget is not found in DB")
        }
    }

    console.log("budget", budget);

    const handleCategoryChange = (e) => {
        setSelectedCategoryId(e.target.value);
        setSelectedSubcategoryId('');
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setProductId(product.id); // Assuming 'id' from product is the product_id
        setItemName(product.item_name);
        setPrice(product.price);
        setUnit(product.unit || '');
        setSelectedCategoryId(product.category_id || '');
        setSelectedSubcategoryId(product.subcategory_id || '');
        setQuantity(1);
        setIsProductModalOpen(false); // Close modal after selection
    };

    console.log(selectedProduct);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

        if (!selectedCategory) {
            setError('Please select a valid category.');
            setLoading(false);
            return;
        }

        const selectedSubcategory = selectedCategory.subcategories?.find(subcat => subcat.id === selectedSubcategoryId);

        // Data payload for both transaction creation and budget update
        const newTransactionData = {
            budgetId,
            userId: userInfo._id,
            username: userInfo.name,
            product_id,
            itemName,
            price: parseFloat(price),
            quantity: parseFloat(quantity),
            unit,
            amount: parseFloat(amount),
            transactionDate: new Date(transactionDate).toISOString(), // Ensure ISO string for consistency
            categoryId: selectedCategoryId,
            subcategoryId: selectedSubcategory ? selectedSubcategory.id : undefined,
            notes,
            transactionType: 'expense' // Explicitly set type for transaction
        };
        setConfirmationDetails(newTransactionData);

        try {
            console.log('Attempting to create transaction:', newTransactionData);

            // check if the item is allocated in the budget
            const itemExistsInBudget = budget.budgetItems.some(
                item => item.product_id === selectedProduct.id
            );

            if (!itemExistsInBudget) {
                const confirm = window.confirm("The product is not allocated with the selected budget. Do you want to allocate it first?")
                if (confirm) {
                    if (selectedProduct.id) {
                        setShowAddProductModal(true);
                    } else {
                        toast.error("Product is not found in master products")
                        setLoading(false);
                    }

                } else {
                    toast.info("Transaction cannot be linked without product allocation in selected budget")
                    setLoading(false);
                    return;
                }
            }

            // If item already exists in budget, or if user chose not to allocate and confirmed,
            // directly show the confirmation modal to proceed with transaction.
            // setShowConfirmationModal(true);

        } catch (err) {
            setError(err.message);
            // Improved error messaging
            const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred.';
            toast.error(`Operation failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
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
            await addBudgetItem(budgetId, itemData);
            setShowAddProductModal(false); // Close modal
            setSelectedProduct(null); // Clear selected product
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

    // --- NEW function to proceed with actual API call after confirmation ---
    const confirmAndExecuteBudgetLink = async () => {
        setShowConfirmationModal(false); // Close confirmation modal
        setLoading(true); // Set loading while executing the final actions

        try {
            // First, create the transaction record
            await createTransaction(confirmationDetails, budgetId);
            toast.success('Transaction added successfully!');

            // Then, if needed, update the budget
            const confirmAddToBudget = window.confirm("Do you want to update your budget with this transaction?");
            if (confirmAddToBudget) {
                console.log('Attempting to update budget:', confirmationDetails);
                const budgetUpdatePayload = {
                    product_id: confirmationDetails.product_id,
                    quantity: confirmationDetails.quantity,
                    price: confirmationDetails.price,
                    amount: confirmationDetails.amount,
                    transactionDate: confirmationDetails.transactionDate,
                    categoryId: confirmationDetails.categoryId,
                    subcategoryId: confirmationDetails.subcategory_id, // Use subcategory_id
                };

                await updateBudgetFromTransactionAPI(budgetId, budgetUpdatePayload);
                toast.success('Budget updated successfully!');
            }
        } catch (err) {
            setError(err.message);
            const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred.';
            toast.error(`Operation failed during transaction/budget update: ${errorMessage}`);
        } finally {
            setLoading(false);
            // Clear all form fields after successful submission and optional budget update
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
            setSelectedProduct(null);
            setConfirmationDetails(null); // Clear confirmation details
        }
    };

    const getFilteredSubcategories = (categoryId) => {
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        return selectedCategory ? selectedCategory.subcategories : [];
    };

    const currentCategory = categories.find(cat => cat.id === selectedCategoryId);
    const subcategories = currentCategory ? currentCategory.subcategories || [] : [];

    const filteredProducts = products.filter(
        (product) =>
            product.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.subcategory?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    // Loading/Auth checks (already in your component)
    if (Authloading) {
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

                    <button
                        type="button"
                        onClick={() => setIsProductModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm"
                    >
                        Select Product
                    </button>
                    {selectedProduct && (
                        <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Selected:</span> {selectedProduct.item_name} (Unit: {selectedProduct.unit}, ID: {selectedProduct._id})
                        </p>
                    )}
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
                            onChange={(e) => setAmount(e.target.value)}
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

                    {/* action buttons */}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            {loading ? 'Adding...' : 'Add Transaction'}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                                setItemName('');
                                setProductId(''); // Reset product_id
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
                            }}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                            Clear
                        </button>
                    </div>
                </form>

                {/* for adding consumption while adding expense */}
                {
                    itemName && selectedCategoryId && selectedSubcategoryId && product_id &&
                    <ConShortForm
                        itemName={itemName}
                        product_id={product_id}
                        unit={unit}
                        setUnit={setUnit}
                        setProductId={setProductId}
                    />
                }
            </div >


            {/* Product Selection Modal */}
            {
                isProductModalOpen && (
                    <ProductSelectionModal
                        setIsProductModalOpen={setIsProductModalOpen}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filteredProducts={filteredProducts}
                        selectedProduct={selectedProduct}
                        handleSelectProduct={handleSelectProduct}
                    />
                )
            }

            {/* modal for allocations if required */}
            {showAddProductModal && (
                <IncludeProductModal
                    editingBudgetItem={editingBudgetItem}
                    handleAddProductSubmit={handleAddProductSubmit}
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
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                    setShowConfirmationModal={setShowConfirmationModal}
                />
            )}



            {/* --- NEW Confirmation Modal before linking consumption to a budget --- */}
            {showConfirmationModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold text-gray-800">Confirm Action</h3>
                            <button
                                onClick={() => setShowConfirmationModal(false)}
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
                                onClick={() => setShowConfirmationModal(false)}
                                className="px-6 py-2.5 rounded-md font-semibold text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmAndExecuteBudgetLink(confirmationDetails.budgetId, confirmationDetails.planId, confirmationDetails.action)}
                                className="px-6 py-2.5 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                            >
                                {confirmationDetails.action === 'update' ? 'Confirm Update' : 'Confirm Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
}

export default AddTransactionForm;