import apiClient from './axiosConfig';

// Generic API service class
class ApiService {
  constructor(baseEndpoint) {
    this.baseEndpoint = baseEndpoint;
  }

  // GET all items
  async getAll(params = {}) {
    try {
      const response = await apiClient.get(this.baseEndpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // GET item by ID
  async getById(id) {
    try {
      const response = await apiClient.get(`${this.baseEndpoint}/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST - Create new item
  async create(data) {
    try {
      const response = await apiClient.post(this.baseEndpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT - Update item
  async update(id, data) {
    try {
      const response = await apiClient.put(`${this.baseEndpoint}/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH - Partial update
  async patch(id, data) {
    try {
      const response = await apiClient.patch(`${this.baseEndpoint}/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE item
  async delete(id) {
    try {
      const response = await apiClient.delete(`${this.baseEndpoint}/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status;
    return { message, status, error: true };
  }
}

export default ApiService;
