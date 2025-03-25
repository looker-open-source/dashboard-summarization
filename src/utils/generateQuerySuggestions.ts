import { look, Looker40SDK } from "@looker/sdk";
import { decodeBase64String } from "./base64Helper";

export const generateQuerySuggestions = async (
  querySummaries: any[],
  restfulService: string,
  extensionSDK: any,
  setQuerySuggestions: (suggestions: any) => void,
  nextStepsInstructions: string
): Promise<void> => {
  try {
    // Use the extension sdk to proxy the request to the RESTful service
    const response = await extensionSDK[restfulService === 'http://localhost:5000' ? 'fetchProxy' : 'serverProxy'](`${restfulService}/generateQuerySuggestions`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        queryResults: querySummaries,
        querySummaries,
        nextStepsInstructions: nextStepsInstructions,
        client_secret: restfulService === 'http://localhost:5000' ? process.env.GENAI_CLIENT_SECRET : extensionSDK.createSecretKeyTag("genai_client_secret")
      })
    });

    if (response.ok) {
      console.log('Query suggestions response:', response);
     
      try {
        const data = await response.json();
        console.log("Suggestions: ", data)
        setQuerySuggestions(decodeBase64String(data.suggestions));
      } catch (error) {
        // If parsing fails, assume it's Markdown
        setQuerySuggestions(response);
      }
    } else {
      console.error('Error generating query suggestions:', response.statusText);
    }
  } catch (error) {
    console.error('Error generating query suggestions:', error);
  }
};