import React, { useState } from "react";
import styled from "styled-components";
import { useDashboardElement } from "../DashboardElementContext";
import { fetchQueryData, IQueryLink } from "../utils/fetchQueryData";
import filterLinks from "../utils/filterLinks";

// Styled Components
const SettingsButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  background-color: var(--neutral-200);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: var(--neutral-300);
  }

  &:disabled {
    background-color: var(--neutral-200);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.$isOpen ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--surface);
  border-radius: 8px;
  padding: 12px;
  width: 90vw;
  height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--neutral-200);
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: var(--neutral-200);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background-color: var(--surface);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 200ms ease-in-out;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px var(--primary-100);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background-color: var(--surface);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 200ms ease-in-out;
  box-sizing: border-box;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px var(--primary-100);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--primary-500);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const CheckboxLabel = styled.label`
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 14px;

  &:has(input:disabled) {
    color: var(--text-disabled);
    cursor: not-allowed;
  }
`;

const TagInputContainer = styled.div`
  margin-top: 8px;
`;

const TagInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background-color: var(--surface);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 200ms ease-in-out;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px var(--primary-100);
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: var(--primary-100);
  color: var(--primary-700);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const TagCloseButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-600);
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;

  &:hover {
    background-color: var(--primary-200);
  }
`;

const ExamplesContainer = styled.div`
  margin-top: 12px;
  padding: 12px;
  background-color: var(--neutral-100);
  border-radius: 6px;
  border: 1px solid var(--neutral-200);
`;

const ExamplesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
`;

const ExamplesTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms ease-in-out;

  &:hover {
    background-color: var(--neutral-200);
  }
`;

const ExamplesContent = styled.div<{ $isCollapsed: boolean }>`
  max-height: ${(props) => (props.$isCollapsed ? "0" : "200px")};
  overflow: hidden;
  transition: max-height 200ms ease-in-out;
  margin-top: ${(props) => (props.$isCollapsed ? "0" : "8px")};
`;

const ExamplesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
`;

const ExampleLink = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background-color: var(--surface);
  border: 1px solid var(--neutral-200);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-primary);
`;

const MatchedExampleLink = styled(ExampleLink)`
  background-color: var(--primary-50);
  border-color: var(--primary-200);
  border-left: 3px solid var(--primary-500);
`;

const UnmatchedExampleLink = styled(ExampleLink)`
  background-color: var(--neutral-50);
  border-color: var(--neutral-300);
  opacity: 0.7;
`;

const LinkLabel = styled.span`
  font-weight: 500;
  color: var(--primary-600);
`;

const MatchedLinkLabel = styled(LinkLabel)`
  color: var(--primary-700);
`;

const UnmatchedLinkLabel = styled(LinkLabel)`
  color: var(--text-secondary);
`;

const LinkUrl = styled.span`
  color: var(--text-secondary);
  font-family: monospace;
  word-break: break-all;
`;

const LinkType = styled.span`
  background-color: var(--neutral-200);
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease-in-out;
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

interface ConfigDialogProps {
  onSettingsClick?: () => void;
  queryResults?: Awaited<ReturnType<typeof fetchQueryData>>;
}

