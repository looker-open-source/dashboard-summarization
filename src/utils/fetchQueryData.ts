import { Looker40SDK } from "@looker/extension-sdk/node_modules/@looker/sdk/lib/4.0/methods";
import { Query } from "../types";

export interface IQueryLink {
  label: string;
  url: string;
  type: string;
}

interface IInlineQueryResponseData {
  value: any;
  rendered?: string;
  links?: IQueryLink[];
}

interface IInlineQueryResponse {
  status: string;
  from_cache: boolean;
  id: string;
  result_source: string;
  supports_pivot_in_db: boolean;
  null_sort_treatment: string;
  expired: boolean;
  ran_at: string;
  aggregate_table_used_info: any;
  runtime: string;
  added_params: any;
  forecast_result: any;
  dialect_specific_metadata: Record<string, any>;
  sql: string;
  sql_explain: string;
  fields: {
    measures: any[];
    dimensions: any[];
    table_calculations: any[];
    pivots: any[];
  };
  fill_fields: any[];
  has_totals: boolean;
  has_row_totals: boolean;
  applied_filters: Record<string, any>;
  always_filter: Record<string, any>;
  conditionally_filter_applied: Record<string, any>;
  applied_filter_expression: string | null;
  number_format: string | null;
  explore: {
    name: string;
    label: string;
    description: string | null;
  };
  timezone: string;
  data: Record<string, IInlineQueryResponseData>[];
  drill_menu_build_time: number;
  has_subtotals: boolean;
}

export const fetchQueryData = async (
  queries: Query[],
  core40SDK: Looker40SDK
) => {
  console.log("fetchQueryData queries", queries);
  const queryPromises = queries.map(async (query) => {
    try {
      const response = (await core40SDK.ok(
        core40SDK.run_inline_query({
          body: query.queryBody,
          result_format: "json_detail",
          generate_drill_links: true,
          server_table_calcs: true,
        })
      )) as unknown as IInlineQueryResponse;

      const rows =
        response.data.length > 100
          ? response.data.slice(0, 100)
          : response.data;

      const data_links = rows.reduce(
        (acc, row) => {
          const curr_row = {} as Record<
            string,
            Omit<IInlineQueryResponseData, "links">
          >;
          Object.entries(row).forEach(([key, { links, ...value }]) => {
            curr_row[key] = value;
            if (links?.length) {
              acc["links"] = [...acc.links, ...(links || [])];
            }
          });
          acc.data.push(curr_row);
          return acc;
        },
        {
          data: [],
          links: [],
        } as {
          data: Record<string, Omit<IInlineQueryResponseData, "links">>[];
          links: IQueryLink[];
        }
      );

      return {
        ...query,
        queryData: data_links.data,
        drills: data_links.links,
        query_id: response.id,
      };
    } catch (error) {
      console.error("Error fetching query data:", error);
      return null;
    }
  });

  const queryResults = await Promise.all(queryPromises);
  console.log("fetchQueryData queryResults", queryResults);
  return queryResults.filter((result) => result !== null);
};
