
export const generateFinalSummary = async (
    querySummaries: any[],
    restfulService: string,
    extensionSDK: any,
    setFormattedData: (data: any) => void,
    nextStepsInstructions: string,
  
  ): Promise<void> => {
    try {
      const response = await extensionSDK[restfulService === 'http://localhost:5000' ? 'fetchProxy' : 'serverProxy'](`${restfulService}/generateSummary`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${extensionSDK.createSecretKeyTag("gcp_identity_token")}`
        },
        body: JSON.stringify({
          querySummaries,
          nextStepsInstructions: nextStepsInstructions,
          client_secret: restfulService === 'http://localhost:5000' ? process.env.GENAI_CLIENT_SECRET : extensionSDK.createSecretKeyTag("genai_client_secret")
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
  