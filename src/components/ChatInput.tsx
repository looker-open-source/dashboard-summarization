import { ExtensionSDK } from "@looker/extension-sdk";
import { KeyboardArrowDown } from "@styled-icons/material";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { LinkedDashboardSummary } from "../types";
import { generateAnswer } from "../utils/generateAnswer";
import { generateQuestions } from "../utils/generateQuestions";
import MarkdownComponent from "./MarkdownComponent";

// Styled Components

const ChatHeader = styled.div<{ $isClickable?: boolean }>`
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

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  flex: 1;
`;

const HeaderTitle = styled.h3`
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

const ChatContent = styled.div<{ $isCollapsed: boolean }>`
  max-height: ${(props) => (props.$isCollapsed ? "0" : "none")};
  overflow: hidden;
  transition: max-height 300ms ease-in-out;
  min-width: 0;
  flex: ${(props) => (props.$isCollapsed ? "0" : "1")};
  display: ${(props) => (props.$isCollapsed ? "none" : "flex")};
  flex-direction: column;
  padding: 8px;
  background-color: var(--surface);
  border-radius: 0 0 8px 8px;
`;

const ChatMessages = styled.div`
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Message = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  margin-bottom: 8px;
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  background-color: ${(props) =>
    props.$isUser ? "var(--primary-500)" : "var(--neutral-200)"};
  color: ${(props) => (props.$isUser ? "white" : "var(--text-primary)")};
  font-size: 0.9rem;
  word-wrap: break-word;
  line-height: 1.4;
`;

const ChatInputContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid var(--border);
  background-color: var(--surface);
`;

