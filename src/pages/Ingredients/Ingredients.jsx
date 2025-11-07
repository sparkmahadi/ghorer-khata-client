import React, { useState, useEffect, useCallback } from "react";
import API from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Icons for better visual context
const PlusIcon = "➕";
const TrashIcon = "🗑️";
const EditIcon = "✏️";
const SaveIcon = "💾";
const CloseIcon = "❌";
const FoodIcon = "🥦";
const PriceIcon = "💰";

// Standardized list of units for better data consistency
const UNIT_OPTIONS = [
  "g", "kg", "ml", "L", "tsp", "tbsp", "cup", "unit", "pack"
];

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editIngredient, setEditIngredient] = useState(null);
  
  // === Updated formData structure to include price ===
  const [formData, setFormData] = useState({
    name: "",
    unit: UNIT_OPTIONS[0],
    defaultPerPerson: 1, 
    price: 0, // New field for price
  });

  // Reusable function to fetch ingredients
  const fetchIngredients = useCallback(async () => {
    try {
      const res = await API.get("/ingredients");
      if (res.data.success) {
        setIngredients(res.data.data);
      } else {
        toast.error(res.data.message || "Failed to fetch ingredients");
      }
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      toast.error("Failed to fetch ingredients");
    }
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // === Modal & Form Handlers ===
  const resetForm = () => {
    setEditIngredient(null);
    // Resetting form to include the new price field
    setFormData({ name: "", unit: UNIT_OPTIONS[0], defaultPerPerson: 1, price: 0 }); 
    setShowModal(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (ingredient) => {
    setEditIngredient(ingredient);
    setFormData({
      name: ingredient.name || "",
      unit: ingredient.unit || UNIT_OPTIONS[0],
      defaultPerPerson: ingredient.defaultPerPerson || 1, 
      price: ingredient.price || 0, // Loading existing price
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.unit) {
        toast.warn("Name and Unit are required.");
        return;
    }

    // Input validation for quantity and price
    const qty = parseFloat(formData.defaultPerPerson);
    const itemPrice = parseFloat(formData.price);

    if (isNaN(qty) || qty <= 0) {
        toast.warn("Quantity per person must be a positive number.");
        return;
    }
    if (isNaN(itemPrice) || itemPrice < 0) {
        toast.warn("Price per Unit must be a non-negative number.");
        return;
    }

    const payload = {
        name: formData.name.trim(),
        unit: formData.unit,
        defaultPerPerson: qty,
        price: itemPrice, // Adding price to the payload
    };

    try {
      let res;
      if (editIngredient) {
        // Update existing ingredient
        res = await API.put(`/ingredients/${editIngredient._id}`, payload);
        if (res.data.success) toast.success("Ingredient updated successfully! 👍");
        else toast.error(res.data.message || "Failed to update ingredient");
      } else {
        // Add new ingredient
        res = await API.post("/ingredients", payload);
        if (res.data.success) toast.success("Ingredient added successfully! 🎉");
        else toast.error(res.data.message || "Failed to add ingredient");
      }
      
      resetForm();
      fetchIngredients();
    } catch (error) {
      console.error("Error saving ingredient:", error);
      toast.error("Server error while saving ingredient");
    }
  };

  const deleteIngredient = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await API.delete(`/ingredients/${id}`);
      if (res.data.success) {
        toast.success("Ingredient deleted successfully");
        fetchIngredients();
      } else {
        toast.error(res.data.message || "Failed to delete ingredient");
      }
    } catch (error) {
      console.error("Error deleting ingredient:", error);
      toast.error("Server error while deleting ingredient");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* === Header and Add Button === */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-green-800 mb-4 sm:mb-0">{FoodIcon} Ingredient Management</h2>
          <button
              onClick={openAddModal}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
              {PlusIcon} Add New Ingredient
          </button>
      </header>
      
      {/* --- */}

      {/* === Ingredients Table (Responsive Overflow) === */}
      <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">All Ingredients</h3>
          <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          {/* Adjusted column widths for new Price column */}
                          <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">ID</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">Name</th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Unit</th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Default Qty/Person</th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Price / Unit</th> {/* New Header */}
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {ingredients.length === 0 ? (
                          <tr>
                              <td colSpan="6" className="py-4 text-center text-gray-500">No ingredients found. Please add one.</td>
                          </tr>
                      ) : (
                          ingredients.map((ing) => (
                              <tr key={ing._id} className="hover:bg-green-50/50 transition duration-150">
                                  <td className="hidden md:table-cell py-3 px-4 text-sm text-gray-500 truncate">{ing._id.slice(-6)}</td>
                                  <td className="py-3 px-4 font-medium text-gray-900">{ing.name}</td>
                                  <td className="py-3 px-4 text-center text-sm text-gray-600">{ing.unit}</td>
                                  <td className="py-3 px-4 text-center text-sm text-gray-600">{ing.defaultPerPerson}</td>
                                  {/* Display Price */}
                                  <td className="py-3 px-4 text-center text-sm text-gray-600 font-semibold">
                                    {PriceIcon} {parseFloat(ing.price || 0).toFixed(2)}
                                  </td> 
                                  <td className="py-3 px-4 text-center">
                                      <div className="flex justify-center gap-2">
                                          <button
                                              onClick={() => openEditModal(ing)}
                                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition"
                                              title="Edit Ingredient"
                                          >
                                              {EditIcon}
                                          </button>
                                          <button
                                              onClick={() => deleteIngredient(ing._id, ing.name)}
                                              className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition"
                                              title="Delete Ingredient"
                                          >
                                              {TrashIcon}
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </section>

      {/* --- */}

      {/* === Add/Edit Ingredient Modal (Enhanced) === */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 rounded-xl w-full max-w-md shadow-2xl relative">
            
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition"
              title="Close"
            >
              {CloseIcon}
            </button>
            
            <h3 className="text-xl sm:text-2xl font-bold text-green-700 mb-6 border-b pb-2">
              {editIngredient ? "✏️ Edit Ingredient" : "➕ Add New Ingredient"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rice, Chicken Breast, Onion"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-green-500 focus:border-green-500 transition"
                />
              </div>

              {/* Unit Dropdown (Select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="border border-gray-300 p-3 rounded-lg w-full bg-white appearance-none focus:ring-green-500 focus:border-green-500 transition"
                >
                    {UNIT_OPTIONS.map(unit => (
                        <option key={unit} value={unit}>
                            {unit} - {unit === 'unit' ? '(Count)' : ''}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    This unit will be used for calculations in meal plans.
                </p>
              </div>

              {/* Qty per Person Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Quantity per Person</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="1"
                  value={formData.defaultPerPerson}
                  onChange={(e) => setFormData({ ...formData, defaultPerPerson: e.target.value })}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-green-500 focus:border-green-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Enter the typical amount used for one serving (e.g., 150 for 150 grams of rice).
                </p>
              </div>
              
              {/* === New Price Input Field === */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per **Unit** ({formData.unit})</label>
                <div className="flex items-center">
                    {/* Assuming a currency display (e.g., $ or equivalent) */}
                    <span className="text-xl font-bold text-gray-600 mr-2">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="border border-gray-300 p-3 rounded-lg w-full focus:ring-green-500 focus:border-green-500 transition"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Cost of **one** unit of the ingredient (e.g., cost per 1 kg).
                </p>
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg w-full shadow-md transition duration-200"
              >
                {editIngredient ? `${SaveIcon} Update Ingredient` : `${PlusIcon} Add Ingredient`}
              </button>
              
            </form>
          </div>
        </div>
      )}
    </div>
  );
}