import React, { useState, useEffect, useCallback } from "react";
import API from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Icons for better visual context (using standard unicode characters)
const PlusIcon = "➕";
const TrashIcon = "🗑️";
const EditIcon = "✏️";
const SaveIcon = "💾";
const CloseIcon = "❌";

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("");
  const [editingMeal, setEditingMeal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  // Reusable function to fetch meals
  const fetchMeals = useCallback(async () => {
    try {
      const res = await API.get("/meals");
      setMeals(res.data.data);
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast.error("Failed to fetch meals");
    }
  }, []);

  // Reusable function to fetch ingredients
  const fetchIngredients = useCallback(async () => {
    try {
      const res = await API.get("/ingredients");
      setIngredients(res.data.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      toast.error("Failed to fetch ingredients");
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchMeals();
    fetchIngredients();
  }, [fetchMeals, fetchIngredients]);

  // === Ingredient Handlers ===
  const addIngredientToMeal = (ingredient) => {
    if (selectedIngredients.find((i) => i._id === ingredient._id)) {
      toast.info(`${ingredient.name} is already selected!`);
      return;
    }
    setSelectedIngredients((prev) => [
      ...prev,
      { ...ingredient, quantityPerPerson: ingredient.defaultPerPerson || 1 },
    ]);
  };

  const removeIngredient = (id) => {
    setSelectedIngredients((prev) => prev.filter((i) => i._id !== id));
  };

  const updateIngredientQuantity = (id, value) => {
    const newQty = Number(value);
    setSelectedIngredients((prev) =>
      prev.map((ing) =>
        ing._id === id
          ? { ...ing, quantityPerPerson: newQty }
          : ing
      )
    );
  };

  // === Meal Action Handlers ===
  const resetForm = () => {
    setName("");
    setSelectedIngredients([]);
    setEditingMeal(null);
    setSearchTerm("");
    setIsModalOpen(false);
  };

  const handleSubmitMeal = async () => {
    if (!name.trim() || selectedIngredients.length === 0) {
      toast.warn("Please enter a meal name and select ingredients.");
      return;
    }

    const mealData = {
      name,
      ingredients: selectedIngredients.map((i) => ({
        ingredientId: i._id,
        quantityPerPerson: i.quantityPerPerson,
      })),
    };

    try {
      if (editingMeal) {
        // Update existing meal
        await API.put(`/meals/${editingMeal._id}`, mealData);
        toast.success("Meal updated successfully!");
      } else {
        // Add new meal
        await API.post("/meals", mealData);
        toast.success("Meal added successfully!");
      }
      
      resetForm();
      fetchMeals();
    } catch (error) {
      console.error(`Error ${editingMeal ? 'updating' : 'adding'} meal:`, error);
      toast.error(`Failed to ${editingMeal ? 'update' : 'add'} meal`);
    }
  };

  const openEditModal = (meal) => {
    setEditingMeal(meal);
    setName(meal.name);
    
    // Map ingredients for editing, ensuring they have the full ingredient details
    const mappedIngredients = meal.ingredients
      .map((mi) => {
        const found = ingredients.find((ing) => ing._id === mi.ingredientId);
        return found
          ? {
              ...found,
              quantityPerPerson: mi.quantityPerPerson,
            }
          : null;
      })
      .filter(Boolean);

    setSelectedIngredients(mappedIngredients);
    setIsModalOpen(true);
  };

  const deleteMeal = async (id, mealName) => {
    if (!window.confirm(`Are you sure you want to delete the meal: "${mealName}"?`)) return;
    try {
      await API.delete(`/meals/${id}`);
      fetchMeals();
      toast.success("Meal deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete meal");
    }
  };

  // === Filter Ingredients by Search Term ===
  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Combine Add and Edit logic into one modal/form controlled by isModalOpen and editingMeal state
  const formTitle = editingMeal ? "✏️ Edit Meal" : "➕ Create New Meal";
  const submitButtonText = editingMeal ? `${SaveIcon} Save Changes` : `${PlusIcon} Add Meal`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header and Create Button */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 sm:mb-0">🍽️ Meal Management</h2>
          <button
              onClick={() => {
                resetForm(); // Ensure form is reset before opening for creation
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
          >
              {PlusIcon} Create New Meal
          </button>
      </header>

      <hr/>

      {/* === Meals Table (Responsive Overflow) === */}
      <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Existing Meals</h3>
          <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-100">
              {/* min-w-full ensures the table takes full width, even when content overflows */}
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          {/* Adjusted widths for better mobile display, hiding ID on small screens */}
                          <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">ID</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4/12 md:w-3/12">Meal Name</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12 md:w-6/12">Ingredients (Qty/Person)</th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {meals.length === 0 ? (
                          <tr>
                              <td colSpan="4" className="py-4 text-center text-gray-500">No meals created yet.</td>
                          </tr>
                      ) : (
                          meals.map((meal) => (
                              <tr key={meal._id} className="hover:bg-indigo-50/50 transition duration-150">
                                  <td className="hidden md:table-cell py-3 px-4 text-sm text-gray-500 truncate">{meal._id.slice(-6)}</td>
                                  <td className="py-3 px-4 font-medium text-gray-900">{meal.name}</td>
                                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                                      {/* Truncate long ingredient lists on small screens */}
                                      {meal.ingredients
                                          .map((i) => {
                                              const ingredientDetails = ingredients.find(ing => ing._id === i.ingredientId);
                                              const unit = ingredientDetails ? ingredientDetails.unit : 'unit';
                                              return `${ingredientDetails ? ingredientDetails.name : 'Unknown'} (${i.quantityPerPerson} ${unit})`;
                                          })
                                          .join(", ")}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                      <div className="flex justify-center gap-2">
                                          <button
                                              onClick={() => openEditModal(meal)}
                                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition"
                                              title="Edit Meal"
                                          >
                                              {EditIcon}
                                          </button>
                                          <button
                                              onClick={() => deleteMeal(meal._id, meal.name)}
                                              className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition"
                                              title="Delete Meal"
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

      {/* === Add/Edit Meal Modal (Responsive Structure) === */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* max-w-4xl on desktop, max-w-full on mobile, with responsive padding */}
          <div className="bg-white p-4 sm:p-8 rounded-xl w-full max-w-4xl space-y-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
            
              <button
                  onClick={resetForm}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition"
                  title="Close"
              >
                  {CloseIcon}
              </button>

            <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 border-b pb-2">{formTitle}</h3>

              {/* Meal Name Input */}
            <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Meal Name</label>
                <input
                    placeholder="e.g., Chicken Curry with Rice"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-gray-300 p-3 rounded-lg w-full text-base focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

              {/* Ingredient Selection and List Container (Stacked on mobile, side-by-side on large screens) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Ingredient Search & Select Panel */}
                  <div className="bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200 order-2 lg:order-1">
                      <h4 className="font-semibold text-lg text-gray-700 mb-3">Add Ingredients</h4>
                      <input
                          placeholder="Search Ingredients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="border border-gray-300 p-2 rounded-lg w-full mb-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />

                      {/* Adjust max height for vertical scrolling within the panel */}
                      <div className="space-y-2 max-h-40 sm:max-h-60 overflow-y-auto pr-2">
                          {filteredIngredients.map((ingredient) => (
                              <button
                                  key={ingredient._id}
                                  onClick={() => addIngredientToMeal(ingredient)}
                                  className={`w-full text-left p-2 rounded-md transition duration-150 text-sm flex justify-between items-center 
                                      ${selectedIngredients.some(i => i._id === ingredient._id) 
                                        ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed' 
                                        : 'bg-white hover:bg-indigo-50 border border-gray-200'}`
                                  }
                                  disabled={selectedIngredients.some(i => i._id === ingredient._id)}
                              >
                                  <span className="font-medium">{ingredient.name}</span>
                                  <span className="text-xs text-gray-500">({ingredient.unit}) {PlusIcon}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Selected Ingredients List */}
                  <div className="p-4 rounded-lg border border-indigo-200 order-1 lg:order-2">
                      <h4 className="font-semibold text-lg text-indigo-700 mb-3">Required Quantities</h4>
                      {selectedIngredients.length === 0 ? (
                          <p className="text-gray-500 text-sm">Select ingredients from the panel on the left.</p>
                      ) : (
                          <div className="overflow-x-auto max-h-40 sm:max-h-60">
                              <table className="min-w-full text-sm">
                                  <thead className="sticky top-0 bg-indigo-50">
                                      <tr>
                                          <th className="py-2 px-2 text-left font-medium text-indigo-700">Ingredient (Unit)</th>
                                          <th className="py-2 px-2 font-medium text-indigo-700 w-1/3">Qty/Person</th>
                                          <th className="py-2 px-2 font-medium text-indigo-700">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {selectedIngredients.map((i) => (
                                          <tr key={i._id} className="border-t hover:bg-indigo-50">
                                              <td className="py-2 px-2 font-medium text-gray-800 text-xs sm:text-sm">{i.name} ({i.unit})</td>
                                              <td className="py-2 px-2">
                                                  <input
                                                      type="number"
                                                      min="0"
                                                      step="0.01"
                                                      value={i.quantityPerPerson || ''}
                                                      onChange={(e) => updateIngredientQuantity(i._id, e.target.value)}
                                                      // Use a smaller width input on mobile
                                                      className="border border-gray-300 p-1 w-full max-w-[80px] sm:max-w-full rounded text-center text-xs sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                  />
                                              </td>
                                              <td className="py-2 px-2 text-center">
                                                  <button
                                                      onClick={() => removeIngredient(i._id)}
                                                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition"
                                                      title="Remove"
                                                  >
                                                      {TrashIcon}
                                                  </button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
              </div>

            {/* Action Buttons (Full width on mobile, right-aligned on desktop) */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t mt-4">
              <button
                onClick={resetForm}
                className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMeal}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition duration-200 disabled:opacity-50"
                  disabled={!name.trim() || selectedIngredients.length === 0}
              >
                {submitButtonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}