import { ExtensionSDK } from "@looker/extension-sdk";

export const generateAnswer = async (
  querySummaries: string[],
  restfulService: string,
  extensionSDK: ExtensionSDK,
  onAnswerGenerated: (answer: string) => void,
  question: string,
  linkedDashboardSummaries?: any[],
  previousContext?: string
) => {
  try {
    // Prepare the data structure for the API
    const answerData = {
      querySummaries,
      linkedDashboardSummaries: linkedDashboardSummaries || [],
      previousContext: previousContext || "",
      question: question,
      client_secret:
        restfulService === "http://localhost:5000"
          ? process.env.GENAI_CLIENT_SECRET
          : extensionSDK.createSecretKeyTag("genai_client_secret"),
    };

    const response = await extensionSDK[
      restfulService === "http://localhost:5000" ? "fetchProxy" : "serverProxy"
    ](`${restfulService}/answerQuestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(answerData),
    });

    if (response.ok) {
      console.log("generateAnswer request data", answerData);
      console.log("generateAnswer response", response);
      const data = await response.body;
      if (data.answer) {
        onAnswerGenerated(data.answer);
      } else {
        throw new Error("No answer received from the API");
      }
    } else {
      console.error("Error generating answer:", response.statusText);
      throw new Error(`API request failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error generating answer:", error);
    throw error;
  }
};
