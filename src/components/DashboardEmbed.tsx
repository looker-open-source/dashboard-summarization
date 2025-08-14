import { ExtensionContext } from "@looker/extension-sdk-react";
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";

export const EmbedContainer = styled.div`
  width: 50%;
  height: 95vh;
  & > iframe {
    width: 100%;
    height: 100%;
  }
`;

export const DashboardEmbed: React.FC<any> = () => {
  const { extensionSDK, lookerHostData } = useContext(ExtensionContext);
  // const { dashboardURL, setDashboardURL } = useContext(SummaryDataContext)

  const [embedUrl, setEmbedUrl] = useState<string>("");
  const [embedError, setEmbedError] = useState<string>("");

  useEffect(() => {
    if (lookerHostData?.route && lookerHostData?.hostUrl) {
      try {
        const hostContext = lookerHostData.route || "";
        const urlPath = hostContext.split("?")[0].split("/") || [];
        const urlDashboardId = urlPath[urlPath.length - 1];
        const filterPart = hostContext.split("?")[1] || "";
        const urlParams = new URLSearchParams(filterPart);
        const urlDashboardFilters = Object.fromEntries(urlParams.entries());

        const dashboardId =
          urlDashboardId === "extension.loader"
            ? "defaultDashboardId"
            : urlDashboardId;
        const newEmbedUrl = `${
          lookerHostData.hostUrl
        }/embed/dashboards/${dashboardId}?${urlParams.toString()}`;

        setEmbedUrl(newEmbedUrl);
        setEmbedError("");
      } catch (error) {
        console.error("Error constructing embed URL:", error);
        setEmbedError("Failed to construct dashboard embed URL");
      }
    }
  }, [lookerHostData]);

  const handleIframeError = () => {
    setEmbedError("Failed to load dashboard embed");
  };

  if (embedError) {
    return (
      <EmbedContainer>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#666",
            fontSize: "14px",
          }}
        >
          {embedError}
        </div>
      </EmbedContainer>
    );
  }

  return (
    <EmbedContainer>
      {embedUrl && (
        <iframe
          src={embedUrl}
          frameBorder="0"
          crossOrigin="anonymous"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
          onError={handleIframeError}
        />
      )}
    </EmbedContainer>
  );
};
