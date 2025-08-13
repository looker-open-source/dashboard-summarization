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

import { KeyboardArrowDown } from "@styled-icons/material";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import useExtensionSdk from "../hooks/useExtensionSdk";
import { DashboardMetadata, LoadingStates } from "../types";
import { fetchQueryData } from "../utils/fetchQueryData";
import { onAllQueriesComplete } from "../utils/processRenderedData";
import ConfigDialog from "./ConfigDialog";
import { Button, PromptInput } from "./DashboardSummarization";
import MarkdownComponent from "./MarkdownComponent";

const RENDER_DELAY = 1000;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--background);
  color: var(--text-primary);
  overflow: hidden;
`;

// Add these styled components with the others
const Overlay = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 998; // Just below the actions bar
  opacity: ${(props) => (props.$isVisible ? 1 : 0)};
  visibility: ${(props) => (props.$isVisible ? "visible" : "hidden")};
  transition: opacity 300ms ease-in-out, visibility 300ms ease-in-out;
`;

const CollapsibleSectionHeader = styled.div<{ $isClickable?: boolean }>`
  background-color: var(--surface);
  border-radius: 8px 8px 0 0;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
  cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};
  user-select: none;
  transition: background-color 200ms ease-in-out;
  margin-bottom: 0;

  ${(props) =>
    props.$isClickable &&
    `
    &:hover {
      background-color: var(--surface-hover);
    }
  `}
`;

const SectionHeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  flex: 1;
`;

const SectionHeaderTitle = styled.h3`
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

const CollapseIcon = styled.div<{ $isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 200ms ease-in-out;
  transform: rotate(${(props) => (props.$isCollapsed ? "0deg" : "180deg")});
  color: var(--text-secondary);

  svg {
    width: 20px;
  }
`;

const ContentContainer = styled.div`
  padding: 8px;
  background-color: var(--surface);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CollapsibleSectionContent = styled.div<{ $isCollapsed: boolean }>`
  max-height: ${(props) => (props.$isCollapsed ? "0" : "none")};
  overflow: hidden;
  transition: max-height 300ms ease-in-out;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ActionsBarContainer = styled.div<{ $isExpanded: boolean }>`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--actions-bar-bg);
  padding: 6px 8px;
  box-shadow: var(--shadow-md);
  transition: all 300ms ease-in-out;
  z-index: 999;
  transform: translateY(${(props) => (props.$isExpanded ? "-100%" : "0")});

  ${(props) =>
    props.$isExpanded &&
    `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 600px;
    border-radius: 8px;
    height: auto;
    max-height: 80vh;
    overflow-y: auto;
  `}
`;

const Content = styled.div<{ $isBlurred: boolean }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px;
  padding-bottom: 80px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  transition: all 300ms ease-in-out;
  filter: ${(props) => (props.$isBlurred ? "blur(4px)" : "none")};
  pointer-events: ${(props) => (props.$isBlurred ? "none" : "auto")};
  min-width: 0;
`;

const NestedItem = styled.div<{ $isLast: boolean }>`
  margin-bottom: ${(props) => (props.$isLast ? "0" : "6px")};
  padding: 4px;
  background-color: var(--surface);
  border-radius: 6px;
  border: 1px solid var(--border);
  min-width: 0;
  flex: 1;
`;

const NestedItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  min-width: 0;
  flex: 1;
`;

const NestedItemTitle = styled.span`
  font-weight: 500;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

const NestedItemContent = styled.div`
  margin-bottom: 8px;
  min-width: 0;
  flex: 1;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
`;

const LinkedDashboardItemTitle = styled.h4`
  margin-bottom: 8px;
  color: var(--primary-700);
  font-size: 1rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const DynamicOpacityItem = styled(NestedItem)<{ $opacity: number }>`
  opacity: ${(props) => props.$opacity};
  transition: opacity 0.3s ease-in-out;
  min-width: 0;
  flex: 1;