export const ConfigDialog: React.FC<ConfigDialogProps> = ({
  onSettingsClick,
  queryResults = [],
}) => {
  const context = useDashboardElement();
  const { editing, element_config, updateArtifact } = context || {};

  const [isOpen, setIsOpen] = useState(true);
  const [defaultPrompt, setDefaultPrompt] = useState(
    element_config?.defaultPrompt || ""
  );
  const [runSummaryOnLoad, setRunSummaryOnLoad] = useState(
    element_config?.runSummaryOnLoad || false
  );
  const [deepResearch, setDeepResearch] = useState(
    element_config?.deepResearch || false
  );
  const [drillLinkPatterns, setDrillLinkPatterns] = useState<string[]>(
    element_config?.drillLinkPatterns || []
  );
  const [tagInputValue, setTagInputValue] = useState("");
  const [isExamplesCollapsed, setIsExamplesCollapsed] = useState(true);

  // Extract all drill links from query results
  const allDrillLinks = queryResults
    .flatMap((result) => result.drills || [])
    .filter(
      (link, index, self) =>
        // Remove duplicates based on URL
        index === self.findIndex((l) => l.url === link.url)
    ) as IQueryLink[];

  // Filter links based on patterns
  const matchedLinks =
    drillLinkPatterns.length > 0
      ? filterLinks(allDrillLinks, drillLinkPatterns)
      : [];
  const unmatchedLinks =
    drillLinkPatterns.length > 0
      ? allDrillLinks.filter((link) => !matchedLinks.includes(link))
      : allDrillLinks;

  // Only show the settings button when editing is true
  if (!editing) {
    return null;
  }

  const resetValue = (
    name:
      | "defaultPrompt"
      | "runSummaryOnLoad"
      | "deepResearch"
      | "drillLinkPatterns"
  ) => {
    switch (name) {
      case "defaultPrompt":
        setDefaultPrompt(element_config?.defaultPrompt || "");
        break;
      case "runSummaryOnLoad":
        setRunSummaryOnLoad(element_config?.runSummaryOnLoad || false);
        break;
      case "deepResearch":
        setDeepResearch(element_config?.deepResearch || false);
        break;
      case "drillLinkPatterns":
        setDrillLinkPatterns(element_config?.drillLinkPatterns || []);
        break;
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    onSettingsClick?.();
    resetValue("defaultPrompt");
    resetValue("runSummaryOnLoad");
    resetValue("deepResearch");
    resetValue("drillLinkPatterns");
    setTagInputValue("");
  };

  const handleClose = () => {
    resetValue("defaultPrompt");
    resetValue("runSummaryOnLoad");
    resetValue("deepResearch");
    resetValue("drillLinkPatterns");
    setTagInputValue("");
    setIsOpen(false);
  };

  const handleSave = async () => {
    try {
      await updateArtifact?.({
        defaultPrompt: defaultPrompt,
        runSummaryOnLoad: runSummaryOnLoad,
        deepResearch: deepResearch,
        drillLinkPatterns: drillLinkPatterns,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInputValue.trim()) {
      e.preventDefault();
      const newTag = tagInputValue.trim();
      if (!drillLinkPatterns.includes(newTag)) {
        setDrillLinkPatterns([...drillLinkPatterns, newTag]);
      }
      setTagInputValue("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setDrillLinkPatterns(
      drillLinkPatterns.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <>
      <SettingsButton onClick={handleOpen}>
        Settings
        <img
          style={{ marginLeft: "8px" }}
          src="https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/settings/default/20px.svg"
          alt="Settings"
        />
      </SettingsButton>

      <ModalOverlay $isOpen={isOpen} onClick={handleClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>Settings</ModalTitle>
            <CloseButton onClick={handleClose}>&times;</CloseButton>
          </ModalHeader>

          <FormGroup>
            <Label htmlFor="default-prompt-input">Default Prompt</Label>
            <TextArea
              id="default-prompt-input"
              value={defaultPrompt}
              onChange={(e) => setDefaultPrompt(e.target.value)}
              placeholder="Enter default prompt..."
            />
          </FormGroup>

          <FormGroup>
            <CheckboxContainer>
              <Checkbox
                id="run-summary-on-load"
                type="checkbox"
                checked={runSummaryOnLoad}
                onChange={(e) => setRunSummaryOnLoad(e.target.checked)}
                disabled={!defaultPrompt.trim()}
              />
              <CheckboxLabel htmlFor="run-summary-on-load">
                Run Summary On Load
              </CheckboxLabel>
            </CheckboxContainer>
          </FormGroup>

          <FormGroup>
            <CheckboxContainer>
              <Checkbox
                id="deep-research"
                type="checkbox"
                checked={deepResearch}
                onChange={(e) => setDeepResearch(e.target.checked)}
              />
              <CheckboxLabel htmlFor="deep-research">
                Deep Research
              </CheckboxLabel>
            </CheckboxContainer>

            {deepResearch && (
              <TagInputContainer>
                <Label htmlFor="drill-link-patterns-input">
                  Drill Link Patterns
                </Label>
                <TagInput
                  id="drill-link-patterns-input"
                  type="text"
                  value={tagInputValue}
                  onChange={(e) => setTagInputValue(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Enter pattern and press Enter..."
                />
                {drillLinkPatterns.length > 0 && (
                  <TagsContainer>
                    {drillLinkPatterns.map((tag, index) => (
                      <Tag key={index}>
                        {tag}
                        <TagCloseButton
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </TagCloseButton>
                      </Tag>
                    ))}
                  </TagsContainer>
                )}

                {allDrillLinks.length > 0 && (
                  <ExamplesContainer>
                    <ExamplesHeader
                      onClick={() =>
                        setIsExamplesCollapsed(!isExamplesCollapsed)
                      }
                    >
                      <ExamplesTitle>
                        Collected Drill Links ({allDrillLinks.length})
                        {drillLinkPatterns.length > 0 && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "10px",
                              opacity: 0.7,
                            }}
                          >
                            {matchedLinks.length} matched,{" "}
                            {unmatchedLinks.length} unmatched
                          </span>
                        )}
                      </ExamplesTitle>
                      <CollapseButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExamplesCollapsed(!isExamplesCollapsed);
                        }}
                      >
                        <img
                          src={
                            isExamplesCollapsed
                              ? "https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/expand_more/default/20px.svg"
                              : "https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/expand_less/default/20px.svg"
                          }
                          alt={isExamplesCollapsed ? "Expand" : "Collapse"}
                        />
                      </CollapseButton>
                    </ExamplesHeader>
                    <ExamplesContent $isCollapsed={isExamplesCollapsed}>
                      <ExamplesList>
                        {matchedLinks.map((link, index) => (
                          <MatchedExampleLink key={`matched-${index}`}>
                            <MatchedLinkLabel>{link.label}</MatchedLinkLabel>
                            <LinkUrl>{link.url}</LinkUrl>
                            <LinkType>{link.type}</LinkType>
                          </MatchedExampleLink>
                        ))}
                        {matchedLinks.length > 0 &&
                          unmatchedLinks.length > 0 && (
                            <div
                              style={{
                                height: "1px",
                                backgroundColor: "var(--neutral-200)",
                                margin: "8px 0",
                                opacity: 0.5,
                              }}
                            />
                          )}
                        {unmatchedLinks.map((link, index) => (
                          <UnmatchedExampleLink key={`unmatched-${index}`}>
                            <UnmatchedLinkLabel>
                              {link.label}
                            </UnmatchedLinkLabel>
                            <LinkUrl>{link.url}</LinkUrl>
                            <LinkType>{link.type}</LinkType>
                          </UnmatchedExampleLink>
                        ))}
                      </ExamplesList>
                    </ExamplesContent>
                  </ExamplesContainer>
                )}
              </TagInputContainer>
            )}
          </FormGroup>

          <ButtonGroup>
            <Button onClick={handleSave} $variant="primary">
              Save
            </Button>
          </ButtonGroup>
        </ModalContent>
      </ModalOverlay>
    </>
  );
};

export default ConfigDialog;
