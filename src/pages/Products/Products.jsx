// src/components/ProductCards.jsx
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {  toast } from 'react-toastify';

function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // To populate category dropdowns
  const [loading, setLoading] = useState(true);
  const [apiInProgress, setApiInProgress] = useState(false);

  // State for Add New Product Form
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProductData, setNewProductData] = useState({
    id: '',
    item_name: '',
    unit: '',
    quantity: 0,
    price: 0,
    date: new Date().toISOString().slice(0, 10), // Default to current date
    category_id: '',
    subcategory_id: '',
    notes: '',
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // --- API Call Functions ---

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response?.data?.data || []);
      toast.success('Products loaded successfully!');
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error(error.response?.data?.message || 'Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
      setCategories(response?.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch categories for dropdowns:', error);
      toast.error('Failed to load categories for forms. Please check your backend.');
    }
  };

  const addProduct = async (productData) => {
    setApiInProgress(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/products`, productData);
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

  // --- Data Fetch on Mount ---
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // --- Event Handlers for Add Form ---
  const handleAddProductClick = () => {
    setShowAddProductForm(true);
    setNewProductData({
      id: '', item_name: '', unit: '', quantity: 0, price: 0,
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
    if (!newProductData.id || !newProductData.item_name || !newProductData.unit ||
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

  // Filter subcategories based on selected category for forms
  const getFilteredSubcategories = (categoryId) => {
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    return selectedCategory ? selectedCategory.subcategories : [];
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center text-gray-700 text-xl">
        Loading products...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-4xl">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-gray-800">Products Overview</h2>
          <button
            onClick={() => navigate('/categories')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
            disabled={apiInProgress}
          >
            ← Back to Categories
          </button>
        </div>

        {/* Add New Product Button / Form */}
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
                  <label htmlFor="newProductId" className="block text-sm font-medium text-gray-700">ID (Unique)</label>
                  <input
                    type="text"
                    id="newProductId"
                    name="id"
                    value={newProductData.id}
                    onChange={handleNewProductChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    required
                    disabled={apiInProgress}
                  />
                </div>
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
                  <label htmlFor="newQuantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    id="newQuantity"
                    name="quantity"
                    value={newProductData.quantity}
                    onChange={handleNewProductChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    required
                    min="0"
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
                    {categories.map(cat => (
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

        {/* Product Cards Grid */}
        {products.length === 0 ? (
          <p className="text-center text-gray-600">No products found. Add a new one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.item_name}</h3>
                  <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">ID:</span> {product.id}
                  </p>
                  <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">Category:</span> {categories.find(c => c.id === product.category_id)?.name || product.category_id}
                  </p>
                  <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">Subcategory:</span> {getFilteredSubcategories(product.category_id).find(s => s.id === product.subcategory_id)?.name || product.subcategory_id}
                  </p>
                  <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">Quantity:</span> {product.quantity} {product.unit}
                  </p>
                  <p className="text-gray-700 text-sm mb-1">
                    <span className="font-semibold">Price/Unit:</span> ${product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-gray-700 text-sm mb-3">
                    <span className="font-semibold">Total Cost:</span> <span className="text-green-700 font-bold">${product.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                  <p className="text-gray-700 text-sm mb-3">
                    <span className="font-semibold">Date:</span> {product.date}
                  </p>
                  {product.notes && (
                    <p className="text-gray-600 text-xs italic mb-3">
                      <span className="font-semibold">Notes:</span> {product.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/products/details/${product.id}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out w-full mt-4"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
