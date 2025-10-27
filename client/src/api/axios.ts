import axios from 'axios';
import {config} from "@/config/constants";

const api = axios.create({
    baseURL: `${config.API_URL}/api`,
});

export default api;