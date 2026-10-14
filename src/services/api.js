import axios from 'axios';


// export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5100'; <---- usar en el servidor
export const API_BASE = 'http://localhost:5100'; // <---- usar en el localhost para desarrollo

const api = axios.create({
    baseURL: `${API_BASE}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;