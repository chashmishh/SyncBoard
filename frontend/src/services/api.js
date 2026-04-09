import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const login = async (username, role, adminPassword = "") => {
  const { data } = await API.post("/auth/login", { username, role, adminPassword });
  return data;
};