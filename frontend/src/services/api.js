import axios from "axios";

const API = axios.create({
  baseURL: `${process.env.REACT_APP_SERVER_URL}/api`,
});

export const login = async (username, role, adminPassword = "") => {
  const { data } = await API.post("/auth/login", { username, role, adminPassword });
  return data;
};