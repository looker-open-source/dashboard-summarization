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

import React, { useCallback, useContext, useEffect, useState } from 'react'
import { ExtensionContext, ExtensionContextData } from '@looker/extension-sdk-react'
import MarkdownComponent from './MarkdownComponent'
import useWorkspaceOauth from '../hooks/useWorkspaceOauth'
import { SummaryDataContext } from '../contexts/SummaryDataContext'
import useSlackOauth from '../hooks/useSlackOauth'
import { fetchDashboardDetails } from '../utils/fetchDashboardDetails'
import { DashboardMetadata, Query, QuerySummary, SummaryDataContextType, LoadingStates } from '../types'
import { fetchQueryData } from '../utils/fetchQueryData'
import { collateSummaries } from '../utils/collateSummaries'
import { generateQuerySuggestions } from '../utils/generateQuerySuggestions'
import styled, { keyframes } from 'styled-components';

interface PresetPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'executive',
    title: 'Executive Style',
    description: 'High-level insights focused on business impact',
    prompt: 'Analyze this dashboard with an executive mindset. Focus on key business metrics, strategic implications, and actionable insights. Keep the language concise and emphasize bottom-line impact.'
  },
  {
    id: 'analyst',
    title: 'Analyst Style',
    description: 'Detailed analysis with statistical context',
    prompt: 'Provide a detailed analytical breakdown of this dashboard. Include statistical significance where relevant, highlight correlations, and provide data-driven recommendations. Focus on trends and patterns in the data.'
  },
  {
    id: 'stakeholder',
    title: 'Stakeholder Style',
    description: 'Balanced overview for diverse audiences',
    prompt: 'Summarize this dashboard for key stakeholders. Balance technical insights with business context, highlight progress towards goals, and identify areas needing attention. Include both achievements and opportunities for improvement.'
  },
  {
    id: 'action',
    title: 'Action-Oriented',
    description: 'Focus on next steps and recommendations',
    prompt: 'Analyze this dashboard with a focus on actionable insights. Prioritize specific recommendations, outline clear next steps, and identify immediate opportunities for optimization or improvement.'
  }
];

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--background);
  color: var(--text-primary);
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
  opacity: ${props => props.$isVisible ? 1 : 0};
  visibility: ${props => props.$isVisible ? 'visible' : 'hidden'};
  transition: opacity 300ms ease-in-out, visibility 300ms ease-in-out;
`;

const ActionsBarContainer = styled.div<{ $isExpanded: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--actions-bar-bg);
  padding: 16px 24px;
  box-shadow: var(--shadow-md);
  transition: all 300ms ease-in-out;
  z-index: 999;
  transform: translateY(${props => props.$isExpanded ? '-100%' : '0'});

  ${props => props.$isExpanded && `
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
  padding: 24px;
  transition: all 300ms ease-in-out;
  filter: ${props => props.$isBlurred ? 'blur(4px)' : 'none'};
  pointer-events: ${props => props.$isBlurred ? 'none' : 'auto'};
