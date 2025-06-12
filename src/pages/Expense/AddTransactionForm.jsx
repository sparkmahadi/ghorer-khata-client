import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import SelectProductForExpense from './SelectProductForExpense';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router';
import { createTransaction } from '../../api/budgetService';

function AddTransactionForm() {
    const {userInfo, loading: Authloading ,isAuthenticated} = useAuth();
    const {budgetId} = useParams();
    const [itemName, setItemName] = useState('');
    const [amount, setAmount] = useState(0);
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`);
            setProducts(response?.data?.data || []);
            toast.success('Products loaded successfully!');
        } catch (error) {
            console.error('Failed to fetch products:', error);
            toast.error(error.response?.data?.message || 'Failed to load products. Please try again.');
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/categories`);
            setCategories(response?.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch categories for dropdowns:', error);
            toast.error('Failed to load categories for forms. Please check your backend.');
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Effect to reset selected subcategory if the selected category becomes invalid
    useEffect(() => {
        const currentCategory = categories?.find(cat => cat.id === selectedCategoryId);
        if (!currentCategory || (currentCategory.subcategories && !currentCategory.subcategories.find(sub => sub.id === selectedSubcategoryId))) {
            setSelectedSubcategoryId('');
        }
    }, [selectedCategoryId, categories, selectedSubcategoryId]);

    useEffect(() => {
        if (price && quantity) {
            setAmount(price * quantity);
        }
    }, [price, quantity]);


    const handleCategoryChange = (e) => {
        setSelectedCategoryId(e.target.value);
        setSelectedSubcategoryId(''); // Reset subcategory when category changes
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

        try {
            const newTransactionData = {
                budgetId,
                userId: userInfo._id,
                username: userInfo.name,
                itemName,
                price: parseFloat(price),
                quantity: parseFloat(quantity),
                amount: parseFloat(amount),
                transactionDate: new Date(transactionDate).toISOString(),
                categoryId: selectedCategoryId,
                subcategoryId: selectedSubcategory ? selectedSubcategory.id : undefined,
                notes,
                transactionType: 'expense' // Assuming all added via this form are expenses
            };
            console.log(newTransactionData);
            await createTransaction(newTransactionData, budgetId);
            alert('Transaction added successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter subcategories based on selected category for forms
    const getFilteredSubcategories = (categoryId) => {
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        return selectedCategory ? selectedCategory.subcategories : [];
    };

    const currentCategory = categories.find(cat => cat.id === selectedCategoryId);
    const subcategories = currentCategory ? currentCategory.subcategories || [] : [];


    return (
        <div className='flex justify-center max-w-5xl mx-auto'>
            {/* form transaction */}
            <div className=''>
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4 max-w-md mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-100">
                    {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
                    <label className="block">
                        <span className="text-gray-700 font-medium">Item Name:</span>
                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        />
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-medium">Price:</span>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            step="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        />
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-medium">Quantity:</span>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            step="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        />
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-medium">Amount:</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        />
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-medium">Date:</span>
                        <input
                            type="date"
                            value={transactionDate}
                            onChange={(e) => setTransactionDate(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        />
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-medium">Category:</span>
                        <select
                            value={selectedCategoryId}
                            onChange={handleCategoryChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </label>
                    {selectedCategoryId && subcategories.length > 0 && (
                        <label className="block">
                            <span className="text-gray-700 font-medium">Subcategory:</span>
                            <select
                                value={selectedSubcategoryId}
                                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                            >
                                <option value="">-- Select Subcategory (Optional) --</option>
                                {subcategories.map(subcat => (
                                    <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                                ))}
                            </select>
                        </label>
                    )}
                    <label className="block">
                        <span className="text-gray-700 font-medium">Notes:</span>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        ></textarea>
                    </label>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add Transaction'}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            <div>
                Products
                <div className="">
                    <SelectProductForExpense
                        products={products} categories={categories} getFilteredSubcategories={getFilteredSubcategories} setItemName={setItemName}
                        setSelectedCategoryId={setSelectedCategoryId} setSelectedSubcategoryId={setSelectedSubcategoryId} budgetId={budgetId}
                    />
                </div>
            </div>
        </div>
    );
}

export default AddTransactionForm;