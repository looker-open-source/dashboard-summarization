export interface RenderedDataResult {
  processedData: any[];
  summary: string;
  insights: string[];
}

/**
 * Process rendered data after all queries are complete
 * This function can be called once all query data has been fetched and displayed
 */
export const processRenderedData = (
  queryResults: any[],
  dashboardMetadata: any
): RenderedDataResult => {
  const processedData: any[] = [];
  const insights: string[] = [];

  // Process each query result
  queryResults.forEach((queryResult, index) => {
    if (queryResult && queryResult.queryData) {
      const renderedData = queryResult.queryData.map((row: any) => {
        const processedRow: any = {};

        // Process each field in the row
        Object.entries(row).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === "object" && "rendered" in value) {
            // Use rendered value if available, otherwise fall back to raw value
            processedRow[key] = value.rendered || value.value;

            // Extract insights from rendered data
            if (value.rendered && typeof value.rendered === "string") {
              // You can add custom logic here to extract insights
              // For example, looking for patterns, trends, or anomalies
              if (
                value.rendered.includes("%") ||
                value.rendered.includes("change")
              ) {
                insights.push(`Field ${key} shows: ${value.rendered}`);
              }
            }
          } else {
            processedRow[key] = value;
          }
        });

        return processedRow;
      });

      processedData.push({
        queryTitle: queryResult.title,
        renderedData,
        drills: queryResult.drills || [],
      });
    }
  });

  // Generate summary of processed data
  const summary = `Processed ${processedData.length} queries with rendered data for dashboard ${dashboardMetadata.dashboardId}`;

  return {
    processedData,
    summary,
    insights,
  };
};

/**
 * Call this function after all queries are complete and data is displayed
 * You can integrate this with your existing dashboard summarization flow
 */
export const onAllQueriesComplete = async (
  queryResults: any[],
  dashboardMetadata: any,
  callback?: (result: RenderedDataResult) => void
): Promise<RenderedDataResult> => {
  const result = processRenderedData(queryResults, dashboardMetadata);

  // Call optional callback if provided
  if (callback) {
    callback(result);
  }

  return result;
};
