import { ExtensionSDK } from "@looker/extension-sdk";
import { DashboardMetadata, LoadingStates, QuerySummary } from "../types";
import { fetchQuerySummary } from "./fetchQuerySummary";

export const collateSummaries = async (
  queryResults: any[],
  nextStepsInstructions: string,
  restfulService: string,
  extensionSDK: ExtensionSDK,
  dashboardMetadata: DashboardMetadata,
  setQuerySummaries: (summaries: QuerySummary[]) => void,
  setLoadingStates: React.Dispatch<React.SetStateAction<LoadingStates>>
): Promise<QuerySummary[]> => {
  if (!queryResults || queryResults.length === 0) {
    console.error("No query results to collate");
    return [];
  }

  // Initialize loading states for each query
  const initialLoadingStates: LoadingStates = queryResults.reduce(
    (acc, _, index) => {
      acc[`query-${index}`] = true;
      return acc;
    },
    {} as LoadingStates
  );
  setLoadingStates(initialLoadingStates);

  // Create an array to store all summaries
  const allSummaries: QuerySummary[] = [];

  try {
    // Create an array of promises but don't wait for all
    const summaryPromises = queryResults.map(async (queryResult, index) => {
      try {
        const querySummary = await fetchQuerySummary(
          queryResult,
          restfulService,
          extensionSDK,
          dashboardMetadata,
          nextStepsInstructions
        );

        if (querySummary) {
          // Update the allSummaries array and notify the component
          allSummaries[index] = querySummary;
          setQuerySummaries([...allSummaries].filter(Boolean));

          // Update loading state for this query
          setLoadingStates((prev: LoadingStates) => ({
            ...prev,
            [`query-${index}`]: false,
          }));

          return querySummary;
        }
        throw new Error(`Failed to generate summary for query ${index}`);
      } catch (error) {
        console.error(`Error processing query ${index}:`, error);
        // Update loading state even on error
        setLoadingStates((prev: LoadingStates) => ({
          ...prev,
          [`query-${index}`]: false,
        }));
        return null;
      }
    });

    // Use Promise.all instead of Promise.allSettled for older TypeScript versions
    // Filter out failed promises manually
    const results = await Promise.all(
      summaryPromises.map((p) =>
        p.catch((error) => {
          console.error("Summary generation error:", error);
          return null;
        })
      )
    );

    const completedSummaries = results.filter(
      (result): result is QuerySummary => result !== null
    );

    return completedSummaries;
  } catch (error) {
    console.error("Error in collateSummaries:", error);
    return allSummaries.filter(Boolean);
  }
};
