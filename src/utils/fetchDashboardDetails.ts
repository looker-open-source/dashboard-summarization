import { Filters } from "@looker/extension-sdk";
import { DashboardMetadata, Query } from "../types";

const applyFilterToListeners = (data, filters, dashboardFilters) => {
  if (dashboardFilters !== null) {
    const filterListeners = data.filter((item) => item.listen.length > 0);
    filterListeners.forEach((filter) => {
      filter.listen.forEach((listener) => {
        filters[listener.field] = dashboardFilters[listener.dashboard_filter_name];
      });
    });
    return filters;
  }
  return {};
};

export const fetchDashboardDetails = async (
  dashboardId: string,
  core40SDK: any,
  extensionSDK: any,
  dashboardFilters: Filters
): Promise<DashboardMetadata> => {
  const { description } = await core40SDK.ok(core40SDK.dashboard(dashboardId, 'description'));

  const queries = await core40SDK.ok(core40SDK.dashboard_dashboard_elements(
    dashboardId, 'query,result_maker,note_text,title,query_id'))
    .then((res) => {
      return res.filter((d) => d.query !== null || d.result_maker !== null)
        .map((data) => {
          const { query, note_text, title } = data;
          if (data.query !== null) {
            const { fields, dynamic_fields, view, model, filters, pivots, sorts, limit, column_limit, row_total, subtotals } = query;
            const newFilters = applyFilterToListeners(data.result_maker?.filterables, filters || {}, dashboardFilters);
            return { queryBody: { fields, dynamic_fields, view, model, filters: newFilters, pivots, sorts, limit, column_limit, row_total, subtotals }, note_text, title };
          } else if (data.result_maker!.query !== null) {
            const { fields, dynamic_fields, view, model, filters, pivots, sorts, limit, column_limit, row_total, subtotals } = data.result_maker!.query;
            const newFilters = applyFilterToListeners(data.result_maker?.filterables, filters || {}, dashboardFilters);
            return { queryBody: { fields, dynamic_fields, view, model, filters: newFilters, pivots, sorts, limit, column_limit, row_total, subtotals }, note_text, title };
          } else {
            return undefined;
          }
        });
    });

  await extensionSDK.localStorageSetItem(`${dashboardId}:${JSON.stringify(dashboardFilters)}`, JSON.stringify({ dashboardFilters, dashboardId, queries, description }));
  return { dashboardFilters, dashboardId, queries, description };
};