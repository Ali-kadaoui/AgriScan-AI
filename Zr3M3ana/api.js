import axios from 'axios';

export const API_URL = 'http://192.168.11.101:8000';

export const api = axios.create({
  baseURL: API_URL,
});

export const signupUser = async (name, email, password) => {
  const response = await api.post('/signup', { name, email, password });
  return response.data;
};

export const saveScan = async (userId, imageUrl, disease, confidence, treatment) => {
  const response = await api.post('/scans/save', {
    user_id: userId,
    image_url: imageUrl,
    disease,
    confidence,
    treatment
  });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

export const verifyPassword = async (userId, email, username, password) => {
  const response = await api.post('/users/verify-password', {
    user_id: userId,
    email,
    username,
    password
  });
  return response.data;
};

export const updateUser = async (userId, username, email, password) => {
  const response = await api.post('/users/update', {
    user_id: userId,
    username,
    email,
    password
  });
  return response.data; // Note: The old code checked updateRes.ok, here it will return data or throw depending on Axios.
};

export const predictDisease = async (imageUri, userId) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'plant.jpg',
    type: 'image/jpeg',
  });
  formData.append('user_id', userId);
  
  const response = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getUserScans = async (userId) => {
  const response = await api.get(`/users/${userId}/scans`);
  return response.data;
};

export const deletePlant = async (scanId) => {
  const response = await api.delete(`/scans/${scanId}`);
  return response.data;
};

export const chatWithBot = async (message, plantContext, userId = null, scanId = null) => {
  const payload = { 
    message: message,
    plant_context: plantContext 
  };
  if (userId) payload.user_id = userId;
  if (scanId) payload.scan_id = scanId;

  const response = await api.post('/chat', payload);
  return response.data;
};

export const saveWikiPlant = async (userId, plantName, plantImage) => {
  const response = await api.post('/wiki/save', {
    user_id: userId,
    plant_name: plantName,
    plant_image: plantImage
  });
  return response.data;
};

export const removeWikiPlant = async (userId, plantName) => {
  const response = await api.post('/wiki/unsave', {
    user_id: userId,
    plant_name: plantName,
    plant_image: "" 
  });
  return response.data;
};

export const getUserWikiPlants = async (userId) => {
  const response = await api.get(`/users/${userId}/wiki`);
  return response.data;
};

export const searchWikiPlants = async (query, imageUrl = null) => {
  let url = `/wiki/search?query=${query}`;
  if (imageUrl) {
    url += `&image_url=${encodeURIComponent(imageUrl)}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const getWikiSuggestions = async (query) => {
  const response = await api.get(`/wiki/suggestions?query=${query}`);
  return response.data;
};

export const getRandomFacts = async () => {
  const response = await api.get('/wiki/random_facts');
  return response.data;
};