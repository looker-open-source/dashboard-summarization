import { ExtensionSDK } from "@looker/extension-sdk";

export const generateFinalSummary = async (
  querySummaries: any[],
  restfulService: string,
  extensionSDK: ExtensionSDK,
  setFormattedData: (data: any) => void,
  nextStepsInstructions: string,
  linkedDashboardSummaries?: {
    dashboardId: string;
    dashboardTitle: string;
    summaries: any[];
  }[]
): Promise<void> => {
  try {
    // Prepare the data structure for the API
    const summaryData = {
      querySummaries,
      nextStepsInstructions: nextStepsInstructions,
      linkedDashboardSummaries: linkedDashboardSummaries || [],
      client_secret:
        restfulService === "http://localhost:5000"
          ? process.env.GENAI_CLIENT_SECRET
          : extensionSDK.createSecretKeyTag("genai_client_secret"),
    };

    const response = await extensionSDK[
      restfulService === "http://localhost:5000" ? "fetchProxy" : "serverProxy"
    ](`${restfulService}/generateSummary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(summaryData),
    });

    if (response.ok) {
      console.log("generateFinalSummary request data", summaryData);
      console.log("generateFinalSummary response", response);
      const data = await response.body;
      setFormattedData(data.summary);
    } else {
      console.error("Error generating summary:", response.statusText);
    }
  } catch (error) {
    console.error("Error generating summary:", error);
  }
};
