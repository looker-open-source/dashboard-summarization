import { Filters } from "@looker/extension-sdk";

export interface Query {
  queryBody: {
    fields: any;
    dynamic_fields?: any;
    view: any;
    model: any;
    filters?: any;
    pivots?: any;
    sorts?: any;
    limit?: any;
    column_limit?: any;
    row_total?: any;
    subtotals?: any;
  };
  note_text: string;
  title: string;
}
export interface DashboardMetadata {
  dashboardFilters: Filters | undefined;
  dashboardId: string | undefined;
  queries: Query[];
  indexedFilters?: {
    [key: string]: {
      dimension: string;
      explore: string;
      model: string;
    };
  };
  description?: string | undefined;
}
export interface Query {
  queryBody: {
    fields: any;
    dynamic_fields?: any;
    view: any;
    model: any;
    filters?: any;
    pivots?: any;
    sorts?: any;
    limit?: any;
    column_limit?: any;
    row_total?: any;
    subtotals?: any;
  };
  note_text: string;
  title: string;
}

export interface QuerySummary {
  queryTitle: string;
  description: string;
  summary: string;
  nextSteps: string[];
}

export interface SummaryDataContextType {
  data: string[];
  setData: React.Dispatch<React.SetStateAction<string[]>>;
  formattedData: string;
  setFormattedData: React.Dispatch<React.SetStateAction<string>>;
  querySuggestions: string[];
  setQuerySuggestions: React.Dispatch<React.SetStateAction<string[]>>;
  info: boolean;
  setInfo: React.Dispatch<React.SetStateAction<boolean>>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  dashboardURL: string;
  setDashboardURL: React.Dispatch<React.SetStateAction<string>>;
}

export interface LoadingStates {
  [key: string]: boolean;
}

export interface LinkedDashboardSummary {
  dashboardId: string;
  dashboardUrl: string;
  dashboardTitle: string;
  summaries: string[];
}
