import React, { useState, useEffect } from "react";
import MealSelect from "./MealSelect";
import axios from "axios";

export default function DayRoutineEditor({ day, routine, setRoutine }) {
  const [meals, setMeals] = useState({});

useEffect(() => {
  axios.get("http://localhost:5000/api/meals")
    .then(res => {
      const dataArray = res.data.data; // [{ Breakfast: [...], Lunch: [...], ... }]
      if (dataArray.length > 0) {
        setMeals(dataArray[0]); // take the first (and only) document
      }
    })
    .catch(err => console.error(err));
}, []);


  console.log(meals);
  const handleChange = (mealType, selected) => {
    setRoutine({ ...routine, [mealType]: selected });
  };

  return (
    <div className="border rounded-lg p-4 mb-4 shadow-sm">
      <h2 className="text-lg font-bold mb-2">{day}</h2>
      {Object.keys(meals).map((mealType) => (
        <MealSelect
          key={mealType}
          label={mealType}
          category={mealType}
          options={meals[mealType] || []}
          value={routine[mealType] || []}
          onChange={(selected) => handleChange(mealType, selected)}
        />
      ))}
    </div>
  );
}
