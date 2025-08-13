import { ExtensionSDK, Filters } from "@looker/extension-sdk";
import { Looker40SDK } from "@looker/extension-sdk/node_modules/@looker/sdk/lib/4.0/methods";
import { IResultMakerFilterables } from "@looker/sdk";
import { DashboardMetadata } from "../types";

const applyFilterToListeners = (
  data: IResultMakerFilterables[] | null | undefined,
  filters: Filters,
  dashboardFilters: Filters
) => {
  if (dashboardFilters !== null) {
    if (!data) return filters;
    const filterListeners = data.filter(
      (item) => item.listen && item.listen.length > 0
    );
    if (!filterListeners) return filters;
    filterListeners.forEach((filter) => {
      filter.listen?.forEach((listener) => {
        if (
          listener.field &&
          listener.dashboard_filter_name &&
          dashboardFilters[listener.dashboard_filter_name]
        ) {
          filters[listener.field] =
            dashboardFilters[listener.dashboard_filter_name];
        }
      });
    });
    return filters;
  }
  return {};
};

export const fetchDashboardDetails = async (
  dashboardId: string,
  core40SDK: Looker40SDK,
  extensionSDK: ExtensionSDK,
  dashboardFilters: Filters
): Promise<DashboardMetadata> => {
  console.log("from function: ", dashboardId, dashboardFilters);
  const { description } = await core40SDK.ok(
    core40SDK.dashboard(dashboardId, "description")
  );

  const queries = await core40SDK
    .ok(
      core40SDK.dashboard_dashboard_elements(
        dashboardId,
        "query,result_maker,note_text,title,query_id"
      )
    )
    .then((res) => {
      return res
        .filter((d) => d.query !== null || d.result_maker !== null)
        .map((data) => {
          const { query, note_text, title } = data;
          if (data.query !== null) {
            const {
              fields,
              dynamic_fields,
              view,
              model,
              filters,
              pivots,
              sorts,
              limit,
              column_limit,
              row_total,
              subtotals,
            } = query || {};
            const newFilters = applyFilterToListeners(
              data.result_maker?.filterables,
              filters || {},
              dashboardFilters
            );
            return {
              queryBody: {
                fields,
                dynamic_fields,
                view,
                model,
                filters: newFilters,
                pivots,
                sorts,
                limit,
                column_limit,
                row_total,
                subtotals,
              },
              note_text: note_text || "",
              title: title || "",
            };
          } else if (data.result_maker?.query !== null) {
            const {
              fields,
              dynamic_fields,
              view,
              model,
              filters,
              pivots,
              sorts,
              limit,
              column_limit,
              row_total,
              subtotals,
            } = data.result_maker?.query || {};
            const newFilters = applyFilterToListeners(
              data.result_maker?.filterables,
              filters || {},
              dashboardFilters
            );
            return {
              queryBody: {
                fields,
                dynamic_fields,
                view,
                model,
                filters: newFilters,
                pivots,
                sorts,
                limit,
                column_limit,
                row_total,
                subtotals,
              },
              note_text: note_text || "",
              title: title || "",
            };
          } else {
            return undefined;
          }
        })
        .filter(
          (query): query is NonNullable<typeof query> => query !== undefined
        );
    });

  await extensionSDK.localStorageSetItem(
    `${dashboardId}:${JSON.stringify(dashboardFilters)}`,
    JSON.stringify({ dashboardFilters, dashboardId, queries, description })
  );
  console.log({ dashboardFilters, dashboardId, queries, description });
  return {
    dashboardFilters,
    dashboardId,
    queries: queries?.length ? queries : [],
    description: description || "",
  };
};
