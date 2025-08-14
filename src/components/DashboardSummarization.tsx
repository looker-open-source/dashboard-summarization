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

import {
  ExtensionContext,
  ExtensionContextData,
} from "@looker/extension-sdk-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled from "styled-components";
import { SummaryDataContext } from "../contexts/SummaryDataContext";
import { useDashboardElement } from "../DashboardElementContext";
import useSlackOauth from "../hooks/useSlackOauth";
import useWorkspaceOauth from "../hooks/useWorkspaceOauth";
import {
  DashboardMetadata,
  LinkedDashboardSummary,
  LoadingStates,
  SummaryDataContextType,
} from "../types";
import { fetchDashboardDetails } from "../utils/fetchDashboardDetails";
import { fetchQueryData } from "../utils/fetchQueryData";
import { generateFinalSummary } from "../utils/generateFinalSummary";
import { onAllQueriesComplete } from "../utils/processRenderedData";
import { recursiveDashboardSummarization } from "../utils/recursiveDashboardSummarization";
import ConfigDialog from "./ConfigDialog";
import InitializedContainer from "./InitializedContainer";
import { RunOnLoad } from "./RunOnLoad";

interface PresetPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: "executive",
    title: "Executive Style",
    description: "High-level insights focused on business impact",
    prompt:
      "Analyze this dashboard with an executive mindset. Focus on key business metrics, strategic implications, and actionable insights. Keep the language concise and emphasize bottom-line impact.",
  },
  {
    id: "analyst",
    title: "Analyst Style",
    description: "Detailed analysis with statistical context",
    prompt:
      "Provide a detailed analytical breakdown of this dashboard. Include statistical significance where relevant, highlight correlations, and provide data-driven recommendations. Focus on trends and patterns in the data.",
  },
  {
    id: "stakeholder",
    title: "Stakeholder Style",
    description: "Balanced overview for diverse audiences",
    prompt:
      "Summarize this dashboard for key stakeholders. Balance technical insights with business context, highlight progress towards goals, and identify areas needing attention. Include both achievements and opportunities for improvement.",
  },
  {
    id: "action",
    title: "Action-Oriented",
    description: "Focus on next steps and recommendations",
    prompt:
      "Analyze this dashboard with a focus on actionable insights. Prioritize specific recommendations, outline clear next steps, and identify immediate opportunities for optimization or improvement.",
  },
];