`;

const ExportLabel = styled.span`
  opacity: 0.8;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const LoadingIndicator = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 4px;

  &::after {
    content: "";
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid var(--primary-200);
    border-top-color: var(--primary-500);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const MainContentSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const InitializedContainer: React.FC<{
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  querySummaries: string[];
  loadingStates: LoadingStates;
  nextStepsInstructions: string;
  setNextStepsInstructions: (nextStepsInstructions: string) => void;
  finalSummary: string;
  linkedDashboardSummaries: {
    dashboardId: string;
    dashboardTitle: string;
    summaries: string[];
  }[];
  queryResults: Awaited<ReturnType<typeof fetchQueryData>>;
  dashboardMetadata: DashboardMetadata;
  loading: boolean;
  handleRegenerate: () => void;
  workspaceOauth: () => void;
  slackOauth: () => void;
  deepResearch: boolean;
}> = ({
  isExpanded,
  setIsExpanded,
  querySummaries,
  loadingStates,
  nextStepsInstructions,
  setNextStepsInstructions,
  finalSummary,
  linkedDashboardSummaries,
  queryResults,
  dashboardMetadata,
  loading,
  handleRegenerate,
  workspaceOauth,
  slackOauth,
  deepResearch,
}) => {
  const extensionSDK = useExtensionSdk();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderedRef = useRef(false);
  const [isLinkedDashboardsCollapsed, setIsLinkedDashboardsCollapsed] =
    useState(true);

  const [isTileInsightsCollapsed, setIsTileInsightsCollapsed] = useState(false);
  const [
    isDashboardDeepResearchCollapsed,
    setIsDashboardDeepResearchCollapsed,
  ] = useState(false);

  const renderComplete = useCallback(() => {
    if (!renderedRef.current) {
      extensionSDK.rendered();
      renderedRef.current = true;
    }
  }, [extensionSDK]);

  useLayoutEffect(() => {
    if (querySummaries.length > 0) {
      timeoutRef.current = setTimeout(() => {
        try {
          renderComplete();
        } catch (error) {
          console.error("Error rendering data:", error);
        }
      }, RENDER_DELAY);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [querySummaries, renderComplete]);

  const toggleLinkedDashboardsCollapse = () => {
    setIsLinkedDashboardsCollapsed((p) => !p);
  };

  const toggleTileInsightsCollapse = () => {
    setIsTileInsightsCollapsed((p) => !p);
  };

  const toggleDashboardDeepResearchCollapse = () => {
    setIsDashboardDeepResearchCollapsed((p) => !p);
  };

  return (
    <Container>
      <Content $isBlurred={isExpanded}>
        {querySummaries.length > 0 && (
          <MainContentSection>
            <CollapsibleSectionHeader
              onClick={deepResearch ? toggleTileInsightsCollapse : undefined}
              $isClickable={deepResearch}
            >
              <SectionHeaderContent>
                <SectionHeaderTitle>Tile Insights</SectionHeaderTitle>
                {deepResearch && (
                  <CollapseIcon $isCollapsed={isTileInsightsCollapsed}>
                    <KeyboardArrowDown />
                  </CollapseIcon>
                )}
              </SectionHeaderContent>
            </CollapsibleSectionHeader>

            <CollapsibleSectionContent
              $isCollapsed={deepResearch ? isTileInsightsCollapsed : false}
            >
              <ContentContainer>
                {querySummaries.map((summary, index) => (
                  <DynamicOpacityItem
                    key={index}
                    $isLast={index === querySummaries.length - 1}
                    $opacity={loadingStates[`query-${index}`] ? 0.7 : 1}
                  >
                    <NestedItemHeader>
                      <NestedItemTitle>
                        {queryResults[index]?.title || `Query ${index + 1}`}
                      </NestedItemTitle>
                      {loadingStates[`query-${index}`] && (
                        <LoadingIndicator>Generating...</LoadingIndicator>
                      )}
                    </NestedItemHeader>
                    <NestedItemContent>
                      <MarkdownComponent data={[summary]} />
                    </NestedItemContent>
                  </DynamicOpacityItem>
                ))}
              </ContentContainer>
            </CollapsibleSectionContent>
          </MainContentSection>
        )}

        {/* Display final summary */}
        {finalSummary && (
          <MainContentSection>
            <CollapsibleSectionHeader
              onClick={toggleDashboardDeepResearchCollapse}
              $isClickable={true}
            >
              <SectionHeaderContent>
                <SectionHeaderTitle>
                  Dashboard {deepResearch ? "Deep Research" : "Summary"}
                </SectionHeaderTitle>
                <CollapseIcon $isCollapsed={isDashboardDeepResearchCollapsed}>
                  <KeyboardArrowDown />
                </CollapseIcon>
              </SectionHeaderContent>
            </CollapsibleSectionHeader>

            <CollapsibleSectionContent
              $isCollapsed={isDashboardDeepResearchCollapsed}
            >
              <ContentContainer>
                <MarkdownComponent data={[finalSummary]} />
              </ContentContainer>
            </CollapsibleSectionContent>
          </MainContentSection>
        )}

        {/* Display linked dashboard summaries */}
        {linkedDashboardSummaries.length > 0 && (
          <MainContentSection>
            <CollapsibleSectionHeader
              onClick={toggleLinkedDashboardsCollapse}
              $isClickable={true}
            >
              <SectionHeaderContent>
                <SectionHeaderTitle>
                  Linked Dashboard Summaries
                </SectionHeaderTitle>
                <CollapseIcon $isCollapsed={isLinkedDashboardsCollapsed}>
                  <KeyboardArrowDown />
                </CollapseIcon>
              </SectionHeaderContent>
            </CollapsibleSectionHeader>

            <CollapsibleSectionContent
              $isCollapsed={isLinkedDashboardsCollapsed}
            >
              <ContentContainer>
                {linkedDashboardSummaries.map(
                  (linkedDashboard, dashboardIndex) => (
                    <NestedItem
                      key={`linked-${dashboardIndex}`}
                      $isLast={
                        dashboardIndex === linkedDashboardSummaries.length - 1
                      }
                    >
                      <LinkedDashboardItemTitle>
                        {linkedDashboard.dashboardTitle}
                      </LinkedDashboardItemTitle>
                      {linkedDashboard.summaries.map(
                        (summary, summaryIndex) => (
                          <NestedItemContent
                            key={`linked-summary-${dashboardIndex}-${summaryIndex}`}
                          >
                            <MarkdownComponent data={[summary]} />
                          </NestedItemContent>
                        )
                      )}
                    </NestedItem>
                  )
                )}
              </ContentContainer>
            </CollapsibleSectionContent>
          </MainContentSection>
        )}
      </Content>

      <Overlay $isVisible={isExpanded} onClick={() => setIsExpanded(false)} />
      <ActionsBarContainer $isExpanded={isExpanded}>
        {isExpanded ? (
          <>
            <PromptInput
              value={nextStepsInstructions}
              onChange={(e) => setNextStepsInstructions(e.target.value)}
              placeholder="Provide business context for what recommendations you hope to have..."
            />
            <ActionButtons>
              <div>
                <Button
                  onClick={() => setIsExpanded(false)}
                  $variant="secondary"
                >
                  Cancel
                </Button>
              </div>
              <Button
                onClick={handleRegenerate}
                $variant="primary"
                disabled={loading || !nextStepsInstructions.trim()}
              >
                {loading ? "Generating..." : "Generate Summary"}
              </Button>
            </ActionButtons>
          </>
        ) : (
          <ActionButtons>
            <Button onClick={() => setIsExpanded(true)} $variant="primary">
              Regenerate Summary
            </Button>
            <Button
              onClick={async () => {
                if (queryResults.length > 0) {
                  await onAllQueriesComplete(
                    queryResults,
                    dashboardMetadata,
                    (result) => {
                      console.log("Manual rendered data processing:", result);
                      // You can add UI feedback here
                    }
                  );
                }
              }}
              disabled={queryResults.length === 0}
              $variant="secondary"
            >
              Process Rendered Data
            </Button>
            <ExportButtons>
              <ExportLabel>Export</ExportLabel>
              <Button
                onClick={workspaceOauth}
                disabled={loading || querySummaries.length === 0}
              >
                <img
                  height={20}
                  width={20}
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Google_Chat_icon_%282020%29.svg/1024px-Google_Chat_icon_%282020%29.svg.png"
                  alt="Google Chat"
                />
              </Button>
              <Button
                onClick={slackOauth}
                disabled={loading || querySummaries.length === 0}
              >
                <img
                  height={20}
                  width={20}
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Google_Chat_icon_%282020%29.svg/1024px-Google_Chat_icon_%282020%29.svg.png"
                  alt="Slack"
                />
              </Button>
            </ExportButtons>
          </ActionButtons>
        )}
      </ActionsBarContainer>
      <ConfigDialog queryResults={queryResults} />
    </Container>
  );
};

export default InitializedContainer;
