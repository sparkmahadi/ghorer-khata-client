import React, { useState, useEffect } from "react";
import API from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editIngredient, setEditIngredient] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    defaultPerPerson: "",
  });

  const fetchIngredients = async () => {
    try {
      const res = await API.get("/ingredients");
      if (res.data.success) {
        setIngredients(res.data.data);
      } else {
        toast.error(res.data.message || "Failed to fetch ingredients");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch ingredients");
    }
  };

  const openAddModal = () => {
    setEditIngredient(null);
    setFormData({ name: "", unit: "", defaultPerPerson: "" });
    setShowModal(true);
  };

  const openEditModal = (ingredient) => {
    setEditIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      defaultPerPerson: ingredient.defaultPerPerson,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editIngredient) {
        res = await API.put(`/ingredients/${editIngredient._id}`, {
          name: formData.name,
          unit: formData.unit,
          defaultPerPerson: parseInt(formData.defaultPerPerson),
        });
        if (res.data.success) toast.success("Ingredient updated successfully");
        else toast.error(res.data.message || "Failed to update ingredient");
      } else {
        res = await API.post("/ingredients", {
          name: formData.name,
          unit: formData.unit,
          defaultPerPerson: parseInt(formData.defaultPerPerson),
        });
        if (res.data.success) toast.success("Ingredient added successfully");
        else toast.error(res.data.message || "Failed to add ingredient");
      }
      setShowModal(false);
      fetchIngredients();
    } catch (error) {
      console.error(error);
      toast.error("Server error while saving ingredient");
    }
  };

  const deleteIngredient = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await API.delete(`/ingredients/${id}`);
      if (res.data.success) {
        toast.success("Ingredient deleted successfully");
        fetchIngredients();
      } else {
        toast.error(res.data.message || "Failed to delete ingredient");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error while deleting ingredient");
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  return (
    <div className="p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-2xl font-bold mb-4">Ingredients</h2>

      <button
        onClick={openAddModal}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add Ingredient
      </button>

      {/* Table */}
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">ID</th>
            <th className="py-2 px-4 border">Name</th>
            <th className="py-2 px-4 border">Unit</th>
            <th className="py-2 px-4 border">Qty/Person</th>
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => (
            <tr key={ing._id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border">{ing._id}</td>
              <td className="py-2 px-4 border">{ing.name}</td>
              <td className="py-2 px-4 border">{ing.unit}</td>
              <td className="py-2 px-4 border">{ing.defaultPerPerson}</td>
              <td className="py-2 px-4 border flex gap-2">
                <button
                  onClick={() => openEditModal(ing)}
                  className="bg-yellow-400 text-white px-2 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteIngredient(ing._id)}
                  className="bg-red-500 text-white px-2 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-96 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 text-xl font-bold"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4">
              {editIngredient ? "Edit Ingredient" : "Add Ingredient"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block mb-1">Unit</label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block mb-1">Qty per Person</label>
                <input
                  type="number"
                  required
                  value={formData.defaultPerPerson}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultPerPerson: e.target.value,
                    })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded w-full"
              >
                {editIngredient ? "Update" : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
