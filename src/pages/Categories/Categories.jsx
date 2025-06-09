import axios from 'axios';
import React, { useState, useEffect } from 'react';

function Categories() {
  const [categoryData, setCategoryData] = useState(null); // Initialize as null to indicate loading
  const [loading, setLoading] = useState(true);
  const [editingMainCategory, setEditingMainCategory] = useState(false);
  const [currentMainCategory, setCurrentMainCategory] = useState({ name: '', color: '' });
  const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);
  const [apiInProgress, setApiInProgress] = useState(false); // State to disable buttons during API calls
  const [errorMessage, setErrorMessage] = useState(''); // State for user-facing error messages

  // --- API Endpoints ---
  // In a real application, adjust these URLs to match your backend.
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Assume empty string for relative paths, or define your backend URL

  const fetchCategory = async () => {
    setErrorMessage('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/utilities/categories`);
      const data = response?.data?.data;
      setCategoryData(data);
      console.log(data);
      // Adjust data structure if your API returns the _id as a string directly, not an object
      if (data._id && typeof data._id === 'object' && data._id.$oid) {
        data._id = data._id.$oid; // Normalize _id for simpler use
      }
      setCategoryData(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch category data:", error);
      setErrorMessage("Failed to load category data. Please try again.");
      throw error; // Re-throw to be caught by the useEffect caller
    }
  };

  const updateMainCategory = async (categoryId, updatedData) => {
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/utilities/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Assuming successful update means the backend returned the updated data or a success message
      // For simplicity, we'll re-fetch the data to ensure consistency.
      await fetchCategory(); // Re-fetch to update state
      return { success: true };
    } catch (error) {
      console.error("Failed to update main category:", error);
      setErrorMessage("Failed to save main category. Please try again.");
      throw error;
    }
  };

  const updateSubcategory = async (categoryId, subId, updatedSub) => {
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/utilities/categories/${categoryId}/subcategories/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSub)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchCategory(); // Re-fetch to update state
      return { success: true };
    } catch (error) {
      console.error("Failed to update subcategory:", error);
      setErrorMessage("Failed to save subcategory. Please try again.");
      throw error;
    }
  };

  const addSubcategory = async (categoryId, newSub) => {
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/utilities/categories/${categoryId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchCategory(); // Re-fetch to update state including the new subcategory
      return { success: true };
    } catch (error) {
      console.error("Failed to add subcategory:", error);
      setErrorMessage("Failed to add subcategory. Please try again.");
      throw error;
    }
  };

  const deleteSubcategory = async (categoryId, subId) => {
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/utilities/categories/${categoryId}/subcategories/${subId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchCategory(); // Re-fetch to update state after deletion
      return { success: true };
    } catch (error) {
      console.error("Failed to delete subcategory:", error);
      setErrorMessage("Failed to delete subcategory. Please try again.");
      throw error;
    }
  };

  // --- Initial Data Fetch ---
  useEffect(() => {
    const loadCategory = async () => {
      setLoading(true);
      try {
        await fetchCategory();
      } catch (error) {
        // Error already logged and message set in fetchCategory
      } finally {
        setLoading(false);
      }
    };
    loadCategory();
  }, []);

  // Effect to synchronize currentMainCategory when editingMainCategory changes
  useEffect(() => {
    if (editingMainCategory && categoryData) {
      setCurrentMainCategory({
        name: categoryData?.name,
        color: categoryData?.color
      });
    }
  }, [editingMainCategory, categoryData]);

  // Effect to synchronize currentSubcategory when editingSubcategoryId changes
  useEffect(() => {
    if (editingSubcategoryId && categoryData) {
      const sub = categoryData?.subcategories.find(s => s.id === editingSubcategoryId);
      if (sub) {
        setCurrentSubcategory({ ...sub }); // Create a copy to edit
      }
    } else {
      setCurrentSubcategory(null);
    }
  }, [editingSubcategoryId, categoryData?.subcategories]); // Use optional chaining for safety

  // Handler for main category edit
  const handleEditMainCategory = () => {
    setEditingMainCategory(true);
  };

  const handleSaveMainCategory = async () => {
    setApiInProgress(true);
    if (!categoryData?._id) {
      setErrorMessage("Error: Category ID not available for update.");
      setApiInProgress(false);
      return;
    }
    try {
      // Assuming _id is now normalized to a string or directly available
      await updateMainCategory(categoryData?._id, { name: currentMainCategory.name, color: currentMainCategory.color });
      setEditingMainCategory(false);
    } catch (error) {
      // Error already handled and message set in updateMainCategory
    } finally {
      setApiInProgress(false);
    }
  };

  const handleCancelEditMainCategory = () => {
    setEditingMainCategory(false);
  };

  const handleMainCategoryChange = (e) => {
    const { name, value } = e.target;
    setCurrentMainCategory(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handlers for subcategory edit/delete
  const handleEditSubcategory = (subId) => {
    setEditingSubcategoryId(subId);
  };

  const handleSaveSubcategory = async () => {
    if (currentSubcategory && categoryData?._id) {
      setApiInProgress(true);
      try {
        await updateSubcategory(categoryData?._id, currentSubcategory.id, currentSubcategory);
        setEditingSubcategoryId(null);
      } catch (error) {
        // Error already handled and message set in updateSubcategory
      } finally {
        setApiInProgress(false);
      }
    } else {
      setErrorMessage("Error: Subcategory data or Category ID missing for save.");
    }
  };

  const handleCancelEditSubcategory = () => {
    setEditingSubcategoryId(null);
    setCurrentSubcategory(null);
  };

  const handleDeleteSubcategory = async (subId) => {
    if (categoryData?._id) {
      setApiInProgress(true);
      try {
        await deleteSubcategory(categoryData?._id, subId);
      } catch (error) {
        // Error already handled and message set in deleteSubcategory
      } finally {
        setApiInProgress(false);
      }
    } else {
      setErrorMessage("Error: Category ID missing for delete.");
    }
  };

  const handleSubcategoryChange = (e) => {
    const { name, value } = e.target;
    setCurrentSubcategory(prevState => ({
      ...prevState,
      [name]: name === 'monthly_limit' ? Number(value) : value
    }));
  };

  const handleAddSubcategory = async () => {
    if (!categoryData?._id) {
      setErrorMessage("Error: Category ID missing for adding subcategory.");
      return;
    }
    const newId = `new_sub_${Date.now()}`; // Simple unique ID
    const newSub = {
      id: newId,
      name: 'New Subcategory',
      icon: 'question', // Default icon
      color: '#CCCCCC', // Default color
      monthly_limit: 0
    };

    setApiInProgress(true);
    try {
      await addSubcategory(categoryData?._id, newSub);
      setEditingSubcategoryId(newId); // Immediately go into edit mode for the new subcategory
    } catch (error) {
      // Error already handled and message set in addSubcategory
    } finally {
      setApiInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center text-gray-700 text-xl">
        Loading category data...
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center text-red-500 text-xl text-center">
        Error: Could not load category data. Please check your network connection or API endpoint.
        {errorMessage && <p className="text-sm mt-2">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-2xl">
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{errorMessage}</span>
          </div>
        )}

        {/* Main Category Section */}
        <div className="border-b pb-4 mb-4 flex items-center justify-between">
          {editingMainCategory ? (
            <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2">
              <input
                type="text"
                name="name"
                value={currentMainCategory.name}
                onChange={handleMainCategoryChange}
                className="p-2 border border-gray-300 rounded-md flex-grow"
                placeholder="Category Name"
                disabled={apiInProgress}
              />
              <input
                type="color"
                name="color"
                value={currentMainCategory.color}
                onChange={handleMainCategoryChange}
                className="p-1 border border-gray-300 rounded-md w-12 h-10"
                title="Pick a color"
                disabled={apiInProgress}
              />
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  onClick={handleSaveMainCategory}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                  disabled={apiInProgress}
                >
                  {apiInProgress ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEditMainCategory}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                  disabled={apiInProgress}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center w-full justify-between">
              <h2 className="text-3xl font-extrabold flex items-center gap-3">
                <i className={`fa-solid fa-${categoryData?.icon}`} style={{ color: categoryData?.color }}></i>
                {categoryData?.name}
              </h2>
              <button
                onClick={handleEditMainCategory}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                disabled={apiInProgress}
              >
                Edit Main
              </button>
            </div>
          )}
        </div>

        {/* Subcategories Section */}
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">Subcategories:</h3>
        <div className="space-y-4">
          {categoryData?.subcategories?.map(sub => (
            <div
              key={sub.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200"
            >
              {editingSubcategoryId === sub.id ? (
                <div className="flex flex-col w-full gap-2">
                  <input
                    type="text"
                    name="name"
                    value={currentSubcategory?.name || ''}
                    onChange={handleSubcategoryChange}
                    className="p-2 border border-gray-300 rounded-md"
                    placeholder="Subcategory Name"
                    disabled={apiInProgress}
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      name="icon"
                      value={currentSubcategory?.icon || ''}
                      onChange={handleSubcategoryChange}
                      className="p-2 border border-gray-300 rounded-md flex-grow"
                      placeholder="Font Awesome Icon (e.g., 'utensils')"
                      disabled={apiInProgress}
                    />
                    <input
                      type="color"
                      name="color"
                      value={currentSubcategory?.color || '#000000'}
                      onChange={handleSubcategoryChange}
                      className="p-1 border border-gray-300 rounded-md w-12 h-10"
                      title="Pick a color"
                      disabled={apiInProgress}
                    />
                    <input
                      type="number"
                      name="monthly_limit"
                      value={currentSubcategory?.monthly_limit || 0}
                      onChange={handleSubcategoryChange}
                      className="p-2 border border-gray-300 rounded-md w-32"
                      placeholder="Monthly Limit"
                      disabled={apiInProgress}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveSubcategory}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                      disabled={apiInProgress}
                    >
                      {apiInProgress ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEditSubcategory}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out"
                      disabled={apiInProgress}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-grow flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="flex items-center gap-2 text-xl font-medium">
                    <i className={`fa-solid fa-${sub.icon}`} style={{ color: sub.color }}></i>
                    {sub.name}
                  </span>
                  <span className="text-gray-600 text-sm sm:text-base">
                    Limit: <span className="font-semibold">${sub.monthly_limit.toLocaleString()}</span>
                  </span>
                </div>
              )}
              {!editingSubcategoryId && ( // Only show buttons if not editing any subcategory
                <div className="flex gap-2 mt-3 sm:mt-0">
                  <button
                    onClick={() => handleEditSubcategory(sub.id)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-xl shadow-md transition duration-300 ease-in-out text-sm"
                    disabled={apiInProgress}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSubcategory(sub.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-xl shadow-md transition duration-300 ease-in-out text-sm"
                    disabled={apiInProgress}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Subcategory Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleAddSubcategory}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition duration-300 ease-in-out hover:scale-105"
            disabled={apiInProgress}
          >
            {apiInProgress ? 'Adding...' : 'Add New Subcategory'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Categories;
