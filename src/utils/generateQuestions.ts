import { ExtensionSDK } from "@looker/extension-sdk";
import { LinkedDashboardSummary } from "../types";

export const generateQuestions = async (
  querySummaries: any[],
  restfulService: string,
  extensionSDK: ExtensionSDK,
  setQuestions: (questions: string[]) => void,
  nextStepsInstructions: string,
  linkedDashboardSummaries: LinkedDashboardSummary[]
): Promise<void> => {
  try {
    // Use the extension sdk to proxy the request to the RESTful service
    const response = await extensionSDK[
      restfulService === "http://localhost:5000" ? "fetchProxy" : "serverProxy"
    ](`${restfulService}/generateQuestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        querySummaries,
        nextStepsInstructions,
        linkedDashboardSummaries,
        client_secret:
          restfulService === "http://localhost:5000"
            ? process.env.GENAI_CLIENT_SECRET
            : extensionSDK.createSecretKeyTag("genai_client_secret"),
      }),
    });

    if (response.ok) {
      console.log("Query suggestions response:", response);

      try {
        const { questions } = await response.body;
        setQuestions(questions);
      } catch (error) {
        console.error("Error generating questions:", error);
      }
    } else {
      console.error("Error generating questions:", response.statusText);
    }
  } catch (error) {
    console.error("Error generating questions:", error);
  }
};
