import { apiClient } from '../../lib/api/apiClient'

export interface LeaveTodayResponse {
  employeeId: string
}

export type LeaveTodayScope = 'company' | 'department' | 'team'

export const leaveApi = {
  /**
   * Employees on leave for today
   */
  getToday: async (scope: LeaveTodayScope = 'team') => {
    const { data } = await apiClient.get<LeaveTodayResponse[]>(
      '/api/leaves/today',
      {
        params: { scope },
      }
    )
    return data
  },
}
