import React, { useState } from "react";
import axios from "axios";

export default function MealSelect({ label, options, value, onChange, category }) {
  const [newItem, setNewItem] = useState("");
console.log("options", options);
  const toggle = (item) => {
    if (value.includes(item)) onChange(value.filter((i) => i !== item));
    else onChange([...value, item]);
  };

  const handleAdd = async () => {
    if (!newItem) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/meals/${category}`, { item: newItem });
      options?.push(newItem); // update local options array
      setNewItem("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (item) => {
    try {
      await axios.delete(`http://localhost:5000/api/meals/${category}/${item}`);
      const index = options.indexOf(item);
      if (index > -1) options.splice(index, 1);
      onChange(value.filter(i => i !== item)); // remove from selected values
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-2 border-b mb-2">
      <p className="font-semibold mb-2">{label}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {options?.map((item) => (
          <div key={item} className="flex items-center bg-gray-100 px-2 py-1 rounded">
            <button onClick={() => toggle(item)} className={`mr-2 ${value.includes(item) ? "font-bold text-green-600" : ""}`}>
              {item}
            </button>
            <button onClick={() => handleRemove(item)} className="text-red-500 font-bold">x</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="border p-1 rounded flex-1"
          placeholder={`Add new ${label}`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button onClick={handleAdd} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Add</button>
      </div>
    </div>
  );
}
