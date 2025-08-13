# Recursive Dashboard Summarization

This feature extends the dashboard summarization functionality to automatically discover and summarize linked dashboards through drill links.

## Overview

When a dashboard contains drill links that point to other dashboards (`/dashboards/*` URLs), the extension will:

1. Extract all dashboard drill links from the current dashboard's query results
2. Filter for links that match the pattern `*/dashboards/*`
3. For each linked dashboard:
   - Fetch the dashboard details and queries
   - Run the same summarization process on the linked dashboard
   - Include the linked dashboard summaries in the final comprehensive summary

## How It Works

### 1. Link Extraction
The `extractDashboardLinks` function:
- Collects all drill links from query results
- Filters for dashboard links using the existing `filterLinks` utility
- Removes duplicate links based on URL

### 2. Dashboard Info Extraction
The `extractDashboardInfoFromUrl` function:
- Extracts dashboard IDs from URLs like `/dashboards/123` or `/dashboards/123?param=value`
- Extracts dashboard filters from URL query parameters
- Returns both dashboard ID and filters for proper dashboard context

### 3. Recursive Processing
The `processLinkedDashboards` function:
- Iterates through each dashboard link
- Fetches dashboard metadata and queries
- Runs the summarization process on each linked dashboard
- Collects all summaries for inclusion in the final summary

### 4. Final Summary Generation
The enhanced `generateFinalSummary` function:
- Combines original dashboard summaries with linked dashboard summaries
- Sends all data to the backend for comprehensive analysis
- Generates a final summary that includes insights from all related dashboards

## UI Components

### Linked Dashboard Summaries Section
- Displays summaries from linked dashboards in a separate section
- Each linked dashboard is shown with its title and summaries
- Styled with a blue left border to distinguish from main dashboard summaries

### Comprehensive Summary Section
- Shows the final summary that includes insights from all dashboards
- Styled with a green left border and background to highlight its importance
- Appears after both the main dashboard summaries and linked dashboard summaries

## Backend Changes

The `/generateSummary` endpoint now accepts:
```json
{
  "querySummaries": [...],
  "nextStepsInstructions": "...",
  "linkedDashboardSummaries": [
    {
      "dashboardId": "123",
      "dashboardTitle": "Sales Dashboard",
      "summaries": [...]
    }
  ]
}
```

The backend prompt has been enhanced to include linked dashboard summaries in the analysis.

## Usage

The feature works automatically when:
1. A dashboard contains drill links to other dashboards
2. The user generates summaries using the "Generate" or "Regenerate Summary" buttons
3. The extension will automatically discover and process linked dashboards
4. Dashboard filters are automatically extracted from drill link URL parameters and applied to linked dashboards

## Limitations

- Only processes one layer deep (doesn't recursively process dashboards linked from linked dashboards)
- Requires the linked dashboards to be accessible to the current user
- Linked dashboard processing inherits filters from the drill link URL parameters

## Error Handling

- Failed linked dashboard processing is logged but doesn't stop the main summarization
- Invalid dashboard URLs are skipped with warning messages
- Empty or inaccessible linked dashboards are handled gracefully

## Performance Considerations

- Linked dashboard processing adds additional API calls
- Processing time scales with the number of linked dashboards
- Each linked dashboard requires fetching metadata, queries, and generating summaries 