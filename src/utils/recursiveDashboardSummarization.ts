import { ExtensionSDK } from "@looker/extension-sdk";
import { Looker40SDK } from "@looker/extension-sdk/node_modules/@looker/sdk/lib/4.0/methods";
import React from "react";
import {
  DashboardMetadata,
  LinkedDashboardSummary,
  LoadingStates,
  QuerySummary,
} from "../types";
import { collateSummaries } from "./collateSummaries";
import { fetchDashboardDetails } from "./fetchDashboardDetails";
import { fetchQueryData, IQueryLink } from "./fetchQueryData";
import filterLinks from "./filterLinks";

interface RecursiveSummaryResult {
  originalSummaries: QuerySummary[];
  linkedDashboardSummaries: LinkedDashboardSummary[];
}

export const extractDashboardLinks = (
  queryResults: any[],
  drillLinkPatterns: string[] = []
): IQueryLink[] => {
  const allLinks: IQueryLink[] = [];

  queryResults.forEach((queryResult) => {
    if (queryResult.drills && Array.isArray(queryResult.drills)) {
      allLinks.push(...queryResult.drills);
    }
  });
  // Filter for dashboard links
  let dashboardLinks = filterLinks(allLinks, ["*/dashboards/*"]);
  if (drillLinkPatterns.length > 0) {
    dashboardLinks = filterLinks(dashboardLinks, drillLinkPatterns);
  }

  // Remove duplicates based on URL
  const uniqueLinks = dashboardLinks.filter(
    (link, index, self) => index === self.findIndex((l) => l.url === link.url)
  );

  return uniqueLinks;
};

export const extractDashboardInfoFromUrl = (
  url: string
): { dashboardId: string | null; filters: any } => {
  // Extract dashboard ID from URL patterns like:
  // /dashboards/123
  // /dashboards/123?param=value
  const match = url.match(/\/dashboards\/(\d+)/);
  const dashboardId = match ? match[1] : null;

  // Extract filters from query parameters
  // Examples:
  // /dashboards/123?filters[user_id]=456&filters[date]=2024-01-01
  // /dashboards/123?user_id=456&date=2024-01-01
  const filters: any = {};
  try {
    const urlObj = new URL(url, "https://looker.com"); // Base URL for parsing
    urlObj.searchParams.forEach((value, key) => {
      // Skip non-filter parameters
      if (key !== "dashboard" && key !== "embed_domain") {
        filters[key] = value;
      }
    });
  } catch (error) {
    console.warn(`Could not parse URL parameters from: ${url}`, error);
  }

  return { dashboardId, filters };
};

export const processLinkedDashboards = async (
  dashboardLinks: IQueryLink[],
  core40SDK: Looker40SDK,
  extensionSDK: ExtensionSDK,
  restfulService: string,
  nextStepsInstructions: string,
  setLoadingStates: React.Dispatch<React.SetStateAction<any>>
): Promise<LinkedDashboardSummary[]> => {
  const linkedDashboardSummaries: LinkedDashboardSummary[] = [];

  for (const link of dashboardLinks) {
    const { dashboardId, filters } = extractDashboardInfoFromUrl(link.url);
    if (!dashboardId) {
      console.warn(`Could not extract dashboard ID from URL: ${link.url}`);
      continue;
    }

    try {
      // Fetch dashboard details with extracted filters
      const dashboardMetadata = await fetchDashboardDetails(
        dashboardId,
        core40SDK,
        extensionSDK,
        filters
      );

      if (
        !dashboardMetadata.queries ||
        dashboardMetadata.queries.length === 0
      ) {
        continue;
      }

      // Fetch query data for the linked dashboard
      const queryResults = await fetchQueryData(
        dashboardMetadata.queries,
        core40SDK
      );

      if (!queryResults || queryResults.length === 0) {
        continue;
      }

      // Generate summaries for the linked dashboard
      const summaries = await collateSummaries(
        queryResults,
        nextStepsInstructions,
        restfulService,
        extensionSDK,
        dashboardMetadata,
        () => {}, // We don't need to update state for linked dashboards
        setLoadingStates
      );

      linkedDashboardSummaries.push({
        dashboardId,
        dashboardTitle: link.label || `Dashboard ${dashboardId}`,
        summaries: summaries.map((summary: QuerySummary | string) =>
          typeof summary === "string" ? summary : summary.summary
        ),
        dashboardUrl: link.url,
      });
    } catch (error) {
      console.error(`Error processing linked dashboard ${dashboardId}:`, error);
    }
  }

  return linkedDashboardSummaries;
};

export const recursiveDashboardSummarization = async (
  queryResults: any[],
  nextStepsInstructions: string,
  restfulService: string,
  extensionSDK: ExtensionSDK,
  dashboardMetadata: DashboardMetadata,
  setQuerySummaries: (summaries: any[]) => void,
  setLoadingStates: React.Dispatch<React.SetStateAction<LoadingStates>>,
  core40SDK: Looker40SDK,
  drillLinkPatterns: string[] | null
): Promise<{
  originalSummaries: any[];
  linkedDashboardSummaries: any[];
}> => {
  // First, generate summaries for the current dashboard
  const originalSummaries = await collateSummaries(
    queryResults,
    nextStepsInstructions,
    restfulService,
    extensionSDK,
    dashboardMetadata,
    setQuerySummaries,
    setLoadingStates
  );

  // Extract dashboard links from the current dashboard's query results
  // If null, no dashboard links will be extracted. Used when deep research is enabled and patterns are provided
  const dashboardLinks = drillLinkPatterns
    ? extractDashboardLinks(queryResults, drillLinkPatterns)
    : [];

  // Process linked dashboards (one layer deep)
  let linkedDashboardSummaries: LinkedDashboardSummary[] = [];
  if (dashboardLinks.length > 0) {
    linkedDashboardSummaries = await processLinkedDashboards(
      dashboardLinks,
      core40SDK,
      extensionSDK,
      restfulService,
      nextStepsInstructions,
      setLoadingStates
    );
  }

  return {
    originalSummaries,
    linkedDashboardSummaries,
  };
};
