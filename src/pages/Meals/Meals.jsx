import React, { useState, useEffect } from "react";
import API from "../../api/api";

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [name, setName] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");

  const fetchMeals = async () => {
    try {
      const res = await API.get("/meals");
      setMeals(res.data.data);
    } catch (error) { console.error(error); }
  };

  const addMeal = async () => {
    try {
      // ingredients input as JSON array string
      const ingredients = JSON.parse(ingredientsText);
      await API.post("/meals", { name, ingredients });
      setName(""); setIngredientsText("");
      fetchMeals();
    } catch (error) { console.error(error); }
  };

  const updateMeal = async (id) => {
    const newName = prompt("Enter new meal name:");
    if (!newName) return;
    try {
      await API.put(`/meals/${id}`, { name: newName });
      fetchMeals();
    } catch (error) { console.error(error); }
  };

  const deleteMeal = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await API.delete(`/meals/${id}`);
      fetchMeals();
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchMeals(); }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Meals</h2>
      <div className="flex gap-2 mb-4">
        <input placeholder="Meal Name" value={name} onChange={e=>setName(e.target.value)} className="border p-2 rounded flex-1"/>
        <input placeholder='Ingredients JSON' value={ingredientsText} onChange={e=>setIngredientsText(e.target.value)} className="border p-2 rounded flex-1"/>
        <button onClick={addMeal} className="bg-blue-500 text-white px-4 rounded">Add</button>
      </div>

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
          {meals.map(meal => (
            <tr key={meal._id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border">{meal._id}</td>
              <td className="py-2 px-4 border">{meal.name}</td>
              <td className="py-2 px-4 border">
                {meal.ingredients.map(i => `${i.ingredientId}(${i.quantityPerPerson})`).join(", ")}
              </td>
              <td className="py-2 px-4 border flex gap-2">
                <button onClick={()=>updateMeal(meal._id)} className="bg-yellow-400 text-white px-2 rounded">Edit</button>
                <button onClick={()=>deleteMeal(meal._id)} className="bg-red-500 text-white px-2 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
