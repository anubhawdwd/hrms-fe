import { apiClient } from '../../lib/api/apiClient'
import type { EmployeeProfile, EmployeeMini } from './types'

export const employeeApi = {

    // Get logged-in employee profile

    getMe: async () => {
        const { data } = await apiClient.get<EmployeeProfile>(
            '/api/employees/me'
        )
        return data
    },


    // Get a specific employee by id

    getById: async (employeeId: string) => {
        const { data } = await apiClient.get<EmployeeProfile>(
            `/api/employees/${employeeId}`
        )
        return data
    },

    /**
     * List all employees in company
     * Used to derive peers, reportees, hierarchy
     */
    list: async () => {
        const { data } = await apiClient.get<EmployeeMini[]>(
            '/api/employees/'
        )
        return data
    },
}