`;

const SummarySection = styled.div`
  background-color: var(--surface);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 300ms ease-in-out;

  &:hover {
    box-shadow: var(--shadow-md);
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  background-color: ${props => props.$variant === 'primary' ? 'var(--primary-500)' : 'var(--neutral-200)'};
  color: ${props => props.$variant === 'primary' ? 'white' : 'var(--text-primary)'};

  &:hover {
    background-color: ${props => props.$variant === 'primary' ? 'var(--primary-600)' : 'var(--neutral-300)'};
  }

  &:disabled {
    background-color: var(--neutral-200);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
`;

const PromptInput = styled.textarea`
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

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const LandingContainer = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  overflow-y:scroll;
`;

const LandingHeader = styled.div`
  margin-bottom: 24px;
`;

const LoadingIndicator = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;

  &::after {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid var(--primary-200);
    border-top-color: var(--primary-500);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export const DashboardSummarization: React.FC = () => {
  const { extensionSDK, tileHostData, core40SDK, lookerHostData } = useContext(ExtensionContext) as ExtensionContextData
  const { dashboardFilters, dashboardId } = tileHostData
  const [dashboardMetadata, setDashboardMetadata] = useState<DashboardMetadata>({ dashboardFilters: {}, dashboardId: '', queries: [], description: '' })
  const [loadingDashboardMetadata, setLoadingDashboardMetadata] = useState<boolean>(false)
  const [querySummaries, setQuerySummaries] = useState<any[]>([])
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [nextStepsInstructions, setNextStepsInstructions] = useState<string>('');
  const { data, setData, formattedData, setFormattedData, setQuerySuggestions, info, setInfo, message, setMessage, setDashboardURL } = useContext(SummaryDataContext) as SummaryDataContextType
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});
  const workspaceOauth = useWorkspaceOauth()
  const slackOauth = useSlackOauth()
  const restfulService = process.env.RESTFUL_WEBSERVICE || ''
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (preset: PresetPrompt) => {
    setSelectedPreset(preset.id);
    setNextStepsInstructions(preset.prompt);
  };

  useEffect(() => {
    if (tileHostData.dashboardRunState === 'RUNNING') {
      setData([])
      setLoading(false)
    }
  }, [tileHostData.dashboardRunState, setData, setLoading])

  // Update the message when the dashboard metadata is loaded
  useEffect(() => {
    if (message && message.includes('Loaded Dashboard Metadata') || message.includes("Google Chat") || message.includes("Slack")) {
      setTimeout(() => {
        setInfo(false)
      }, 1000)
    }
  }, [message])

  // Run each query in the dashboard to get query data
  useEffect(() => {
    if (dashboardMetadata.queries.length <= 0) return;
    const fetchQueryResults = async () => {
      if (dashboardMetadata.queries.length > 0) {
        const results = await fetchQueryData(dashboardMetadata.queries, core40SDK);
        setQueryResults(results);
      }
    };

    fetchQueryResults();
  }, [dashboardMetadata.queries, core40SDK]);

  const fetchQueryMetadata = useCallback( async () => {
    if (dashboardId && dashboardId !== 'undefined') {
        setLoadingDashboardMetadata(true)
        const { description, queries } = await fetchDashboardDetails(dashboardId, core40SDK, extensionSDK, dashboardFilters)
        if (!loadingDashboardMetadata) {
          await extensionSDK.localStorageSetItem(`${dashboardId}:${JSON.stringify(dashboardFilters)}`, JSON.stringify({ dashboardFilters, dashboardId, queries, description }))
          setDashboardMetadata({ dashboardFilters, dashboardId, queries, description })
        }
      }
    },[dashboardId,dashboardFilters])

  // Fetch dashboard metadata, including description and queries
  useEffect(() => {
    fetchQueryMetadata()
  }, [fetchQueryMetadata]);

  // Generate query suggestions
  const generateSuggestions = async (querySummaries: QuerySummary[]) => {
    await generateQuerySuggestions(querySummaries, restfulService, extensionSDK, setQuerySuggestions, nextStepsInstructions);
  };

  const handleInitialGenerate = async () => {
    if (!nextStepsInstructions.trim()) return;
    setLoading(true);
    setQuerySummaries([]); // Clear existing summaries
    try {
      await collateSummaries(
        queryResults,
        nextStepsInstructions,
        restfulService,
        extensionSDK,
        dashboardMetadata,
        setQuerySummaries,
        setLoadingStates
      );
      setHasInitialized(true);
    } catch (error) {
      console.error('Error generating summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!nextStepsInstructions.trim()) return;
    setLoading(true);
    setQuerySummaries([]); // Clear existing summaries
    try {
      await collateSummaries(
        queryResults,
        nextStepsInstructions,
        restfulService,
        extensionSDK,
        dashboardMetadata,
        setQuerySummaries,
        setLoadingStates
      );
      setIsExpanded(false);
    } catch (error) {
      console.error('Error generating summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasInitialized) {
    return (
      <LandingContainer>
        <LandingHeader>
          <h2>Dashboard Summarization</h2>
          <div style={{display:'flex',justifyContent:'flex-start'}}>
            <img 
              height="auto"
              width={20}
              src={'https://www.svgrepo.com/show/354012/looker-icon.svg'}
            />Looker |
            <img
              height="auto"
              width={20}
              src={'https://lh3.googleusercontent.com/-1brN-k2sapOWO4gfdJKGEH8kZbfFjrzEMjNs1dl4u64PBH-yxVmB5vG2aHDatRudSByL3lwViUg1w'}
            />Vertex AI
          </div>
        </LandingHeader>
        <div>
          <h3>Next Steps Instructions:</h3>
          <p>Please provide business context for what recommendations you hope to have or select from a pre-provided prompt.</p>
          <div className="preset-prompts">
            <h3 className="preset-prompts-title">Select an Analysis Style</h3>
            <div className="preset-options">
              {PRESET_PROMPTS.map((preset) => (
                <button
                  key={preset.id}
                  className={`button-formatting preset-option ${selectedPreset === preset.id ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(preset)}
                  disabled={queryResults.length === 0 ? true : false}
                >
                  <div className="preset-option-title">{preset.title}</div>
                  <div className="preset-option-description">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>
          <PromptInput
            value={nextStepsInstructions}
            onChange={(e) => setNextStepsInstructions(e.target.value)}
            rows={10}
          />
          <Button
            onClick={handleInitialGenerate}
            $variant="primary"
            disabled={loading || !nextStepsInstructions.trim()}
          >
            {loading ? "Generating..." : "Generate"}
            <img
              style={{ marginLeft: '8px' }}
              src="https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/summarize_auto/default/20px.svg"
              alt="Generate"
            />
          </Button>
        </div>
      </LandingContainer>
    );
  }

  return (
    <Container>
      <Content $isBlurred={isExpanded}>
        {querySummaries.length > 0 && (
          <div className="summary-scroll">
            {querySummaries.map((summary, index) => (
              <SummarySection 
                key={index}
                style={{
                  opacity: loadingStates[`query-${index}`] ? 0.7 : 1,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}>
                  {loadingStates[`query-${index}`] && (
                    <LoadingIndicator>Generating...</LoadingIndicator>
                  )}
                </div>
                <MarkdownComponent data={[summary]} />
              </SummarySection>
            ))}
          </div>
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
                <Button onClick={() => setIsExpanded(false)} $variant="secondary">
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
            <ExportButtons>
              <span style={{ opacity: 0.8 }}>Export</span>
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
                  src="https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg"
                  alt="Slack"
                />
              </Button>
            </ExportButtons>
          </ActionButtons>
        )}
      </ActionsBarContainer>
    </Container>
  );
};