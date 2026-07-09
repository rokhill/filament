export interface PaginationResponse<T> {
  data: T[];
  links: Links;
  meta: Meta;
}

interface Links {
  first: string;
  last: string;
  prev: null;
  next: null;
}

export interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  links: Link[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

interface Link {
  url: null | string;
  label: string;
  active: boolean;
}
