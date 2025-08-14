import { ExtensionContext } from "@looker/extension-sdk-react";
import { IArtifact } from "@looker/sdk";
import React, { useContext, useEffect, useState } from "react";

const ARTIFACT_NAMESPACE = "dashboard-summarization-element-config";

interface IDashboardElementContext {
  element_id: string;
  updateArtifact: (
    value: Omit<IDashboardElementConfig, "element_id">
  ) => Promise<void>;
  element_config: IDashboardElementConfig | undefined;
  editing?: boolean;
}

interface IDashboardElementConfig {
  element_id: string;
  defaultPrompt: string;
  runSummaryOnLoad: boolean;
  deepResearch: boolean;
  showQa: boolean;
  drillLinkPatterns: string[];
}

export const DashboardElementContext =
  React.createContext<IDashboardElementContext | null>(null);

export const useDashboardElement: () =>
  | IDashboardElementContext
  | undefined = () => {
  const context = React.useContext(DashboardElementContext);
  if (!context) {
    return undefined;
  }
  return context;
};

export const DashboardElementProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [artifact, setArtifact] = useState<IArtifact | null | undefined>();
  const extensionSDK = useContext(ExtensionContext);

  // Add null check for extensionSDK
  if (!extensionSDK) {
    return null;
  }

  const sdk = extensionSDK.core40SDK;
  const element_id = extensionSDK.tileHostData?.elementId;

  useEffect(() => {
    initArtifact();
  }, [element_id]);

  const getArtifact = async () => {
    if (!element_id) {
      return;
    }
    const artifact = await sdk.ok(
      sdk.artifact({
        namespace: ARTIFACT_NAMESPACE,
        key: element_id,
      })
    );
    if (artifact?.length) {
      return artifact[0];
    }
  };

  const initArtifact = async () => {
    if (!element_id) {
      return;
    }
    const art = await getArtifact();
    if (art) {
      setArtifact(art);
    } else {
      setArtifact(null);
    }
  };

  const updateArtifact = async (
    value: Omit<IDashboardElementConfig, "element_id">
  ) => {
    if (!element_id) {
      return;
    }
    const curr = await getArtifact();
    const res = await sdk.ok(
      sdk.update_artifacts(
        ARTIFACT_NAMESPACE,
        [
          {
            key: element_id,
            value: JSON.stringify({ ...value, element_id }),
            content_type: "application/json",
            version: curr?.version,
          },
        ],
        "value"
      )
    );
    if (res.length) {
      setArtifact(res[0]);
    }
  };

  const element_config = artifact
    ? (JSON.parse(
        artifact.value?.length ? artifact.value : "{}"
      ) as IDashboardElementConfig)
    : undefined;

  if (!element_id) {
    return children;
  } else if (typeof artifact === "undefined") {
    return null;
  } else {
    return (
      <DashboardElementContext.Provider
        value={{
          element_id,
          updateArtifact,
          element_config,
          editing: extensionSDK.tileHostData.isDashboardEditing || false,
        }}
      >
        {children}
      </DashboardElementContext.Provider>
    );
  }
};
