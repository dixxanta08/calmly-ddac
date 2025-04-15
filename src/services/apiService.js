import axios from 'axios';
import dayjs from 'dayjs';

// Create an Axios instance
const api = axios.create({
    baseURL: '/api',  // Set the base URL for your API requests (adjust it if necessary)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Get all users
export const getUsers = async () => {
    try {
        const response = await api.get('/users');
        return response.data;  // Return the response data
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Get a specific user by ID
export const getUserById = async (id) => {
    try {
        const response = await api.get(`/users/${id}`);
        return response.data;  // Return the user data
    } catch (error) {
        console.error(`Error fetching user with ID ${id}:`, error);
        throw error;
    }
};

// Create a new user
export const createUser = async (user) => {
    try {
        const response = await api.post('/users', user);
        return response.data;  // Return the created user data
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Update an existing user
export const updateUser = async (user) => {
    try {
        const response = await api.put(`/users/${user.id}`, user);
        return response.data;  // Return the updated user data
    } catch (error) {
        console.error(`Error updating user with ID ${user.id}:`, error);
        throw error;
    }
};

// Delete a user
export const deleteUser = async (id) => {
    try {
        console.log('Deleting user with ID:', id);
        const response = await api.delete(`/users/${id}`);
        return response.data;  // Return the response message
    } catch (error) {
        console.error(`Error deleting user with ID ${id}:`, error);
        throw error;
    }
};

export const requestReset = async (email) => {
    try {
        const response = await api.post('/auth/request-reset', { email });
        return response.data;  // Return the response data
    } catch (error) {
        console.error('Error requesting reset:', error);
        throw error;
    }
}




// upload file
export const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;  // Return the uploaded file URL
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};


export const getEducationalMaterials = async (uploadedBy) => {
    try {
        const response = await api.get(`/educationalmaterials`, { params: { uploadedBy } });
        return response.data;  // Return the response data
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Get a specific user by ID
export const getEducationalMaterialById = async (id) => {
    try {
        const response = await api.get(`/educationalmaterials/${id}`);
        return response.data;  // Return the educationalmaterial data
    } catch (error) {
        console.error(`Error fetching user with ID ${id}:`, error);
        throw error;
    }
};

// Create a new educationalmaterials
export const createEducationalMaterial = async (educationalmaterial) => {
    try {
        const response = await api.post('/educationalmaterials', educationalmaterial);
        return response.data;  // Return the created user data
    } catch (error) {
        console.error('Error creating educational material:', error);
        throw error;
    }
};

// Update an existing educationalmaterials
export const updateEducationalMaterial = async (educationalmaterial) => {
    try {
        const response = await api.put(`/educationalmaterials/${educationalmaterial.materialId}`, educationalmaterial);
        return response.data;  // Return the updated educational material data
    } catch (error) {
        console.error(`Error updating educationalmaterial with ID ${educationalmaterial.materialId}:`, error);
        throw error;
    }
};

// Delete a eeducationalmaterial
export const deleteEducationalMaterial = async (materialId) => {
    try {
        console.log('Deleting educational material with ID:', materialId);
        const response = await api.delete(`/educationalmaterials/${materialId}`);
        return response.data;  // Return the response message
    } catch (error) {
        console.error(`Error deleting educational material with ID ${materialId}:`, error);
        throw error;
    }
};


export const getTherapists = async () => {
    try {
        const response = await api.get('/therapists');
        return response.data;  // Return the response data
    } catch (error) {
        console.error('Error fetching therapists:', error);
        throw error;
    }
}

export const getTimeSlotsForTherapistDate = async (therapistId, date) => {
    try {
        const formattedDate = dayjs(date).format('YYYY-MM-DD');

        const response = await api.get(`/therapists/${therapistId}?date=${formattedDate}`);

        return response.data;  // Return the response data
    } catch (error) {
        console.error('Error fetching time slots:', error);
        throw error;
    }
}

export const getAppointments = async (role, userId) => {
    try {
        const response = await api.get(`/appointments?role=${role}&userId=${userId}`);
        return response.data;  // Return the response data
    } catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
    }
}
export const createAppointment = async (appointment) => {
    try {
        const response = await api.post('/appointments', appointment);
        return response.data;  // Return the created appointment data
    } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
}


export const updateAppointment = async (appointment) => {
    try {
        const response = await api.patch(`/appointments/${appointment.appointmentId}`, appointment);
        return response.data;
    } catch (error) {
        console.error(`Error updating appointment with ID ${appointment.appointmentId}:`, error);
        throw error;
    }
};

export const getDashboard = async (role, userId) => {
    try {
        const response = await api.get(`/dashboard?role=${role}&userId=${userId}`);
        return response.data;  // Return the response data
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

export default api;
