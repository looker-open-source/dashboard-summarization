/*

MIT License

Copyright (c) 2023 Looker Data Sciences, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import { ExtensionContext } from "@looker/extension-sdk-react";
import { useContext } from "react";
import { SummaryDataContext } from "../contexts/SummaryDataContext";

const useWorkspaceOauth = () => {
  const extensionContext = useContext(ExtensionContext);
  if (!extensionContext?.extensionSDK) {
    throw new Error("ExtensionSDK not found");
  }
  const { extensionSDK } = extensionContext;
  const { data, setMessage, setInfo } = useContext(SummaryDataContext);

  async function googleOauthImplicitFlow() {
    const response = await extensionSDK.oauth2Authenticate(
      "https://accounts.google.com/o/oauth2/v2/auth",
      {
        client_id: process.env.GOOGLE_CLIENT_ID!,
        scope:
          "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/chat.messages https://www.googleapis.com/auth/chat.messages.create https://www.googleapis.com/auth/chat.spaces https://www.googleapis.com/auth/chat.spaces.readonly https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.profile",
        response_type: "token",
      }
    );
    const { access_token } = response;
    postSummaryDataToGchat(access_token);
  }

  // Get information about user from Google
  const postSummaryDataToGchat = async (accessToken?: string) => {
    try {
      // Get information about user from google
      const messageExport = await extensionSDK.fetchProxy(
        `https://chat.googleapis.com/v1/spaces/${process.env.SPACE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text:
              `*Business Pulse Dashboard Summary \n <https://experiment-3.dev.looker.com/embed/dashboards/33| Full Dashboard> \n` +
              data.join(" "),
            formattedText:
              `*Business Pulse Dashboard Summary \n <https://experiment-3.dev.looker.com/embed/dashboards/33| Full Dashboard> \n` +
              data.join(" "),
          }),
        }
      );
      setInfo(true);
      if (messageExport.ok) {
        setMessage(
          `Summary delivered to Google Chat space: ${process.env.SPACE_ID}`
        );
      }
    } catch (error) {
      setMessage(
        "Summary failed to deliver to Google Chat. See console for error."
      );
      console.error(error);
    }
  };

  return () => {
    googleOauthImplicitFlow();
  };
};

export default useWorkspaceOauth;
