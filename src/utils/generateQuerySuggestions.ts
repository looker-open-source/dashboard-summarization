import { ExtensionSDK } from "@looker/extension-sdk";
import { LinkedDashboardSummary } from "../types";

export const generateQuerySuggestions = async (
  querySummaries: any[],
  restfulService: string,
  extensionSDK: ExtensionSDK,
  setQuerySuggestions: (suggestions: any) => void,
  nextStepsInstructions: string,
  linkedDashboardSummaries: LinkedDashboardSummary[]
): Promise<void> => {
  try {
    // Use the extension sdk to proxy the request to the RESTful service
    const response = await extensionSDK[
      restfulService === "http://localhost:5000" ? "fetchProxy" : "serverProxy"
    ](`${restfulService}/generateQuerySuggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryResults: querySummaries,
        querySummaries,
        linkedDashboardSummaries,
        nextStepsInstructions: nextStepsInstructions,
        client_secret:
          restfulService === "http://localhost:5000"
            ? process.env.GENAI_CLIENT_SECRET
            : extensionSDK.createSecretKeyTag("genai_client_secret"),
      }),
    });

    if (response.ok) {
      try {
        const data = await response.body;
        setQuerySuggestions(data.suggestions);
      } catch (error) {
        // If parsing fails, assume it's Markdown
        setQuerySuggestions(response);
      }
    } else {
      console.error("Error generating query suggestions:", response.statusText);
    }
  } catch (error) {
    console.error("Error generating query suggestions:", error);
  }
};
