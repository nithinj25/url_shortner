export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UrlItem {
  _id: string;
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  clicks: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  owner: string;
}

export interface ClickItem {
  _id: string;
  urlId: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  createdAt: string;
}

export interface UrlStats {
  url: {
    shortCode: string;
    originalUrl: string;
    isActive: boolean;
    expiresAt?: string | null;
    createdAt: string;
  };
  stats: {
    totalClicks: number;
    topCountry: string;
    topDevice: string;
    lastClicked: string | null;
  };
}

export interface AnalyticsOverview {
  totalClicks: number;
  clicksLast7Days: number;
  uniqueCountries: number;
  totalUrls: number;
}

export interface TimelinePoint {
  date: string;
  clicks: number;
}

export interface BreakdownItem {
  _id: string;
  count: number;
}

export interface BreakdownData {
  devices:   BreakdownItem[];
  browsers:  BreakdownItem[];
  countries: BreakdownItem[];
  os:        BreakdownItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    clicks: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
    };
  };
}