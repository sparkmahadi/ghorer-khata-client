import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import SelectProductForExpense from './SelectProductForExpense';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router';
// Import both createTransaction and the new updateBudgetFromTransactionAPI
import { useProductsAndCategories } from '../../contexts/ProductAndCategoryContext';
import ConShortForm from './ConShortForm';
import { createTransaction } from '../../api/transactionService';
import { updateBudgetFromTransactionAPI } from '../../api/budgetService';

function AddTransactionForm() {
    const { userInfo, loading: Authloading, isAuthenticated } = useAuth();
    const { products, categories } = useProductsAndCategories();
    const { budgetId } = useParams();
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

    const handleCategoryChange = (e) => {
        setSelectedCategoryId(e.target.value);
        setSelectedSubcategoryId('');
    };

    const handleProductSelected = (product) => {
        setProductId(product.id); // Assuming 'id' from product is the product_id
        setItemName(product.item_name);
        setPrice(product.price);
        setUnit(product.unit || '');
        setSelectedCategoryId(product.category_id || '');
        setSelectedSubcategoryId(product.subcategory_id || '');
        setQuantity(1);
    };

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

        try {
            console.log('Attempting to create transaction:', newTransactionData);
            // First, create the transaction record (handled by your other controller)
            await createTransaction(newTransactionData, budgetId); // Assuming budgetId is needed here too
            toast.success('Transaction added successfully!');

            // --- New Logic for Budget Update ---
            const confirmAddToBudget = window.confirm("Do you want to update your budget with this transaction?");
            if (confirmAddToBudget) {
                console.log('Attempting to update budget:', newTransactionData);
                // Extract only the necessary fields for the budget update controller
                const budgetUpdatePayload = {
                    product_id: newTransactionData.product_id,
                    quantity: newTransactionData.quantity,
                    price: newTransactionData.price,
                    amount: newTransactionData.amount,
                    transactionDate: newTransactionData.transactionDate,
                    categoryId: newTransactionData.categoryId,
                    subcategoryId: newTransactionData.subcategoryId,
                };
                
                await updateBudgetFromTransactionAPI(budgetId, budgetUpdatePayload);
                toast.success('Budget updated successfully!');
            }
            // --- End New Logic ---


            // Clear form fields after successful submission and optional budget update
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

        } catch (err) {
            setError(err.message);
            // Improved error messaging
            const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred.';
            toast.error(`Operation failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredSubcategories = (categoryId) => {
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        return selectedCategory ? selectedCategory.subcategories : [];
    };

    const currentCategory = categories.find(cat => cat.id === selectedCategoryId);
    const subcategories = currentCategory ? currentCategory.subcategories || [] : [];

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

                    <div className="relative">
                        <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">Item Name:</label>
                        <input
                            type="text"
                            id="itemName"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out"
                            placeholder="e.g., Groceries, Rent"
                        />
                    </div>

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
                            readOnly // Often, amount is calculated, so making it read-only can prevent user input errors
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
            </div>

            {/* Products Component */}
            <div className='w-full lg:w-1/2 mt-8 lg:mt-0'>
                <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-6">Select Product for Expense</h2>
                <SelectProductForExpense
                    products={products}
                    categories={categories}
                    getFilteredSubcategories={getFilteredSubcategories}
                    setItemName={setItemName}
                    setSelectedCategoryId={setSelectedCategoryId}
                    setSelectedSubcategoryId={setSelectedSubcategoryId}
                    budgetId={budgetId}
                    onProductSelected={handleProductSelected}
                    setProductId={setProductId}
                />
            </div>

        </div>
    );
}

export default AddTransactionForm;