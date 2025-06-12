import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';

function SelectProductForExpense({categories, products, getFilteredSubcategories, setItemName, setSelectedSubcategoryId, setSelectedCategoryId, budgetId}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiInProgress, setApiInProgress] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleSelectToTransact = (pd) =>{
    setItemName(pd.item_name)
    setSelectedCategoryId(pd.category_id)
    setSelectedSubcategoryId(pd.subcategory_id)
  }

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
          <h2 className="text-3xl font-extrabold text-gray-800">Product List</h2>
          <button
            onClick={() => navigate('/categories')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
            disabled={apiInProgress}
          >
            ← Back to Categories
          </button>
        </div>

        {/* Product List */}
        {products.length === 0 ? (
          <p className="text-center text-gray-600">No products found. Add a new one!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Item Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Qty ({products[0]?.unit || 'Unit'})</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <>
                        <td className="py-3 px-4 font-medium text-gray-900">{product.item_name}</td>
                        <td className="py-3 px-4 text-gray-700">
                          <span className="block">{categories.find(c => c.id === product.category_id)?.name || product.category_id}</span>
                          <span className="text-sm text-gray-500">
                            ({getFilteredSubcategories(product.category_id).find(s => s.id === product.subcategory_id)?.name || product.subcategory_id})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{product.quantity} {product.unit}</td>
                        <td className="py-3 px-4 text-gray-700">${product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 flex gap-2">
                          <button
                            onClick={() => handleSelectToTransact(product)}
                            className="bg-green-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-xl shadow-md text-sm"
                            disabled={apiInProgress}
                          >
                            Select
                          </button>
                          <button
                            onClick={() => navigate(`/budgets/${budgetId}`)}
                            className="bg-green-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-xl shadow-md text-sm"
                            disabled={apiInProgress}
                          >
                            Add To Budget
                          </button>
                          <button
                            onClick={() => navigate(`/products/details/${product.id}`)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-xl shadow-md text-sm"
                            disabled={apiInProgress}
                          >
                            Edit
                          </button>
                        </td>
                      </>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectProductForExpense;
