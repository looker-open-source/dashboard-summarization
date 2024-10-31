export const generateFinalSummary = async (
  querySummaries: any[],
  restfulService: string,
  extensionSDK: any,
  setFormattedData: (data: any) => void,
  nextStepsInstructions: string,

): Promise<void> => {
  try {
    const response = await extensionSDK.serverProxy(`${restfulService}/generateSummary`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        querySummaries,
        nextStepsInstructions: nextStepsInstructions,
        client_secret: extensionSDK.createSecretKeyTag("genai_client_secret")
      })
    });

    if (response.ok) {
      console.log('generateFinalSummary request querySummaries and instructions', querySummaries, nextStepsInstructions);
      console.log('generateFinalSummary response', response);
      const data = await response.body;
      setFormattedData(data.summary);
    } else {
      console.error('Error generating summary:', response.statusText);
    }
  } catch (error) {
    console.error('Error generating summary:', error);
  }
};