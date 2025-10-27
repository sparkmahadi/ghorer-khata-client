import React, { useState, useEffect } from "react";
import API from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("");
  const [editingMeal, setEditingMeal] = useState(null);

  // === Fetch Meals ===
  const fetchMeals = async () => {
    try {
      const res = await API.get("/meals");
      setMeals(res.data.data);
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast.error("Failed to fetch meals");
    }
  };

  // === Fetch Ingredients ===
  const fetchIngredients = async () => {
    try {
      const res = await API.get("/ingredients");
      setIngredients(res.data.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      toast.error("Failed to fetch ingredients");
    }
  };

  // === Add Meal ===
  const addMeal = async () => {
    if (!name.trim() || selectedIngredients.length === 0) {
      toast.warn("Please enter a meal name and select ingredients");
      return;
    }

    try {
      const data = {
        name,
        ingredients: selectedIngredients.map((i) => ({
          ingredientId: i._id,
          quantityPerPerson: i.quantityPerPerson,
        })),
      };

      await API.post("/meals", data);
      setName("");
      setSelectedIngredients([]);
      fetchMeals();
      toast.success("Meal added successfully!");
    } catch (error) {
      console.error("Error adding meal:", error);
      toast.error("Failed to add meal");
    }
  };

  // === Open Edit Modal ===
  const openEditModal = (meal) => {
    setEditingMeal(meal);
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
    setName(meal.name);
  };

  // === Save Edited Meal ===
  const saveEditedMeal = async () => {
    if (!editingMeal) return;

    try {
      const updatedData = {
        name,
        ingredients: selectedIngredients.map((i) => ({
          ingredientId: i._id,
          quantityPerPerson: i.quantityPerPerson,
        })),
      };

      await API.put(`/meals/${editingMeal._id}`, updatedData);
      toast.success("Meal updated successfully!");
      setEditingMeal(null);
      setName("");
      setSelectedIngredients([]);
      fetchMeals();
    } catch (error) {
      console.error("Error updating meal:", error);
      toast.error("Failed to update meal");
    }
  };

  // === Delete Meal ===
  const deleteMeal = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await API.delete(`/meals/${id}`);
      fetchMeals();
      toast.success("Meal deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete meal");
    }
  };

  // === Add Ingredient to Selected List ===
  const addIngredientToMeal = (ingredient) => {
    if (selectedIngredients.find((i) => i._id === ingredient._id)) {
      toast.info("Ingredient already added!");
      return;
    }
    setSelectedIngredients([
      ...selectedIngredients,
      { ...ingredient, quantityPerPerson: ingredient.defaultPerPerson },
    ]);
  };

  // === Remove Ingredient ===
  const removeIngredient = (id) => {
    setSelectedIngredients(selectedIngredients.filter((i) => i._id !== id));
  };

  useEffect(() => {
    fetchMeals();
    fetchIngredients();
  }, []);

  // === Filter Ingredients by Search Term ===
  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      <ToastContainer position="top-right" autoClose={2000} />

      <h2 className="text-2xl font-bold">Meals</h2>

      {/* === Add Meal Form === */}
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            placeholder="Meal Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={addMeal}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Meal
          </button>
        </div>

        {/* === Ingredient Search & Select === */}
        <div>
          <input
            placeholder="Search Ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-full mb-3"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-2 bg-white">
            {filteredIngredients.map((ingredient) => (
              <button
                key={ingredient._id}
                onClick={() => addIngredientToMeal(ingredient)}
                className="border rounded px-2 py-1 hover:bg-gray-100 text-sm text-left"
              >
                {ingredient.name} ({ingredient.unit})
              </button>
            ))}
          </div>
        </div>

        {/* === Selected Ingredients List === */}
        {selectedIngredients.length > 0 && (
          <div>
            <h3 className="font-semibold mt-4 mb-2">Selected Ingredients:</h3>
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Quantity/Person</th>
                  <th className="border px-2 py-1">Unit</th>
                  <th className="border px-2 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedIngredients.map((i) => (
                  <tr key={i._id}>
                    <td className="border px-2 py-1">{i.name}</td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        value={i.quantityPerPerson}
                        onChange={(e) =>
                          setSelectedIngredients((prev) =>
                            prev.map((ing) =>
                              ing._id === i._id
                                ? {
                                    ...ing,
                                    quantityPerPerson: Number(e.target.value),
                                  }
                                : ing
                            )
                          )
                        }
                        className="border p-1 w-20 rounded"
                      />
                    </td>
                    <td className="border px-2 py-1">{i.unit}</td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        onClick={() => removeIngredient(i._id)}
                        className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === Meals Table === */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border">ID</th>
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Ingredients</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {meals.map((meal) => (
              <tr key={meal._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{meal._id}</td>
                <td className="py-2 px-4 border">{meal.name}</td>
                <td className="py-2 px-4 border text-sm">
                  {meal.ingredients
                    .map(
                      (i) =>
                        `${i.ingredientId} (${i.quantityPerPerson})`
                    )
                    .join(", ")}
                </td>
                <td className="py-2 px-4 border flex gap-2">
                  <button
                    onClick={() => openEditModal(meal)}
                    className="bg-yellow-400 text-white px-2 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMeal(meal._id)}
                    className="bg-red-500 text-white px-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === Edit Modal === */}
      {editingMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl space-y-4 shadow-lg">
            <h3 className="text-xl font-semibold mb-2">Edit Meal</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded w-full mb-2"
              placeholder="Meal name"
            />

            <div className="flex justify-between">
              <input
                placeholder="Search Ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border p-2 rounded w-full mb-3"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
              {filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient._id}
                  onClick={() => addIngredientToMeal(ingredient)}
                  className="border rounded px-2 py-1 hover:bg-gray-100 text-sm text-left"
                >
                  {ingredient.name} ({ingredient.unit})
                </button>
              ))}
            </div>

            <table className="min-w-full border text-sm mt-3">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Qty/Person</th>
                  <th className="border px-2 py-1">Unit</th>
                  <th className="border px-2 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedIngredients.map((i) => (
                  <tr key={i._id}>
                    <td className="border px-2 py-1">{i.name}</td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        value={i.quantityPerPerson}
                        onChange={(e) =>
                          setSelectedIngredients((prev) =>
                            prev.map((ing) =>
                              ing._id === i._id
                                ? {
                                    ...ing,
                                    quantityPerPerson: Number(e.target.value),
                                  }
                                : ing
                            )
                          )
                        }
                        className="border p-1 w-20 rounded"
                      />
                    </td>
                    <td className="border px-2 py-1">{i.unit}</td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        onClick={() => removeIngredient(i._id)}
                        className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => {
                  setEditingMeal(null);
                  setName("");
                  setSelectedIngredients([]);
                }}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedMeal}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
