import { Filters } from "@looker/extension-sdk";
import { DashboardMetadata, Query, DashboardElement } from "../types";

const applyFilterToListeners = (data: any, filters: any, dashboardFilters: any) => {
  if (dashboardFilters !== null && data) {
    const filterListeners = data.filter((item: any) => item.listen.length > 0);
    filterListeners.forEach((filter: any) => {
      filter.listen.forEach((listener: any) => {
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

  let queries: DashboardElement[];
  if (dashboardId.includes('::')) {
    const { dashboard_elements } = await core40SDK.ok(core40SDK.dashboard(dashboardId, 'dashboard_elements'));
    queries = dashboard_elements;
  } else {
    queries = await core40SDK.ok(core40SDK.dashboard_dashboard_elements(
      dashboardId, 'query,result_maker,note_text,title,query_id'));
  }

  const mappedQueries: Query[] = queries.reduce((acc: Query[], data: DashboardElement) => {
    const { note_text, title } = data;
    const querySource = data.query || data.result_maker?.query;

    if (querySource) {
      const { fields, dynamic_fields, view, model, filters, pivots, sorts, limit, column_limit, row_total, subtotals } = querySource;
      const newFilters = applyFilterToListeners(data.result_maker?.filterables, filters || {}, dashboardFilters);
      acc.push({ queryBody: { fields, dynamic_fields, view, model, filters: newFilters, pivots, sorts, limit, column_limit, row_total, subtotals }, note_text, title });
    }
    return acc;
  }, []);

  await extensionSDK.localStorageSetItem(`${dashboardId}:${JSON.stringify(dashboardFilters)}`, JSON.stringify({ dashboardFilters, dashboardId, queries: mappedQueries, description }));
  console.log({ dashboardFilters, dashboardId, queries, description })
  return { dashboardFilters, dashboardId, queries: mappedQueries, description };
};