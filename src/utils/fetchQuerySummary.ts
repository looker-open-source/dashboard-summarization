import { DashboardMetadata } from '../types';

export const fetchQuerySummary = async (
  queryResult: any,
  restfulService: string,
  extensionSDK: any,
  dashboardMetadata: DashboardMetadata,
  nextStepsInstructions: string,
): Promise<any> => {
  console.log('fetchquerysummary queryResult', queryResult);
  try {
    
    const response = await extensionSDK[restfulService === 'http://localhost:5000' ? 'fetchProxy' : 'serverProxy'](`${restfulService}/generateQuerySummary`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${extensionSDK.createSecretKeyTag("gcp_identity_token")}`,
        "X-Serverless-Authorization": `${extensionSDK.createSecretKeyTag("gcp_identity_token")}`
      },
      body: JSON.stringify({
        query: queryResult,
        description: dashboardMetadata.description,
        nextStepsInstructions: nextStepsInstructions,
        client_secret: restfulService === 'http://localhost:5000' ? process.env.GENAI_CLIENT_SECRET : extensionSDK.createSecretKeyTag("genai_client_secret")
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
