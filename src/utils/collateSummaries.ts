import { Query, DashboardMetadata, QuerySummary } from '../types';
import { fetchQuerySummary } from './fetchQuerySummary';

export const collateSummaries = async (
  queryResults: any[],
  restfulService: string,
  extensionSDK: any,
  dashboardMetadata: DashboardMetadata,
  setQuerySummaries: (summaries: (prevSummaries: QuerySummary[]) => QuerySummary[]) => void
): Promise<QuerySummary[]> => {
  console.log('collateSummaries queryResults', queryResults);
  if (!queryResults || queryResults.length === 0) {
    // throw an error
    console.error('No query results to collate');
    return [];
  }
  try {
    // Generate query summaries for each query result
    const querySummaries: QuerySummary[] = await Promise.all(
      queryResults.map(async (queryResult) => {
        const querySummary = await fetchQuerySummary(queryResult, restfulService, extensionSDK, dashboardMetadata);
        if (querySummary) {
          setQuerySummaries((prevSummaries: QuerySummary[]) => [...prevSummaries, querySummary]);
          return querySummary;
        }
        throw new Error('Failed to generate query summary');
      })
    );

    return querySummaries;
  } catch (error) {
    console.error('Error collating summaries:', error);
    return [];
  }
};