export const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  display: flex;
  align-items: center;
  background-color: ${(props) =>
    props.$variant === "primary" ? "var(--primary-500)" : "var(--neutral-200)"};
  color: ${(props) =>
    props.$variant === "primary" ? "white" : "var(--text-primary)"};

  &:hover {
    background-color: ${(props) =>
      props.$variant === "primary"
        ? "var(--primary-600)"
        : "var(--neutral-300)"};
  }

  &:disabled {
    background-color: var(--neutral-200);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
`;

export const PromptInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  margin: 16px 0;
  background-color: var(--surface);
  color: var(--text-primary);
  resize: vertical;
  transition: border-color 200ms ease-in-out;

  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px var(--primary-100);
  }
`;

// Styled Components
const LandingContainer = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  overflow-y: scroll;
`;

const LandingHeader = styled.div`
  margin-bottom: 24px;
`;

export const DashboardSummarization: React.FC = () => {
  const { extensionSDK, tileHostData, core40SDK, lookerHostData } = useContext(
    ExtensionContext
  ) as ExtensionContextData;

  // Add null check for extensionSDK
  if (!extensionSDK) {
    return <div>Loading...</div>;
  }

  const { dashboardFilters, dashboardId } = tileHostData;
  const dashboard_element_config = useDashboardElement();
  const [dashboardMetadata, setDashboardMetadata] = useState<DashboardMetadata>(
    { dashboardFilters: {}, dashboardId: "", queries: [], description: "" }
  );
  const [loadingDashboardMetadata, setLoadingDashboardMetadata] =
    useState<boolean>(true);
  const [querySummaries, setQuerySummaries] = useState<string[]>([]);

  const [linkedDashboardSummaries, setLinkedDashboardSummaries] = useState<
    LinkedDashboardSummary[]
  >([]);
  const [finalSummary, setFinalSummary] = useState<string>("");
  const [queryResults, setQueryResults] = useState<
    Awaited<ReturnType<typeof fetchQueryData>>
  >([]);
  const [nextStepsInstructions, setNextStepsInstructions] = useState<string>(
    dashboard_element_config?.element_config?.defaultPrompt?.trim().length
      ? dashboard_element_config?.element_config?.defaultPrompt
      : ""
  );
  const {
    data,
    setData,
    formattedData,
    setFormattedData,
    setQuerySuggestions,
    info,
    setInfo,
    message,
    setMessage,
    setDashboardURL,
  } = useContext(SummaryDataContext) as SummaryDataContextType;
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  const workspaceOauth = useWorkspaceOauth();
  const slackOauth = useSlackOauth();
  const restfulService = process.env.RESTFUL_WEBSERVICE || "";
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const { drillLinkPatterns, deepResearch, runSummaryOnLoad } =
    dashboard_element_config?.element_config || {
      runSummaryOnLoad: false,
      deepResearch: false,
      drillLinkPatterns: [],
    };

  const calculatedDrillLinkPatterns = deepResearch
    ? drillLinkPatterns?.length
      ? drillLinkPatterns
      : null
    : null;

  const handlePresetSelect = (preset: PresetPrompt) => {
    setSelectedPreset(preset.id);
    setNextStepsInstructions(preset.prompt);
  };

  useEffect(() => {
    if (tileHostData.dashboardRunState === "RUNNING") {
      setData([]);
      setLoading(false);
    }
  }, [tileHostData.dashboardRunState, setData, setLoading]);

  // Update the message when the dashboard metadata is loaded
  useEffect(() => {
    if (
      (message && message.includes("Loaded Dashboard Metadata")) ||
      message.includes("Google Chat") ||
      message.includes("Slack")
    ) {
      setTimeout(() => {
        setInfo(false);
      }, 1000);
    }
  }, [message]);

  // Run each query in the dashboard to get query data
  useEffect(() => {
    if (dashboardMetadata.queries.length <= 0) return;
    const fetchQueryResults = async () => {
      if (dashboardMetadata.queries.length > 0) {
        const results = await fetchQueryData(
          dashboardMetadata.queries,
          core40SDK
        );
        setQueryResults(results);
      }
    };

    fetchQueryResults();
  }, [dashboardMetadata.queries, core40SDK]);

  const fetchQueryMetadata = useCallback(async () => {
    if (dashboardId && dashboardId !== "undefined") {
      setLoadingDashboardMetadata(true);
      const { description, queries } = await fetchDashboardDetails(
        dashboardId,
        core40SDK,
        extensionSDK,
        dashboardFilters || {}
      );
      await extensionSDK.localStorageSetItem(
        `${dashboardId}:${JSON.stringify(dashboardFilters)}`,
        JSON.stringify({
          dashboardFilters,
          dashboardId,
          queries,
          description,
        })
      );
      setDashboardMetadata({
        dashboardFilters,
        dashboardId,
        queries,
        description,
      });
      setLoadingDashboardMetadata(false);
    }
  }, [dashboardId, dashboardFilters]);

  // Fetch dashboard metadata, including description and queries
  useEffect(() => {
    fetchQueryMetadata();
  }, [fetchQueryMetadata]);

  const handleInitialGenerate = async () => {
    if (!nextStepsInstructions.trim()) return;
    setLoading(true);
    setQuerySummaries([]); // Clear existing summaries
    setLinkedDashboardSummaries([]); // Clear existing linked dashboard summaries
    setFinalSummary(""); // Clear existing final summary
    try {
      const result = await recursiveDashboardSummarization(
        queryResults,
        nextStepsInstructions,
        restfulService,
        extensionSDK,
        dashboardMetadata,
        setQuerySummaries,
        setLoadingStates,
        core40SDK,
        calculatedDrillLinkPatterns
      );

      setLinkedDashboardSummaries(result.linkedDashboardSummaries);

      // Generate final summary including linked dashboards
      if (
        result.originalSummaries.length > 0 ||
        result.linkedDashboardSummaries.length > 0
      ) {
        await generateFinalSummary(
          result.originalSummaries,
          restfulService,
          extensionSDK,
          setFinalSummary,
          nextStepsInstructions,
          result.linkedDashboardSummaries
        );
      }

      // Process rendered data after all queries are complete
      await onAllQueriesComplete(queryResults, dashboardMetadata, (result) => {
        console.log("Rendered data processing complete:", result);
      });

      setHasInitialized(true);
    } catch (error) {
      console.error("Error generating summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!nextStepsInstructions.trim()) return;
    setLoading(true);
    setQuerySummaries([]); // Clear existing summaries
    setLinkedDashboardSummaries([]); // Clear existing linked dashboard summaries
    setFinalSummary(""); // Clear existing final summary
    try {
      const result = await recursiveDashboardSummarization(
        queryResults,
        nextStepsInstructions,
        restfulService,
        extensionSDK,
        dashboardMetadata,
        setQuerySummaries,
        setLoadingStates,
        core40SDK,
        calculatedDrillLinkPatterns
      );

      setLinkedDashboardSummaries(result.linkedDashboardSummaries);

      // Generate final summary including linked dashboards
      if (
        result.originalSummaries.length > 0 ||
        result.linkedDashboardSummaries.length > 0
      ) {
        await generateFinalSummary(
          result.originalSummaries,
          restfulService,
          extensionSDK,
          setFinalSummary,
          nextStepsInstructions,
          result.linkedDashboardSummaries
        );
      }

      setIsExpanded(false);

      // Process rendered data after regeneration
      await onAllQueriesComplete(
        queryResults,
        dashboardMetadata,
        (_result) => {}
      );
    } catch (error) {
      console.error("Error generating summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const canGenerateSummary = useMemo(() => {
    return (
      nextStepsInstructions.trim().length > 0 &&
      !loadingDashboardMetadata &&
      !dashboard_element_config?.editing &&
      dashboardMetadata.dashboardId &&
      dashboardMetadata.dashboardId !== "undefined" &&
      dashboardMetadata.queries &&
      dashboardMetadata.queries.length > 0 &&
      queryResults.length > 0
    );
  }, [
    nextStepsInstructions,
    loadingDashboardMetadata,
    dashboard_element_config?.editing,
    dashboardMetadata,
    queryResults,
  ]);

  if (!hasInitialized) {
    return (
      <LandingContainer>
        {runSummaryOnLoad && canGenerateSummary ? (
          <RunOnLoad
            dashboardMetadata={dashboardMetadata}
            handleInitialGenerate={handleInitialGenerate}
            loading={loading || loadingDashboardMetadata}
            nextStepsInstructions={nextStepsInstructions}
            elementConfigReady={!!dashboard_element_config?.element_config}
            isEditing={dashboard_element_config?.editing || false}
          />
        ) : null}
        <LandingHeader>
          <h2>Dashboard Summarization</h2>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <img
              height="auto"
              width={20}
              src={"https://www.svgrepo.com/show/354012/looker-icon.svg"}
            />
            Looker |
            <img
              height="auto"
              width={20}
              src={
                "https://lh3.googleusercontent.com/-1brN-k2sapOWO4gfdJKGEH8kZbfFjrzEMjNs1dl4u64PBH-yxVmB5vG2aHDatRudSByL3lwViUg1w"
              }
            />
            Vertex AI
          </div>
        </LandingHeader>
        <div>
          <h3>Next Steps Instructions:</h3>
          <p>
            Please provide business context for what recommendations you hope to
            have or select from a pre-provided prompt.
          </p>
          <div className="preset-prompts">
            <h3 className="preset-prompts-title">Select an Analysis Style</h3>
            <div className="preset-options">
              {PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset.id}
                  className={`button-formatting preset-option ${
                    selectedPreset === preset.id ? "active" : ""
                  }`}
                  onClick={() => handlePresetSelect(preset)}
                  disabled={queryResults.length === 0 ? true : false}
                >
                  <div className="preset-option-title">{preset.title}</div>
                  <div className="preset-option-description">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <PromptInput
            value={nextStepsInstructions}
            onChange={(e) => setNextStepsInstructions(e.target.value)}
            rows={10}
          />
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Button
              onClick={handleInitialGenerate}
              $variant="primary"
              disabled={loading || !nextStepsInstructions.trim()}
            >
              {loading ? "Generating..." : "Generate"}
              <img
                style={{ marginLeft: "8px" }}
                src="https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/summarize_auto/default/20px.svg"
                alt="Generate"
              />
            </Button>
            <ConfigDialog queryResults={queryResults} />
          </div>
        </div>
      </LandingContainer>
    );
  } else {
    return (
      <InitializedContainer
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        querySummaries={querySummaries}
        loadingStates={loadingStates}
        nextStepsInstructions={nextStepsInstructions}
        setNextStepsInstructions={setNextStepsInstructions}
        finalSummary={finalSummary}
        linkedDashboardSummaries={linkedDashboardSummaries}
        queryResults={queryResults}
        dashboardMetadata={dashboardMetadata}
        loading={loading}
        handleRegenerate={handleRegenerate}
        workspaceOauth={workspaceOauth}
        slackOauth={slackOauth}
        deepResearch={deepResearch}
        showQa={dashboard_element_config?.element_config?.showQa || false}
        restfulService={restfulService}
      />
    );
  }
};
