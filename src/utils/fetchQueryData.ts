import { Query } from '../types';

export const fetchQueryData = async (queries: Query[], core40SDK: any): Promise<any[]> => {
  console.log('fetchQueryData queries', queries);
  const queryPromises = queries.map(async (query) => {
    try {
      const response = await core40SDK.ok(core40SDK.run_inline_query({
        body: query.queryBody,
        result_format: 'json'
      }));
      
      return { ...query, queryData: response.length > 100 ? response.slice(0,100) : response };
    } catch (error) {
      console.error('Error fetching query data:', error);
      return null;
    }
  });

  const queryResults = await Promise.all(queryPromises);
  console.log('fetchQueryData queryResults', queryResults);
  return queryResults.filter(result => result !== null);
};