const Input = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background-color: var(--surface);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 200ms ease-in-out;

  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 2px var(--primary-100);
  }

  &:disabled {
    background-color: var(--neutral-100);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  background-color: var(--primary-500);
  color: white;
  font-size: 14px;

  &:hover:not(:disabled) {
    background-color: var(--primary-600);
  }

  &:disabled {
    background-color: var(--neutral-200);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  padding: 4px 8px;
  background-color: var(--neutral-100);
  border-radius: 4px;
  align-self: center;

  &::after {
    content: "";
    display: inline-block;
    width: 12px;
    height: 12px;
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

const QuestionsContainer = styled.div`
  padding: 4px 12px;
  border-top: 1px solid var(--border);
  background-color: var(--surface-hover);
`;

const QuestionsTitle = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
`;

const QuestionsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  line-height: 1.1;
`;

const QuestionText = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.65rem;
  cursor: pointer;
  text-align: left;
  transition: color 150ms ease-in-out;
  line-height: 1.1;
  white-space: normal;
  word-wrap: break-word;

  &:hover {
    color: var(--primary-600);
  }

  &:active {
    color: var(--primary-700);
  }
`;

const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SkeletonText = styled.div`
  background: linear-gradient(
    90deg,
    var(--neutral-200) 25%,
    var(--neutral-100) 50%,
    var(--neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  height: 12px;
  width: 120px;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInputProps {
  querySummaries: any[];
  restfulService: string;
  extensionSDK: ExtensionSDK;
  nextStepsInstructions: string;
  linkedDashboardSummaries?: LinkedDashboardSummary[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  querySummaries,
  restfulService,
  extensionSDK,
  nextStepsInstructions,
  linkedDashboardSummaries,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(true);
  const initRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatMessages = messagesEndRef.current.parentElement;
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initRef.current) return;
    if (
      querySummaries.length > 0 ||
      (linkedDashboardSummaries && linkedDashboardSummaries.length > 0)
    ) {
      initRef.current = true;
      retrieveQuestions(querySummaries, linkedDashboardSummaries || []);
    }
  }, [
    querySummaries,
    linkedDashboardSummaries,
    restfulService,
    extensionSDK,
    nextStepsInstructions,
  ]);

  const retrieveQuestions = async (
    querySummaries: string[],
    linkedDashboardSummaries: LinkedDashboardSummary[]
  ) => {
    setIsGeneratingQuestions(true);
    try {
      await generateQuestions(
        querySummaries,
        restfulService,
        extensionSDK,
        setQuestions,
        nextStepsInstructions,
        linkedDashboardSummaries
      );
    } catch (error) {
      setQuestions([]);
      console.error("Error generating questions:", error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const sendMessage = async (questionText: string) => {
    if (!questionText.trim() || isGenerating) return;

    // Check if we have content to work with
    if (querySummaries.length === 0) {
      addMessage(
        "Please wait for the dashboard summary to be generated before asking questions.",
        false
      );
      return;
    }

    const question = questionText.trim();
    addMessage(question, true);
    setIsGenerating(true);

    try {
      // Build conversation context from previous messages
      const conversationContext = messagesRef.current
        .filter((msg) => !msg.isUser) // Only include AI responses
        .map((msg) => msg.text)
        .join("\n\n");

      // Call generateAnswer with the question and context
      await generateAnswer(
        querySummaries,
        restfulService,
        extensionSDK,
        (answer: string) => {
          // Add the AI response to messages
          addMessage(answer, false);
        },
        question,
        linkedDashboardSummaries,
        conversationContext
      );
    } catch (error) {
      console.error("Error generating QA response:", error);
      addMessage(
        "Sorry, I encountered an error while processing your question. Please try again.",
        false
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (overrideInputValue?: string) => {
    await sendMessage(overrideInputValue || inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuestionClick = (question: string, index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    handleSendMessage(question);
  };

  return (
    <>
      <ChatHeader
        id="x"
        onClick={onToggleCollapse}
        $isClickable={!!onToggleCollapse}
      >
        <HeaderContent>
          <HeaderTitle>Ask Questions About Your Dashboard</HeaderTitle>
          {onToggleCollapse && (
            <CollapseIcon $isCollapsed={isCollapsed}>
              <KeyboardArrowDown />
            </CollapseIcon>
          )}
        </HeaderContent>
      </ChatHeader>

      <ChatContent id="y" $isCollapsed={isCollapsed}>
        <ChatMessages>
          {messages.length === 0 && !isGenerating && (
            <Message $isUser={false}>
              <MessageBubble $isUser={false}>
                <MarkdownComponent
                  data={[
                    "Hi! I can help you understand your dashboard data. Ask me anything about the insights, trends, or specific questions you have.",
                  ]}
                />
              </MessageBubble>
            </Message>
          )}

          {messages.map((message) => (
            <Message key={message.id} $isUser={message.isUser}>
              <MessageBubble $isUser={message.isUser}>
                {message.isUser ? (
                  message.text
                ) : (
                  <MarkdownComponent data={[message.text]} />
                )}
              </MessageBubble>
            </Message>
          ))}

          {isGenerating && (
            <Message $isUser={false}>
              <LoadingIndicator>Generating response...</LoadingIndicator>
            </Message>
          )}

          <div ref={messagesEndRef} />
        </ChatMessages>

        {(isGeneratingQuestions || questions.length > 0) && (
          <QuestionsContainer>
            <QuestionsTitle>Questions</QuestionsTitle>
            {isGeneratingQuestions ? (
              <SkeletonContainer>
                <SkeletonText />
              </SkeletonContainer>
            ) : (
              <QuestionsList>
                {questions.map((question, index) => (
                  <React.Fragment key={index}>
                    <QuestionText
                      onClick={() => handleQuestionClick(question, index)}
                    >
                      {question}
                    </QuestionText>
                  </React.Fragment>
                ))}
              </QuestionsList>
            )}
          </QuestionsContainer>
        )}

        <ChatInputContainer id="z">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your dashboard data..."
            disabled={isGenerating}
          />
          <SendButton
            onClick={() => handleSendMessage()}
            disabled={isGenerating || !inputValue.trim()}
          >
            Send
          </SendButton>
        </ChatInputContainer>
      </ChatContent>
    </>
  );
};

export default ChatInput;
