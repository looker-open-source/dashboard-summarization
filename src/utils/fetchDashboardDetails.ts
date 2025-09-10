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
    console.log("from function: ", dashboardId,dashboardFilters)
  const { description } = await core40SDK.ok(core40SDK.dashboard(dashboardId, 'description'));

  let queries: any;
  if (dashboardId.includes('::')) {
    const { dashboard_elements } = await core40SDK.ok(core40SDK.dashboard(dashboardId, 'dashboard_elements'));
    queries = dashboard_elements;
  } else {
    queries = await core40SDK.ok(core40SDK.dashboard_dashboard_elements(
      dashboardId, 'query,result_maker,note_text,title,query_id'));
  }

  queries = queries.filter((d: any) => d.query !== null || d.result_maker !== null)
    .map((data: any) => {
      const { query, note_text, title } = data;
      if (data.query !== null) {
        const { fields, dynamic_fields, view, model, filters, pivots, sorts, limit, column_limit, row_total, subtotals } = query;
        const newFilters = applyFilterToListeners(data.result_maker?.filterables, filters || {}, dashboardFilters);
        return { queryBody: { fields, dynamic_fields, view, model, filters: newFilters, pivots, sorts, limit, column_limit, row_total, subtotals }, note_text, title };
      } else if (data.result_maker?.query !== null) {
        const { fields, dynamic_fields, view, model, filters, pivots, sorts, limit, column_limit, row_total, subtotals } = data.result_maker!.query;
        const newFilters = applyFilterToListeners(data.result_maker?.filterables, filters || {}, dashboardFilters);
        return { queryBody: { fields, dynamic_fields, view, model, filters: newFilters, pivots, sorts, limit, column_limit, row_total, subtotals }, note_text, title };
      } else {
        return undefined;
      }
    });

  await extensionSDK.localStorageSetItem(`${dashboardId}:${JSON.stringify(dashboardFilters)}`, JSON.stringify({ dashboardFilters, dashboardId, queries, description }));
  console.log({ dashboardFilters, dashboardId, queries, description })
  return { dashboardFilters, dashboardId, queries, description };
};