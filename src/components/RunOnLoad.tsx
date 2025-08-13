import React, { useEffect, useRef } from "react";
import { DashboardMetadata } from "../types";

interface RunOnLoadProps {
  handleInitialGenerate: () => void;
  loading: boolean;
  dashboardMetadata: DashboardMetadata;
  nextStepsInstructions: string;
  elementConfigReady: boolean;
  isEditing: boolean;
}

export const RunOnLoad: React.FC<RunOnLoadProps> = ({
  handleInitialGenerate,
  loading,
  dashboardMetadata,
  nextStepsInstructions,
  elementConfigReady,
  isEditing,
}) => {
  const runOnceRef = useRef(false);

  useEffect(() => {
    // Wait for:
    // 1. Not already run
    // 2. Not already loading
    // 3. Dashboard metadata is properly loaded (has queries and dashboardId)
    // 4. Queries array has actual content
    // 5. Next steps instructions are available
    // 6. Element configuration is ready
    // 7. Dashboard is not in editing mode
    if (
      !runOnceRef.current &&
      !loading &&
      !isEditing &&
      elementConfigReady &&
      dashboardMetadata.dashboardId &&
      dashboardMetadata.dashboardId !== "undefined" &&
      dashboardMetadata.queries &&
      dashboardMetadata.queries.length > 0 &&
      nextStepsInstructions.trim().length > 0
    ) {
      // Add a small delay to ensure everything is fully settled
      runOnceRef.current = true;
      setTimeout(() => {
        handleInitialGenerate();
      }, 100);
    }
  }, [
    handleInitialGenerate,
    loading,
    isEditing,
    elementConfigReady,
    dashboardMetadata.dashboardId,
    dashboardMetadata.queries,
    nextStepsInstructions,
  ]);

  return null;
};
