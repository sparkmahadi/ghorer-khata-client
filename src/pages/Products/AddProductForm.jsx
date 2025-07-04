import axios from 'axios';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

const AddProductForm = ({ apiInProgress, fetchProducts, setApiInProgress, getFilteredSubcategories, categories }) => {
    // State for Add New Product Form
    const [showAddProductForm, setShowAddProductForm] = useState(false);
    const [newProductData, setNewProductData] = useState({
        item_name: '',
        unit: '',
        price: 0,
        date: new Date().toISOString().slice(0, 10), // Default to current date
        category_id: '',
        subcategory_id: '',
        notes: '',
    });

    // --- Event Handlers for Add Form ---
    const handleAddProductClick = () => {
        setShowAddProductForm(true);
        setNewProductData({
            item_name: '', unit: '', price: 0,
            date: new Date().toISOString().slice(0, 10), category_id: '', subcategory_id: '', notes: ''
        });
    };

    const handleNewProductChange = (e) => {
        const { name, value } = e.target;
        setNewProductData(prevState => ({
            ...prevState,
            [name]: (name === 'quantity' || name === 'price') ? Number(value) : value
        }));
    };

    const handleNewProductSubmit = async (e) => {
        e.preventDefault();
        if (!newProductData.item_name || !newProductData.unit ||
            newProductData.quantity < 0 || newProductData.price < 0 || !newProductData.date ||
            !newProductData.category_id || !newProductData.subcategory_id) {
            toast.error("Please fill all required fields and ensure quantity/price are valid numbers.");
            return;
        }
        await addProduct(newProductData);
    };

    const handleCancelAddProduct = () => {
        setShowAddProductForm(false);
    };

    const addProduct = async (productData) => {
        setApiInProgress(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/products`, productData);
            console.log(response);
            toast.success('Product added successfully!');
            await fetchProducts(); // Re-fetch to update the list
            setShowAddProductForm(false); // Hide the form on success
            setNewProductData({ // Reset form
                id: '', item_name: '', unit: '', quantity: 0, price: 0,
                date: new Date().toISOString().slice(0, 10), category_id: '', subcategory_id: '', notes: ''
            });
            return { success: true };
        } catch (error) {
            console.error('Failed to add product:', error);
            toast.error(error.response?.data?.message || 'Failed to add product. Please try again.');
            throw error;
        } finally {
            setApiInProgress(false);
        }
    };
    return (
        <div className="mb-6 border-b pb-4">
            {!showAddProductForm ? (
                <button
                    onClick={handleAddProductClick}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out w-full"
                    disabled={apiInProgress}
                >
                    Add New Product
                </button>
            ) : (
                <form onSubmit={handleNewProductSubmit} className="space-y-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                    <h3 className="text-xl font-semibold mb-2">New Product Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="newItemName" className="block text-sm font-medium text-gray-700">Item Name</label>
                            <input
                                type="text"
                                id="newItemName"
                                name="item_name"
                                value={newProductData.item_name}
                                onChange={handleNewProductChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                required
                                disabled={apiInProgress}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="newUnit" className="block text-sm font-medium text-gray-700">Unit</label>
                            <input
                                type="text"
                                id="newUnit"
                                name="unit"
                                value={newProductData.unit}
                                onChange={handleNewProductChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="e.g., kg, pcs, liter"
                                required
                                disabled={apiInProgress}
                            />
                        </div>
                        <div>
                            <label htmlFor="newPrice" className="block text-sm font-medium text-gray-700">Price per Unit ($)</label>
                            <input
                                type="number"
                                id="newPrice"
                                name="price"
                                value={newProductData.price}
                                onChange={handleNewProductChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                required
                                min="0"
                                step="0.01"
                                disabled={apiInProgress}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="newDate" className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                id="newDate"
                                name="date"
                                value={newProductData.date}
                                onChange={handleNewProductChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                required
                                disabled={apiInProgress}
                            />
                        </div>
                        <div>
                            <label htmlFor="newCategoryId" className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                id="newCategoryId"
                                name="category_id"
                                value={newProductData.category_id}
                                onChange={handleNewProductChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                required
                                disabled={apiInProgress}
                            >
                                <option value="">Select Category</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="newSubcategoryId" className="block text-sm font-medium text-gray-700">Subcategory</label>
                            <select
                                id="newSubcategoryId"
                                name="subcategory_id"
                                value={newProductData.subcategory_id}
                                onChange={handleNewProductChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                required
                                disabled={apiInProgress || !newProductData.category_id}
                            >
                                <option value="">Select Subcategory</option>
                                {getFilteredSubcategories(newProductData.category_id).map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="newNotes" className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                            id="newNotes"
                            name="notes"
                            value={newProductData.notes}
                            onChange={handleNewProductChange}
                            rows="2"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            disabled={apiInProgress}
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                            disabled={apiInProgress}
                        >
                            {apiInProgress ? 'Adding...' : 'Create Product'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelAddProduct}
                            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                            disabled={apiInProgress}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AddProductForm;