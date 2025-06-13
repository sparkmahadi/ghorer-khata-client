import React, { useState, } from 'react';
import { useNavigate } from 'react-router';

function SelectProductForCon({ products, setProductId, setUnit, setNotes, setItem_name }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [apiInProgress, setApiInProgress] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    const handleSelectToTransact = (pd) => {
        setProductId(pd.id);
        setUnit(pd.unit);
        setNotes(pd.notes);
        setItem_name(pd.item_name);
    };

    const filteredProducts = products.filter(product =>
        product.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 bg-white rounded-xl shadow-lg">
                <p className="text-gray-600 text-lg animate-pulse">Loading products...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <h2 className="text-3xl font-extrabold text-gray-800">Product List</h2>
                <button
                    onClick={() => navigate('/categories')}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    disabled={apiInProgress}
                >
                    ← Back to Categories
                </button>
            </div>

            {/* Search Input Field */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search products by name, category, or subcategory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-150 ease-in-out"
                />
            </div>

            {/* Product List */}
            {filteredProducts.length === 0 ? (
                <div className="text-center text-gray-600 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-lg">No products found matching your search criteria.</p>
                    <p className="text-sm mt-2">Try a different search term or add new products.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item Name</th>
                                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Qty {filteredProducts[0]?.unit ? `(${filteredProducts[0]?.unit})` : ''}
                                </th>
                                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                                <th className="py-3 px-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                    <td className="py-3.5 px-5 font-medium text-gray-900">{product.item_name}</td>
                                    <td className="py-3.5 px-5 text-gray-700">{product.quantity} {product.unit || ''}</td>
                                    <td className="py-3.5 px-5 text-gray-700">${product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="py-3.5 px-5 flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleSelectToTransact(product)}
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-1.5 px-3 rounded-lg shadow-sm text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                                            disabled={apiInProgress}
                                        >
                                            Select
                                        </button>
                                        <button
                                            onClick={() => navigate(`/budgets/${budgetId}`)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-1.5 px-3 rounded-lg shadow-sm text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
                                            disabled={apiInProgress}
                                        >
                                            Add To Budget
                                        </button>
                                        <button
                                            onClick={() => navigate(`/products/details/${product.id}`)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1.5 px-3 rounded-lg shadow-sm text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                                            disabled={apiInProgress}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default SelectProductForCon;