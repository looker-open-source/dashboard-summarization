import { DashboardMetadata } from '../types';

export const fetchQuerySummary = async (
  queryResult: any,
  restfulService: string,
  extensionSDK: any,
  dashboardMetadata: DashboardMetadata
): Promise<any> => {
  console.log('fetchquerysummary queryResult', queryResult);
  try {
    
    const response = await extensionSDK.serverProxy(`${restfulService}/generateQuerySummary`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: queryResult,
        description: dashboardMetadata.description,
        client_secret: extensionSDK.createSecretKeyTag("genai_client_secret")
      })
    });
    console.log('fetchquerysummary response', response);
    if (response.ok) {
      const data = await response.body.summary;
      return data;
    } else {
      console.error('Error generating query summary:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error generating query summary:', error);
    return null;
  }
};