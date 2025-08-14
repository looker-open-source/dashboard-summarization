import { ExtensionSDK } from "@looker/extension-sdk";

interface GenerateTitleResponse {
  title: string;
}

export async function generateTitle(
  text: string,
  restfulService: string,
  extensionSDK: ExtensionSDK
): Promise<string> {
  try {
    const titleData = {
      text: text,
      client_secret:
        restfulService === "http://localhost:5000"
          ? process.env.GENAI_CLIENT_SECRET
          : extensionSDK.createSecretKeyTag("genai_client_secret"),
    };

    const response = await extensionSDK[
      restfulService === "http://localhost:5000" ? "fetchProxy" : "serverProxy"
    ](`${restfulService}/generateTitle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(titleData),
    });

    if (response.ok) {
      const data = await response.body;
      return data.title || "";
    } else {
      console.error("Error generating title:", response.statusText);
      return "";
    }
  } catch (error) {
    console.error("Error generating title:", error);
    return "";
  }
}
