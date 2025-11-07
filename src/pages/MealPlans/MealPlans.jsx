import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import API from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";
// Assuming 'react-router-dom' for <Link> based on the original component structure
import { Link } from "react-router"; // Changed to 'react-router-dom' for Link
import { SaveIcon } from "lucide-react";

// Icons for better visual context
const PlusIcon = "➕";
const TrashIcon = "🗑️";
const EditIcon = "✏️";
const ViewListIcon = "📋";
const IngredientsIcon = "🛒";
const ScheduleIcon = "📅";
const CloseIcon = "❌";

// Default structure for a new day
const defaultDayStructure = {
  Breakfast: { meals: [], multiplier: 1 },
  MidSnack: { meals: [], multiplier: 1 },
  Lunch: { meals: [], multiplier: 1 },
  Dinner: { meals: [], multiplier: 1 },
  Snack: { meals: [], multiplier: 1 },
};

// Array of days for easy mapping
const DAYS_OF_WEEK = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MEAL_TYPES = ["Breakfast", "MidSnack", "Lunch", "Dinner", "Snack"];


export default function MealPlans() {
  const { userInfo } = useAuth();
  const [ingredientSummary, setIngredientSummary] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [meals, setMeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false); // New state for Ingredient Summary Modal

  const [formData, setFormData] = useState({
    planName: "",
    weekStartDate: "",
    days: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: { ...defaultDayStructure } }), {}),
  });

  // === Fetch Data ===
  const fetchPlans = useCallback(async () => {
    try {
      const res = await API.get("/mealplans");
      setPlans(res.data.data);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
    }
  }, []);

  const fetchIngredientSummary = async (planId) => {
    try {
      const res = await API.get(`/mealplans/ingredient-requirement/${planId}`);
      if (res.data.success) {
        setIngredientSummary(res.data.data);
        setSelectedPlanId(planId);
        setShowSummaryModal(true); // Open the new summary modal
      }
    } catch (error) {
      console.error("Error fetching ingredient requirements:", error);
      toast.error("Failed to fetch ingredient requirements");
    }
  };

  const fetchMeals = useCallback(async () => {
    try {
      const res = await API.get("/meals");
      setMeals(res.data.data);
    } catch (error) {
      console.error("Error fetching meals list:", error);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchMeals();
  }, [fetchPlans, fetchMeals]);

  // === React-Select Options ===
  const mealOptions = meals.map((m) => ({
    value: m._id,
    label: m.name,
  }));

  // Helper to find meal name from ID
  const getMealName = (mealId) => {
    const meal = meals.find(m => m._id === mealId);
    return meal ? meal.name : 'Unknown Meal';
  };

  // === Handle Meal/Multiplier Change ===
  const handleMealChange = (day, mealType, selectedOptions) => {
    setFormData((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          [mealType]: {
            ...prev.days[day][mealType],
            meals: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
          },
        },
      },
    }));
  };

  const handleMultiplierChange = (day, mealType, value) => {
    const parsedValue = parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          [mealType]: {
            ...prev.days[day][mealType],
            multiplier: isNaN(parsedValue) || parsedValue < 0.1 ? 1 : parsedValue, // Enforce min value
          },
        },
      },
    }));
  };

  // === CRUD Actions ===
  const resetForm = () => {
    setFormData({
      planName: "",
      weekStartDate: "",
      days: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: { ...defaultDayStructure } }), {}),
    });
    setEditId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const editPlan = (plan) => {
    // Merge fetched plan data with default structure to ensure all days/meal types exist
    const mergedDays = DAYS_OF_WEEK.reduce((acc, day) => ({
      ...acc,
      [day]: MEAL_TYPES.reduce((mealAcc, mealType) => ({
        ...mealAcc,
        [mealType]: plan.days?.[day]?.[mealType] || defaultDayStructure[mealType],
      }), {})
    }), {});

    setFormData({
      planName: plan.planName || "",
      weekStartDate: plan.weekStartDate || "",
      days: mergedDays,
    });
    setEditId(plan._id);
    setShowModal(true);
  };

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
        toast.success(editId ? "Meal plan updated! 👍" : "Meal plan added! 🎉");
        fetchPlans();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving meal plan");
    }
  };

  const deletePlan = async (id, planName) => {
    if (!window.confirm(`Are you sure you want to delete the plan: "${planName}"?`)) return;
    try {
      const res = await API.delete(`/mealplans/${id}`);
      if (res.data.success) {
        toast.success("Meal plan deleted");
        fetchPlans();
        if (selectedPlanId === id) {
          setIngredientSummary([]);
          setSelectedPlanId(null);
          setShowSummaryModal(false);
        }
      }
    } catch (error) {
      toast.error("Error deleting plan");
    }
  };

  // Function to render a cleaner summary for the table
  const renderPlanSummary = (planDays) => {
    let mealCount = 0;
    let daysWithMeals = 0;
    DAYS_OF_WEEK.forEach(day => {
      const dayHasMeals = MEAL_TYPES.some(mealType => planDays[day]?.[mealType]?.meals.length > 0);
      if (dayHasMeals) daysWithMeals++;
      MEAL_TYPES.forEach(mealType => {
        mealCount += (planDays[day]?.[mealType]?.meals.length || 0);
      });
    });

    if (mealCount === 0) return "No meals scheduled";

    return `${ScheduleIcon} ${daysWithMeals} Days, ${mealCount} Meals Total`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* === Header and Add Plan Button === */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-800 mb-4 sm:mb-0">🍲 Weekly Meal Plans</h2>
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
        >
          {PlusIcon} Create New Plan
        </button>
      </header>

      {/* --- */}

      {/* === Plans Table (Main List) === */}
      <section>
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Saved Meal Plans</h3>
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">Plan Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12 hidden sm:table-cell">Week Start</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4/12">Summary</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-3/12">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">No meal plans created yet.</td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-indigo-50/50 transition duration-150">
                    <td className="py-3 px-4 font-medium text-gray-900">{plan.planName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden sm:table-cell">{plan.weekStartDate || "N/A"}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {renderPlanSummary(plan.days)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => editPlan(plan)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold px-2 py-1 rounded transition"
                          title="Edit Plan"
                        >
                          {EditIcon} Edit
                        </button>
                        <button
                          onClick={() => fetchIngredientSummary(plan._id)}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded transition"
                          title="View Ingredient Requirements"
                        >
                          {IngredientsIcon} Ingredients
                        </button>
                        <button
                          onClick={() => deletePlan(plan._id, plan.planName)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded transition"
                          title="Delete Plan"
                        >
                          {TrashIcon} Delete
                        </button>
                        <Link to={plan?._id} className="block">
                          <button className="bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold px-2 py-1 rounded transition">
                            {ViewListIcon} Details
                          </button>
                        </Link>
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

      {/* === Plan Creation/Editing Modal === */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-8 rounded-xl w-full max-w-6xl shadow-2xl relative max-h-[95vh] overflow-y-auto">
            
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition"
              title="Close"
            >
              {CloseIcon}
            </button>

            <h3 className="text-xl sm:text-2xl font-bold text-indigo-700 border-b pb-2 mb-6">
              {editId ? "✏️ Edit Meal Plan" : "➕ Create Meal Plan"}
            </h3>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Plan Name</span>
                <input
                  type="text"
                  placeholder="e.g., Family Week 1 Dinner Plan"
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  className="border border-gray-300 p-3 rounded-lg w-full text-base mt-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Week Start Date</span>
                <input
                  type="date"
                  value={formData.weekStartDate}
                  onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
                  className="border border-gray-300 p-3 rounded-lg w-full text-base mt-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </label>
            </div>

            {/* Days Table - Scrollable and Condensed */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-[1000px] w-full text-sm">
                <thead className="bg-indigo-100 sticky top-0">
                  <tr>
                    <th className="border-r px-2 py-2 text-left w-1/12 text-indigo-800">Day</th>
                    {MEAL_TYPES.map((mealType) => (
                      <th key={mealType} className="border-r px-2 py-2 w-[18%] text-indigo-800">
                        {mealType}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS_OF_WEEK.map((day) => (
                    <tr key={day} className="hover:bg-gray-50">
                      <td className="border-r border-b px-2 py-2 font-semibold bg-gray-50 text-gray-800">{day}</td>
                      {MEAL_TYPES.map((mealType) => {
                        const mealData = formData.days[day]?.[mealType] || { meals: [], multiplier: 1 };
                        
                        // Select options for this meal time
                        const selectedValues = mealOptions.filter((opt) =>
                          mealData.meals.includes(opt.value)
                        );
                        
                        return (
                          <td key={mealType} className="border-r border-b px-2 py-1">
                            <div className="flex flex-col gap-1">
                              {/* Meal Selector */}
                              <Select
                                options={mealOptions}
                                value={selectedValues}
                                onChange={(selected) => handleMealChange(day, mealType, selected)}
                                placeholder="Select meal(s)..."
                                isClearable
                                isSearchable
                                isMulti
                                className="text-sm flex-1"
                                styles={{
                                  control: (base) => ({ ...base, minHeight: "34px", fontSize: "0.85rem", borderColor: selectedValues.length > 0 ? '#6366f1' : base.borderColor }),
                                  menu: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                              />
                              
                              {/* Multiplier Input */}
                              <div className="flex items-center mt-1 text-gray-600">
                                <span className="text-xs mr-2 whitespace-nowrap">Multiplier (x):</span>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={mealData.multiplier}
                                  onChange={(e) => handleMultiplierChange(day, mealType, e.target.value)}
                                  className="border border-gray-300 rounded p-1 w-16 text-xs text-center focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <span className="text-xs ml-1">(e.g., 2 for 2 persons)</span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Buttons */}
            <div className="flex justify-end mt-6 gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                Cancel
              </button>
              <button 
                onClick={savePlan} 
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                disabled={!formData.planName.trim()}
              >
                {editId ? `${SaveIcon} Update Plan` : `${PlusIcon} Save Plan`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- */}

      {/* === Ingredient Summary Modal (New Component) === */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-8 rounded-xl w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowSummaryModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition"
              title="Close"
            >
              {CloseIcon}
            </button>

            <h3 className="text-xl font-bold text-indigo-700 border-b pb-2 mb-4">
              {IngredientsIcon} Ingredient Requirements
            </h3>

            <p className="text-sm text-gray-600 mb-4">Total ingredients needed for the selected plan.</p>

            {ingredientSummary.length > 0 ? (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-indigo-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-indigo-700">Ingredient</th>
                      <th className="px-4 py-2 text-center font-medium text-indigo-700 w-1/4">Quantity</th>
                      <th className="px-4 py-2 text-center font-medium text-indigo-700 w-1/4">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredientSummary.map((item, index) => (
                      <tr key={item.ingredientId} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-2 font-medium text-gray-800">{item.name}</td>
                        <td className="px-4 py-2 text-center">{item.totalQty.toFixed(2)}</td>
                        <td className="px-4 py-2 text-center">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">No ingredient data available for this plan.</p>
            )}

            <div className="flex justify-end mt-4">
              <button onClick={() => setShowSummaryModal(false)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                Got It
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}