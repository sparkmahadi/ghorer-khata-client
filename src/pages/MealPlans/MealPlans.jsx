import React, { useState, useEffect } from "react";
import Select from "react-select";
import API from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";

export default function MealPlans() {
  const { userInfo } = useAuth();
  const [ingredientSummary, setIngredientSummary] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const [plans, setPlans] = useState([]);
  const [meals, setMeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    planName: "",
    weekStartDate: "",
    days: {
      Saturday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
      Sunday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
      Monday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
      Tuesday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
      Wednesday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
      Thursday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
      Friday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
    },
  });

  // === Fetch Data ===
  const fetchPlans = async () => {
    try {
      const res = await API.get("/mealplans");
      setPlans(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchIngredientSummary = async (planId) => {
    try {
      const res = await API.get(`/mealplans/ingredient-requirement/${planId}`);
      console.log(res)
      if (res.data.success) {
        setIngredientSummary(res.data.data);
        setSelectedPlanId(planId);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch ingredient requirements");
    }
  };


  const fetchMeals = async () => {
    try {
      const res = await API.get("/meals");
      setMeals(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchMeals();
  }, []);

  // === React-Select Options ===
  const mealOptions = meals.map((m) => ({
    value: m._id,
    label: m.name,
  }));

  // === Handle Meal Change ===
  const handleMealChange = (day, mealType, selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: { ...prev.days[day], [mealType]: selectedOption?.value || "" },
      },
    }));
  };

  // === Save Plan ===
  const savePlan = async () => {
    if (!formData.planName.trim()) {
      toast.warn("Please enter a plan name");
      return;
    }

    try {
      const payload = {
        ...formData,
        userId: userInfo?._id || "",
      };

      const res = editId
        ? await API.put(`/mealplans/${editId}`, payload)
        : await API.post("/mealplans", payload);

      if (res.data.success) {
        toast.success(editId ? "Meal plan updated!" : "Meal plan added!");
        fetchPlans();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving meal plan");
    }
  };

  // === Delete Plan ===
  const deletePlan = async (id) => {
    if (!window.confirm("Delete this meal plan?")) return;
    try {
      const res = await API.delete(`/mealplans/${id}`);
      if (res.data.success) {
        toast.success("Meal plan deleted");
        fetchPlans();
      }
    } catch (error) {
      toast.error("Error deleting plan");
    }
  };

  // === Edit Plan ===
  const editPlan = (plan) => {
    setFormData({
      planName: plan.planName || "",
      weekStartDate: plan.weekStartDate || "",
      days: plan.days || {},
    });
    setEditId(plan._id);
    setShowModal(true);
  };

  // === Reset Form ===
  const resetForm = () => {
    setFormData({
      planName: "",
      weekStartDate: "",
      days: {
        Saturday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
        Sunday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
        Monday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
        Tuesday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
        Wednesday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
        Thursday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
        Friday: { Breakfast: "", Lunch: "", Dinner: "", Snack: "" },
      },
    });
    setEditId(null);
  };

  return (
    <div className="p-4 space-y-6">
      <ToastContainer position="top-right" />
      <h2 className="text-2xl font-bold">Meal Plans</h2>

      {/* === Add Plan Button === */}
      <button
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
      >
        Add New Plan
      </button>

      {/* === Plans Table === */}
      <div className="overflow-x-auto mt-4 rounded-lg shadow">
        <table className="min-w-full bg-white border text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="py-2 px-4 border">Plan Name</th>
              <th className="py-2 px-4 border">User</th>
              <th className="py-2 px-4 border">Week Start</th>
              <th className="py-2 px-4 border">Days Summary</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border font-medium">
                  {plan.planName}
                </td>
                <td className="py-2 px-4 border text-xs">{plan.userId}</td>
                <td className="py-2 px-4 border text-xs">
                  {plan.weekStartDate}
                </td>
                <td className="py-2 px-4 border text-xs">
                  {Object.entries(plan.days)
                    .map(
                      ([day, meals]) =>
                        `${day}: [${Object.entries(meals)
                          .map(([type, id]) => `${type}: ${id}`)
                          .join(", ")}]`
                    )
                    .join("; ")}
                </td>
                <td className="py-2 px-4 border flex gap-2">
                  <button
                    onClick={() => editPlan(plan)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePlan(plan._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => fetchIngredientSummary(plan._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Ingredients
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>


        {ingredientSummary.length > 0 && selectedPlanId && (
          <div className="mt-6 p-4 bg-gray-50 rounded shadow">
            <h3 className="text-lg font-bold mb-2">Ingredient Requirements</h3>
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Ingredient</th>
                  <th className="px-4 py-2 border">Quantity</th>
                  <th className="px-4 py-2 border">Unit</th>
                </tr>
              </thead>
              <tbody>
                {ingredientSummary.map((item) => (
                  <tr key={item.ingredientId}>
                    <td className="border px-4 py-2">{item.name}</td>
                    <td className="border px-4 py-2">{item.totalQty}</td>
                    <td className="border px-4 py-2">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* === Modal === */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-5xl shadow-lg overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4">
              {editId ? "Edit Meal Plan" : "Add Meal Plan"}
            </h3>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Enter plan name"
                value={formData.planName}
                onChange={(e) =>
                  setFormData({ ...formData, planName: e.target.value })
                }
                className="border p-2 rounded w-full"
              />
              <input
                type="date"
                value={formData.weekStartDate}
                onChange={(e) =>
                  setFormData({ ...formData, weekStartDate: e.target.value })
                }
                className="border p-2 rounded w-full"
              />
            </div>

            {/* Days Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1">Day</th>
                    <th className="border px-2 py-1">Breakfast</th>
                    <th className="border px-2 py-1">Lunch</th>
                    <th className="border px-2 py-1">Dinner</th>
                    <th className="border px-2 py-1">Snack</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(formData.days).map((day) => (
                    <tr key={day}>
                      <td className="border px-2 py-1 font-semibold">{day}</td>
                      {["Breakfast", "Lunch", "Dinner", "Snack"].map(
                        (mealType) => (
                          <td key={mealType} className="border px-2 py-1">
                            <Select
                              options={mealOptions}
                              value={
                                mealOptions.find(
                                  (opt) =>
                                    opt.value === formData.days[day][mealType]
                                ) || null
                              }
                              onChange={(selected) =>
                                handleMealChange(day, mealType, selected)
                              }
                              placeholder="Select meal..."
                              isClearable
                              isSearchable
                              className="text-sm"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  minHeight: "34px",
                                  fontSize: "0.85rem",
                                }),
                                menu: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                            />
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Buttons */}
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={savePlan}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
