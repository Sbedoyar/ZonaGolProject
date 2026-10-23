import axios from 'axios'
import API_URL from '../config/api'

export const getUsers = async () => {
        const response = await axios.get(`${API_URL}/users`)
        return response.data
}
