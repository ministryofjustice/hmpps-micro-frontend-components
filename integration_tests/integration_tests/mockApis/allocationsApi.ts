/* eslint-disable import/no-relative-packages */
import { stubFor } from './wiremock'
import { StaffAllocationPolicies } from '../../../server/data/AllocationsApiClient'

const stubGetStaffAllocationPolicies = (
  response: StaffAllocationPolicies = {
    policies: [],
  },
) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/prisons/.*/staff/.*/job-classifications',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: response,
    },
  })

export default {
  stubGetStaffAllocationPolicies,
}
