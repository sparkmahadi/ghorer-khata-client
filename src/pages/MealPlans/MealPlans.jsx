import React, { useState, useEffect } from "react";
import API from "../../api/api";

export default function MealPlans() {
  const [plans, setPlans] = useState([]);
  const [day, setDay] = useState("");
  const [mealsText, setMealsText] = useState(""); // JSON array of mealIds

  const fetchPlans = async () => {
    try {
      const res = await API.get("/mealplans");
      setPlans(res.data.data);
    } catch (error) { console.error(error); }
  };

  const addPlan = async () => {
    try {
      const meals = JSON.parse(mealsText);
      await API.post("/mealplans", { day, meals });
      setDay(""); setMealsText("");
      fetchPlans();
    } catch (error) { console.error(error); }
  };

  const updatePlan = async (id) => {
    const newDay = prompt("Enter new day:");
    if (!newDay) return;
    try {
      await API.put(`/mealplans/${id}`, { day: newDay });
      fetchPlans();
    } catch (error) { console.error(error); }
  };

  const deletePlan = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await API.delete(`/mealplans/${id}`);
      fetchPlans();
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchPlans(); }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Meal Plans</h2>
      <div className="flex gap-2 mb-4">
        <input placeholder="Day" value={day} onChange={e=>setDay(e.target.value)} className="border p-2 rounded flex-1"/>
        <input placeholder='Meals JSON' value={mealsText} onChange={e=>setMealsText(e.target.value)} className="border p-2 rounded flex-1"/>
        <button onClick={addPlan} className="bg-blue-500 text-white px-4 rounded">Add</button>
      </div>

      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">ID</th>
            <th className="py-2 px-4 border">Day</th>
            <th className="py-2 px-4 border">Meals</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map(plan => (
            <tr key={plan._id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border">{plan._id}</td>
              <td className="py-2 px-4 border">{plan.day}</td>
              <td className="py-2 px-4 border">{plan.meals.join(", ")}</td>
              <td className="py-2 px-4 border flex gap-2">
                <button onClick={()=>updatePlan(plan._id)} className="bg-yellow-400 text-white px-2 rounded">Edit</button>
                <button onClick={()=>deletePlan(plan._id)} className="bg-red-500 text-white px-2 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
