import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // Adjust as per your backend
});

export default API;
