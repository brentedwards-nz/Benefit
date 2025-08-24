/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Meal {
  /** @example "Breakfast" */
  name?: string;
  /** @example "I eat every morning" */
  description?: string;
  mealFoods?: FoodItem[];
}

export interface FoodItem {
  /** @example 82782 */
  foodId?: number;
  /** @example 8 */
  amount?: number;
  /** @example 128 */
  unitId?: number;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "https://api.fitbit.com";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Fitbit Web API Explorer
 * @version 1
 * @termsOfService https://dev.fitbit.com/legal/platform-terms-of-service/
 * @baseUrl https://api.fitbit.com
 * @externalDocs https://dev.fitbit.com/build/reference/web-api/
 * @contact Web API Support (https://dev.fitbit.com/build/reference/web-api/help/)
 *
 * Fitbit provides a Web API for accessing data from Fitbit activity trackers, Aria scale, and manually entered logs. Anyone can develop an application to access and modify a Fitbit user's data on their behalf, so long as it complies with Fitbit Platform Terms of Service. These Swagger UI docs do not currently support making Fitbit API requests directly. In order to make a request, construct a request for the appropriate endpoint using this documentation, and then add an Authorization header to each request with an access token obtained using the steps outlined here: https://dev.fitbit.com/build/reference/web-api/developer-guide/authorization/.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  oauth2 = {
    /**
     * @description Retrieves an OAuth 2 access token.
     *
     * @tags Authorization
     * @name OauthToken
     * @summary Get OAuth 2 access token
     * @request POST:/oauth2/token
     */
    oauthToken: (
      query: {
        /** Authorization code received in the redirect as URI parameter. Required if using the Authorization Code flow. */
        code?: string;
        /** This is your Fitbit API application id from your settings on dev.fitbit.com. */
        client_id: string;
        /** Specify the desired access token lifetime. Defaults to 28800 for 8 hours. The other valid value is 3600 for 1 hour. */
        expires_in?: string;
        /** Authorization grant type. Valid values are 'authorization_code' and 'refresh_token'. */
        grant_type: string;
        /** Uri to which the access token will be sent if the request is successful. Required if specified in the redirect to the authorization page. Must be exact match. */
        redirect_uri?: string;
        /** Refresh token issued by Fitbit. Required if 'grant_type' is 'refresh_token'. */
        refresh_token?: string;
        /** Required if specified in the redirect uri of the authorization page. Must be an exact match. */
        state?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          access_token: string;
          expires_in: number;
          refresh_token: string;
          scope: string;
          token_type: string;
          user_id: string;
        },
        void
      >({
        path: `/oauth2/token`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * @description Revokes consent of the access token or refresh token
     *
     * @tags Authorization
     * @name Revoke
     * @summary Revokes consent of the access token or refresh token
     * @request POST:/oauth2/revoke
     * @secure
     */
    revoke: (
      data: {
        /** The access token or refresh token to be revoked */
        token: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/oauth2/revoke`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.UrlEncoded,
        ...params,
      }),
  };
  v11 = {
    /**
     * @description Retrieves the active state of an OAuth 2.0 token. It follows https://tools.ietf.org/html/rfc7662.
     *
     * @tags Authorization
     * @name Introspect
     * @summary Retrieve the active state of an OAuth 2.0 token
     * @request POST:/1.1/oauth2/introspect
     * @secure
     */
    introspect: (
      data: {
        /** OAuth 2.0 token to retrieve the state of */
        token: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1.1/oauth2/introspect`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.UrlEncoded,
        ...params,
      }),

    /**
     * @description Returns data of a user's friends in the format requested using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Friends
     * @name GetFriends
     * @summary Get Friends
     * @request GET:/1.1/user/-/friends.json
     * @secure
     */
    getFriends: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1.1/user/-/friends.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns data of a user's friends in the format requested using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Friends
     * @name GetFriendsLeaderboard
     * @summary Get Friends Leaderboard
     * @request GET:/1.1/user/-/leaderboard/friends.json
     * @secure
     */
    getFriendsLeaderboard: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1.1/user/-/leaderboard/friends.json`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  v1 = {
    /**
     * @description Returns the active zone minutes intraday data for a 24 hour period by specifying a date and/or time range.
     *
     * @tags Active Zone Minutes Intraday Time Series
     * @name GetAzmByDateIntraday
     * @summary Get AZM Intraday by Date
     * @request GET:/1/user/-/activities/active-zone-minutes/date/{date}/1d/{detail-level}.json
     * @secure
     */
    getAzmByDateIntraday: (
      date: string,
      detailLevel: "1min" | "5min" | "15min",
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/active-zone-minutes/date/${date}/1d/${detailLevel}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the active zone minutes intraday data for a 24 hour period by specifying a date and/or time range.
     *
     * @tags Active Zone Minutes Intraday Time Series
     * @name GetAzmByDateTimeSeriesIntraday
     * @summary Get AZM Intraday by Date
     * @request GET:/1/user/-/activities/active-zone-minutes/date/{date}/1d/{detail-level}/time/{start-time}/{end-time}.json
     * @secure
     */
    getAzmByDateTimeSeriesIntraday: (
      date: string,
      detailLevel: "1min" | "5min" | "15min",
      startTime: string,
      endTime: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/active-zone-minutes/date/${date}/1d/${detailLevel}/time/${startTime}/${endTime}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the active zone minutes intraday data for a 24 hour period by specifying a date range and/or time range.
     *
     * @tags Active Zone Minutes Intraday Time Series
     * @name GetAzmByIntervalIntraday
     * @summary Get AZM Intraday by Interval
     * @request GET:/1/user/-/activities/active-zone-minutes/date/{start-date}/{end-date}/{detail-level}.json
     * @secure
     */
    getAzmByIntervalIntraday: (
      startDate: string,
      endDate: string,
      detailLevel: "1min" | "5min" | "15min",
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/active-zone-minutes/date/${startDate}/${endDate}/${detailLevel}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the active zone minutes intraday data for a 24 hour period by specifying a date range and/or time range.
     *
     * @tags Active Zone Minutes Intraday Time Series
     * @name GetAzmByIntervalTimeSeriesIntraday
     * @summary Get AZM Intraday by Interval
     * @request GET:/1/user/-/activities/active-zone-minutes/date/{start-date}/{end-date}/time/{start-time}/{end-time}.json
     * @secure
     */
    getAzmByIntervalTimeSeriesIntraday: (
      startDate: string,
      endDate: string,
      detailLevel: "1min" | "5min" | "15min",
      startTime: string,
      endTime: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/active-zone-minutes/date/${startDate}/${endDate}/time/${startTime}/${endTime}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the daily summary values over a period of time by specifying a date and time period.
     *
     * @tags Active Zone Minutes Time Series
     * @name GetAzmTimeSeriesByDate
     * @summary Get AZM Time Series by Date
     * @request GET:/1/user/-/activities/active-zone-minutes/date/{date}/{period}.json
     * @secure
     */
    getAzmTimeSeriesByDate: (
      date: string,
      period: "1d" | "7d" | "30d" | "1w" | "1m" | "3m" | "6m" | "1y",
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/active-zone-minutes/date/${date}/${period}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the daily summary values over an interval by specifying a date range.
     *
     * @tags Active Zone Minutes Time Series
     * @name GetAzmTimeSeriesByInterval
     * @summary Get AZM Time Series by Interval
     * @request GET:/1/user/-/activities/active-zone-minutes/date/{start-date}/{end-date}.json
     * @secure
     */
    getAzmTimeSeriesByInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/active-zone-minutes/date/${startDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retrieves a summary and list of a user's activities and activity log entries for a given day.
     *
     * @tags Activity
     * @name GetActivitiesByDate
     * @summary Get Activity Summary by Date
     * @request GET:/1/user/-/activities/date/{date}.json
     * @secure
     */
    getActivitiesByDate: (date: string, params: RequestParams = {}) =>
      this.request<
        {
          activities: any[];
          goals: any;
          summary: {
            caloriesOut: number;
            distances: any[];
            fairlyActiveMinutes: number;
            lightlyActiveMinutes: number;
            marginalCalories: number;
            sedentaryMinutes: number;
            steps: number;
            veryActiveMinutes: number;
          };
        },
        void
      >({
        path: `/1/user/-/activities/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns activities time series data in the specified range for a given resource.
     *
     * @tags Activity Time Series
     * @name GetActivitiesResourceByDateRange
     * @summary Get Activity Resource by Date Range
     * @request GET:/1/user/-/activities/{resource-path}/date/{base-date}/{end-date}.json
     * @secure
     */
    getActivitiesResourceByDateRange: (
      resourcePath:
        | "calories"
        | "caloriesBMR"
        | "steps"
        | "distance"
        | "floors"
        | "elevation"
        | "minutesSedentary"
        | "minutesLightlyActive"
        | "minutesFairlyActive"
        | "minutesVeryActive"
        | "activityCalories",
      baseDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/${resourcePath}/date/${baseDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns time series data in the specified range for a given resource.
     *
     * @tags Activity Time Series
     * @name GetActivitiesTrackerResourceByDateRange
     * @summary Get Activity Tracker Resource by Date Range Time Series
     * @request GET:/1/user/-/activities/tracker/{resource-path}/date/{base-date}/{end-date}.json
     * @secure
     */
    getActivitiesTrackerResourceByDateRange: (
      resourcePath:
        | "calories"
        | "caloriesBMR"
        | "steps"
        | "distance"
        | "floors"
        | "elevation"
        | "minutesSedentary"
        | "minutesLightlyActive"
        | "minutesFairlyActive"
        | "minutesVeryActive"
        | "activityCalories",
      baseDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/tracker/${resourcePath}/date/${baseDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns time series data in the specified range for a given resource in the format requested using units in the unit system that corresponds to the Accept-Language header provided.
     *
     * @tags Activity Time Series
     * @name GetActivitiesResourceByDatePeriod
     * @summary Get Activity Time Series
     * @request GET:/1/user/-/activities/{resource-path}/date/{date}/{period}.json
     * @secure
     */
    getActivitiesResourceByDatePeriod: (
      resourcePath:
        | "calories"
        | "caloriesBMR"
        | "steps"
        | "distance"
        | "floors"
        | "elevation"
        | "minutesSedentary"
        | "minutesLightlyActive"
        | "minutesFairlyActive"
        | "minutesVeryActive"
        | "activityCalories",
      date: string,
      period: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/${resourcePath}/date/${date}/${period}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns time series data in the specified range for a given resource in the format requested using units in the unit system that corresponds to the Accept-Language header provided.
     *
     * @tags Activity Time Series
     * @name GetActivitiesTrackerResourceByDatePeriod
     * @summary Get Activity Time Series
     * @request GET:/1/user/-/activities/tracker/{resource-path}/date/{date}/{period}.json
     * @secure
     */
    getActivitiesTrackerResourceByDatePeriod: (
      resourcePath:
        | "calories"
        | "caloriesBMR"
        | "steps"
        | "distance"
        | "floors"
        | "elevation"
        | "minutesSedentary"
        | "minutesLightlyActive"
        | "minutesFairlyActive"
        | "minutesVeryActive"
        | "activityCalories",
      date: string,
      period: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/tracker/${resourcePath}/date/${date}/${period}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the Activity Intraday Time Series for a given resource in the format requested.
     *
     * @tags Activity Intraday Time Series
     * @name GetActivitiesResourceByDateRangeIntraday
     * @summary Get Activity Intraday Time Series
     * @request GET:/1/user/-/activities/{resource-path}/date/{base-date}/{end-date}/{detail-level}.json
     * @secure
     */
    getActivitiesResourceByDateRangeIntraday: (
      resourcePath: "calories" | "steps" | "distance" | "floors" | "elevation",
      baseDate: string,
      endDate: string,
      detailLevel: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/${resourcePath}/date/${baseDate}/${endDate}/${detailLevel}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the Intraday Time Series for a given resource in the format requested.
     *
     * @tags Activity Intraday Time Series
     * @name GetActivitiesResourceByDateIntraday
     * @summary Get Intraday Time Series
     * @request GET:/1/user/-/activities/{resource-path}/date/{date}/1d/{detail-level}.json
     * @secure
     */
    getActivitiesResourceByDateIntraday: (
      resourcePath: "calories" | "steps" | "distance" | "floors" | "elevation",
      date: string,
      detailLevel: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/${resourcePath}/date/${date}/1d/${detailLevel}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the Intraday Time Series for a given resource in the format requested.
     *
     * @tags Activity Intraday Time Series
     * @name GetActivitiesResourceByDateRangeTimeSeriesIntraday
     * @summary Get Activity Intraday Time Series
     * @request GET:/1/user/-/activities/{resource-path}/date/{date}/{end-date}/{detail-level}/time/{start-time}/{end-time}.json
     * @secure
     */
    getActivitiesResourceByDateRangeTimeSeriesIntraday: (
      resourcePath: "calories" | "steps" | "distance" | "floors" | "elevation",
      date: string,
      endDate: string,
      detailLevel: string,
      startTime: string,
      endTime: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/${resourcePath}/date/${date}/${endDate}/${detailLevel}/time/${startTime}/${endTime}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the Intraday Time Series for a given resource in the format requested.
     *
     * @tags Activity Intraday Time Series
     * @name GetActivitiesResourceByDateTimeSeriesIntraday
     * @summary Get Intraday Time Series
     * @request GET:/1/user/-/activities/{resource-path}/date/{date}/1d/{detail-level}/time/{start-time}/{end-time}.json
     * @secure
     */
    getActivitiesResourceByDateTimeSeriesIntraday: (
      resourcePath: "calories" | "steps" | "distance" | "floors" | "elevation",
      date: string,
      detailLevel: string,
      startTime: string,
      endTime: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/${resourcePath}/date/${date}/1d/${detailLevel}/time/${startTime}/${endTime}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description The Log Activity endpoint creates log entry for an activity or user's private custom activity using units in the unit system which corresponds to the Accept-Language header provided (or using optional custom distanceUnit) and get a response in the format requested.
     *
     * @tags Activity
     * @name AddActivitiesLog
     * @summary Log Activity
     * @request POST:/1/user/-/activities.json
     * @secure
     */
    addActivitiesLog: (
      query: {
        /** The ID of the activity, directory activity or intensity level activity. */
        activityId: number;
        /** Custom activity name. Either activityId or activityName must be provided. */
        activityName?: string;
        /** Calories burned that are manaully specified. Required with activityName must be provided. */
        manualCalories: number;
        /** Activity start time. Hours and minutes in the format HH:mm:ss. */
        startTime: string;
        /** Duration in milliseconds. */
        durationMillis: number;
        /**
         * Log entry date in the format yyyy-MM-dd.
         * @format date
         */
        date: string;
        /** Distance is required for logging directory activity in the format X.XX and in the selected distanceUnit. */
        distance: number;
        /** Distance measurement unit. Steps units are available only for Walking (activityId=90013) and Running (activityId=90009) directory activities and their intensity levels. */
        distanceUnit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Updates a user's daily activity goals and returns a response using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Activity
     * @name GetActivitiesLog
     * @summary Get Lifetime Stats
     * @request GET:/1/user/-/activities.json
     * @secure
     */
    getActivitiesLog: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/activities.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Deletes a user's activity log entry with the given ID.
     *
     * @tags Activity
     * @name DeleteActivitiesLog
     * @summary Delete Activity Log
     * @request DELETE:/1/user/-/activities/{activity-log-id}.json
     * @secure
     */
    deleteActivitiesLog: (activityLogId: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/activities/${activityLogId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of user's activity log entries before or after a given day with offset and limit using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Activity
     * @name GetActivitiesLogList
     * @summary Get Activity Log List
     * @request GET:/1/user/-/activities/list.json
     * @secure
     */
    getActivitiesLogList: (
      query: {
        /**
         * The date in the format yyyy-MM-ddTHH:mm:ss. Only yyyy-MM-dd is required. Either beforeDate or afterDate should be specified.
         * @format date
         */
        beforeDate?: string;
        /**
         * The date in the format yyyy-MM-ddTHH:mm:ss.
         * @format date
         */
        afterDate?: string;
        /** The sort order of entries by date asc (ascending) or desc (descending). */
        sort: string;
        /**
         * The offset number of entries.
         * @default "0"
         */
        offset: number;
        /** The maximum number of entries returned (maximum;100). */
        limit: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          activities: [
            {
              activityId: number;
              activityType: {
                id: number;
                name: string;
                trackingType: string;
                hasStartTime: boolean;
                hasDuration: boolean;
                hasSteps: boolean;
                hasDistance: boolean;
                hasElevation: boolean;
                hasCalories: boolean;
                hasSpeed: boolean;
                hasActiveZoneMinutes: boolean;
                isFavorite: boolean;
                isFrequent: boolean;
                isMeasured: boolean;
                isRecommended: boolean;
              };
              activeZoneMinutes: number;
              calories: number;
              duration: number;
              logId: number;
              originalDuration: number;
              originalStartTime: string;
              activityName: string;
              distance: number;
              distanceUnit: string;
              steps: number;
              startTime: string;
            },
          ];
          pagination: {
            beforeDate: string;
            afterDate: string;
            limit: number;
            offset: number;
            sort: string;
          };
        },
        void
      >({
        path: `/1/user/-/activities/list.json`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives the details of a user's location and heart rate data during a logged exercise activity.
     *
     * @tags Activity
     * @name GetActivitiesTcx
     * @summary Get Activity TCX
     * @request GET:/1/user/-/activities/{log-id}.tcx
     * @secure
     */
    getActivitiesTcx: (
      logId: string,
      query?: {
        /** Include TCX points regardless of GPS data being present */
        includePartialTCX?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/${logId}.tcx`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a tree of all valid Fitbit public activities from the activities catelog as well as private custom activities the user created in the format requested.
     *
     * @tags Activity
     * @name GetActivitiesTypes
     * @summary Browse Activity Types
     * @request GET:/1/activities.json
     * @secure
     */
    getActivitiesTypes: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/activities.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the detail of a specific activity in the Fitbit activities database in the format requested. If activity has levels, it also returns a list of activity level details.
     *
     * @tags Activity
     * @name GetActivitiesTypeDetail
     * @summary Get Activity Type
     * @request GET:/1/activities/{activity-id}.json
     * @secure
     */
    getActivitiesTypeDetail: (activityId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/activities/${activityId}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of a user's frequent activities in the format requested using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Activity
     * @name GetFrequentActivities
     * @summary Get Frequent Activities
     * @request GET:/1/user/-/activities/frequent.json
     * @secure
     */
    getFrequentActivities: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/activities/frequent.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of a user's recent activities types logged with some details of the last activity log of that type using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Activity
     * @name GetRecentActivities
     * @summary Get Recent Activity Types
     * @request GET:/1/user/-/activities/recent.json
     * @secure
     */
    getRecentActivities: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/activities/recent.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a list of a user's favorite activities.
     *
     * @tags Activity
     * @name GetFavoriteActivities
     * @summary Get Favorite Activities
     * @request GET:/1/user/-/activities/favorite.json
     * @secure
     */
    getFavoriteActivities: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/activities/favorite.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Removes the activity with the given ID from a user's list of favorite activities.
     *
     * @tags Activity
     * @name DeleteFavoriteActivities
     * @summary Delete Favorite Activity
     * @request DELETE:/1/user/-/activities/favorite/{activity-id}.json
     * @secure
     */
    deleteFavoriteActivities: (
      activityId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/favorite/${activityId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Adds the activity with the given ID to user's list of favorite activities.
     *
     * @tags Activity
     * @name AddFavoriteActivities
     * @summary Add Favorite Activity
     * @request POST:/1/user/-/activities/favorite/{activity-id}.json
     * @secure
     */
    addFavoriteActivities: (activityId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/activities/favorite/${activityId}.json`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a user's current daily or weekly activity goals using measurement units as defined in the unit system, which corresponds to the Accept-Language header provided.
     *
     * @tags Activity
     * @name GetActivitiesGoals
     * @summary Get Activity Goals
     * @request GET:/1/user/-/activities/goals/{period}.json
     * @secure
     */
    getActivitiesGoals: (period: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/activities/goals/${period}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Updates a user's daily or weekly activity goals and returns a response using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Activity
     * @name AddUpdateActivitiesGoals
     * @summary Update Activity Goals
     * @request POST:/1/user/-/activities/goals/{period}.json
     * @secure
     */
    addUpdateActivitiesGoals: (
      period: string,
      query: {
        /** goal type */
        type: string;
        /** goal value */
        value: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/goals/${period}.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of all user's body fat log entries for a given day in the format requested.
     *
     * @tags Body
     * @name GetBodyFatByDate
     * @summary Get Body Fat Logs
     * @request GET:/1/user/-/body/log/fat/date/{date}.json
     * @secure
     */
    getBodyFatByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/fat/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of all user's body fat log entries for a given day in the format requested.
     *
     * @tags Body
     * @name GetBodyFatByDatePeriod
     * @summary Get Body Fat Logs
     * @request GET:/1/user/-/body/log/fat/date/{date}/{period}.json
     * @secure
     */
    getBodyFatByDatePeriod: (
      date: string,
      period: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/fat/date/${date}/${period}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of all user's body fat log entries for a given day in the format requested.
     *
     * @tags Body
     * @name GetBodyFatByDateRange
     * @summary Get Body Fat Logs
     * @request GET:/1/user/-/body/log/fat/date/{base-date}/{end-date}.json
     * @secure
     */
    getBodyFatByDateRange: (
      baseDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/fat/date/${baseDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Creates a log entry for body fat and returns a response in the format requested.
     *
     * @tags Body
     * @name AddBodyFatLog
     * @summary Log Body Fat
     * @request POST:/1/user/-/body/log/fat.json
     * @secure
     */
    addBodyFatLog: (
      query: {
        /** Body fat in the format of X.XX in the unit system that corresponds to the Accept-Language header provided. */
        fat: number;
        /**
         * Log entry date in the format yyyy-MM-dd.
         * @format date
         */
        date: string;
        /** Time of the measurement in hours and minutes in the format HH:mm:ss that is set to the last second of the day if not provided. */
        time: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/fat.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Deletes a user's body fat log entry with the given ID.
     *
     * @tags Body
     * @name DeleteBodyFatLog
     * @summary Delete Body Fat Log
     * @request DELETE:/1/user/-/body/log/fat/{body-fat-log-id}.json
     * @secure
     */
    deleteBodyFatLog: (bodyFatLogId: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/fat/${bodyFatLogId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a user's current body fat percentage or weight goal using units in the unit systems that corresponds to the Accept-Language header providedin the format requested.
     *
     * @tags Body
     * @name GetBodyGoals
     * @summary Get Body Goals
     * @request GET:/1/user/-/body/log/{goal-type}/goal.json
     * @secure
     */
    getBodyGoals: (goalType: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/${goalType}/goal.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Updates user's fat percentage goal.
     *
     * @tags Body
     * @name UpdateBodyFatGoal
     * @summary Update Body Fat Goal
     * @request POST:/1/user/-/body/log/fat/goal.json
     * @secure
     */
    updateBodyFatGoal: (
      query: {
        /** Target body fat percentage; in the format X.XX. */
        fat: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/fat/goal.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Updates user's fat percentage goal.
     *
     * @tags Body
     * @name UpdateWeightGoal
     * @summary Update Weight Goal
     * @request POST:/1/user/-/body/log/weight/goal.json
     * @secure
     */
    updateWeightGoal: (
      query: {
        /** Weight goal start date; in the format yyyy-MM-dd. */
        startDate: string;
        /** Weight goal start weight; in the format X.XX, in the unit systems that corresponds to the Accept-Language header provided. */
        startWeight: string;
        /** Weight goal target weight; in the format X.XX, in the unit systems that corresponds to the Accept-Language header provided; required if user doesn't have an existing weight goal. */
        weight?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/weight/goal.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of all user's body weight log entries for a given day using units in the unit systems which corresponds to the Accept-Language header provided.
     *
     * @tags Body
     * @name GetWeightByDate
     * @summary Get Weight Logs
     * @request GET:/1/user/-/body/log/weight/date/{date}.json
     * @secure
     */
    getWeightByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/weight/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of all user's body weight log entries for a given day in the format requested.
     *
     * @tags Body
     * @name GetWeightByDatePeriod
     * @summary Get Body Fat Logs
     * @request GET:/1/user/-/body/log/weight/date/{date}/{period}.json
     * @secure
     */
    getWeightByDatePeriod: (
      date: string,
      period: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/weight/date/${date}/${period}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of all user's body fat log entries for a given day in the format requested.
     *
     * @tags Body
     * @name GetWeightByDateRange
     * @summary Get Body Fat Logs
     * @request GET:/1/user/-/body/log/weight/date/{base-date}/{end-date}.json
     * @secure
     */
    getWeightByDateRange: (
      baseDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/weight/date/${baseDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Creates log entry for a body weight using units in the unit systems that corresponds to the Accept-Language header provided and gets a response in the format requested.
     *
     * @tags Body
     * @name AddWeightLog
     * @summary Log Weight
     * @request POST:/1/user/-/body/log/weight.json
     * @secure
     */
    addWeightLog: (
      query: {
        /** Weight in the format of X.XX. */
        weight: number;
        /**
         * Log entry date in the format yyyy-MM-dd.
         * @format date
         */
        date: string;
        /** Time of the measurement; hours and minutes in the format of HH:mm:ss, which is set to the last second of the day if not provided. */
        time?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/weight.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Deletes a user's body weight log entrywith the given ID.
     *
     * @tags Body
     * @name DeleteWeightLog
     * @summary Delete Weight Log
     * @request DELETE:/1/user/-/body/log/weight/{body-weight-log-id}.json
     * @secure
     */
    deleteWeightLog: (bodyWeightLogId: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/body/log/weight/${bodyWeightLogId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns time series data in the specified range for a given resource in the format requested using units in the unit system that corresponds to the Accept-Language header provided.
     *
     * @tags Body Time Series
     * @name GetBodyResourceByDatePeriod
     * @summary Get Body Time Series
     * @request GET:/1/user/-/body/{resource-path}/date/{date}/{period}.json
     * @secure
     */
    getBodyResourceByDatePeriod: (
      resourcePath: "bmi" | "fat" | "weight",
      date: string,
      period: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/${resourcePath}/date/${date}/${period}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns time series data in the specified range for a given resource in the format requested using units in the unit system that corresponds to the Accept-Language header provided.
     *
     * @tags Body Time Series
     * @name GetBodyResourceByDateRange
     * @summary Get Body Time Series
     * @request GET:/1/user/-/body/{resource-path}/date/{base-date}/{end-date}.json
     * @secure
     */
    getBodyResourceByDateRange: (
      resourcePath: "bmi" | "fat" | "weight",
      baseDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/body/${resourcePath}/date/${baseDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns average breathing rate data for a single date. Breathing Rate data applies specifically to a user's "main sleep," which is the longest single period of time during which they were asleep on a given date.
     *
     * @tags Breathing Rate
     * @name GetBreathingRateSummaryByDate
     * @summary Get Breathing Rate Summary by Date
     * @request GET:/1/user/-/br/date/{date}.json
     * @secure
     */
    getBreathingRateSummaryByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/br/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns average breathing rate data for a date range. Breathing Rate data applies specifically to a user's "main sleep," which is the longest single period of time during which they were asleep on a given date.
     *
     * @tags Breathing Rate
     * @name GetBreathingRateSummaryByInterval
     * @summary Get Breathing Rate Summary by Interval
     * @request GET:/1/user/-/br/date/{startDate}/{endDate}.json
     * @secure
     */
    getBreathingRateSummaryByInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/br/date/${startDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns intraday breathing rate data for a single date. It measures the average breathing rate throughout the day and categories your breathing rate by sleep stage. Sleep stages vary between light sleep, deep sleep, REM sleep, and full sleep.
     *
     * @tags Breathing Rate Intraday
     * @name GetBreathingRateIntradayByDate
     * @summary Get Breathing Rate Intraday by Date
     * @request GET:/1/user/-/br/date/{date}/all.json
     * @secure
     */
    getBreathingRateIntradayByDate: (
      date: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/br/date/${date}/all.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns intraday breathing rate data for a date range. It measures the average breathing rate throughout the day and categories your breathing rate by sleep stage. Sleep stages vary between light sleep, deep sleep, REM sleep, and full sleep.
     *
     * @tags Breathing Rate Intraday
     * @name GetBreathingRateIntradayByInterval
     * @summary Get Breathing Rate Intraday by Interval
     * @request GET:/1/user/-/br/date/{startDate}/{endDate}/all.json
     * @secure
     */
    getBreathingRateIntradayByInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/br/date/${startDate}/${endDate}/all.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the Cardio Fitness Score (VO2 Max) data for a single date. VO2 Max values will be shown as a range if no run data is available or a single numeric value if the user uses a GPS for runs.
     *
     * @tags Cardio Fitness Score (VO2 Max)
     * @name GetVo2MaxSummaryByDate
     * @summary Get VO2 Max Summary by Date
     * @request GET:/1/user/-/cardioscore/date/{date}.json
     * @secure
     */
    getVo2MaxSummaryByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/cardioscore/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the Cardio Fitness Score (VO2 Max) data for a date range. VO2 Max values will be shown as a range if no run data is available or a single numeric value if the user uses a GPS for runs.
     *
     * @tags Cardio Fitness Score (VO2 Max)
     * @name GetVo2MaxSummaryByInterval
     * @summary Get VO2 Max Summary by Interval
     * @request GET:/1/user/-/cardioscore/date/{startDate}/{endDate}.json
     * @secure
     */
    getVo2MaxSummaryByInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/cardioscore/date/${startDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a list of the Fitbit devices connected to a user's account.
     *
     * @tags Devices
     * @name GetDevices
     * @summary Get Devices
     * @request GET:/1/user/-/devices.json
     * @secure
     */
    getDevices: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/devices.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns alarms for a device
     *
     * @tags Devices
     * @name GetAlarms
     * @summary Get Alarms
     * @request GET:/1/user/-/devices/tracker/{tracker-id}/alarms.json
     * @secure
     */
    getAlarms: (trackerId: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/devices/tracker/${trackerId}/alarms.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Adds the alarm settings to a given ID for a given device.
     *
     * @tags Devices
     * @name AddAlarms
     * @summary Add Alarm
     * @request POST:/1/user/-/devices/tracker/{tracker-id}/alarms.json
     * @secure
     */
    addAlarms: (
      trackerId: number,
      query: {
        /** Time of day that the alarm vibrates with a UTC timezone offset, e.g. 07:15-08:00. */
        time: string;
        /** true or false. If false, alarm does not vibrate until enabled is set to true. */
        enabled: boolean;
        /** true or false. If false, the alarm is a single event. */
        recurring: string;
        /** Comma separated list of days of the week on which the alarm vibrates, e.g. MONDAY, TUESDAY. */
        weekDays: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/devices/tracker/${trackerId}/alarms.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Updates the alarm entry with a given ID for a given device. It also gets a response in the format requested.
     *
     * @tags Devices
     * @name UpdateAlarms
     * @summary Update Alarm
     * @request POST:/1/user/-/devices/tracker/{tracker-id}/alarms/{alarm-id}.json
     * @secure
     */
    updateAlarms: (
      trackerId: number,
      alarmId: number,
      query: {
        /** Time of day that the alarm vibrates with a UTC timezone offset, e.g. 07:15-08:00. */
        time: string;
        /** true or false. If false, the alarm does not vibrate until enabled is set to true. */
        enabled: boolean;
        /** true or false. If false, the alarm is a single event. */
        recurring: string;
        /** Comma seperated list of days of the week on which the alarm vibrates, e.g. MONDAY, TUESDAY. */
        weekDays: string;
        /** Minutes between alarms. */
        snoozeLength: number;
        /** Maximum snooze count. */
        snoozeCount: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/devices/tracker/${trackerId}/alarms/${alarmId}.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Deletes the user's device alarm entry with the given ID for a given device.
     *
     * @tags Devices
     * @name DeleteAlarms
     * @summary Delete Alarm
     * @request DELETE:/1/user/-/devices/tracker/{tracker-id}/alarms/{alarm-id}.json
     * @secure
     */
    deleteAlarms: (
      trackerId: number,
      alarmId: number,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/devices/tracker/${trackerId}/alarms/${alarmId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint is used for querying the user's on-device ECG readings.
     *
     * @tags Electrocardiogram
     * @name GetEcgLogList
     * @summary Get ECG Log List
     * @request GET:/1/user/-/ecg/list.json
     * @secure
     */
    getEcgLogList: (
      query: {
        /**
         * The date in the format yyyy-MM-ddTHH:mm:ss. Only yyyy-MM-dd is required. Either beforeDate or afterDate should be specified.
         * @format date
         */
        beforeDate?: string;
        /**
         * The date in the format yyyy-MM-ddTHH:mm:ss.
         * @format date
         */
        afterDate?: string;
        /** The sort order of entries by date asc (ascending) or desc (descending). */
        sort: string;
        /**
         * The offset number of entries.
         * @default "0"
         */
        offset: number;
        /** The maximum number of entries returned (maximum;10). */
        limit: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/ecg/list.json`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the time series data in the specified range for a given resource in the format requested using units in the unit systems that corresponds to the Accept-Language header provided.
     *
     * @tags Heart Rate Time Series
     * @name GetHeartByDatePeriod
     * @summary Get Heart Rate Time Series
     * @request GET:/1/user/-/activities/heart/date/{date}/{period}.json
     * @secure
     */
    getHeartByDatePeriod: (
      date: string,
      period: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/heart/date/${date}/${period}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the time series data in the specified range for a given resource in the format requested using units in the unit systems that corresponds to the Accept-Language header provided.
     *
     * @tags Heart Rate Time Series
     * @name GetHeartByDateRange
     * @summary Get Heart Rate Time Series
     * @request GET:/1/user/-/activities/heart/date/{base-date}/{end-date}.json
     * @secure
     */
    getHeartByDateRange: (
      baseDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/heart/date/${baseDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the intraday time series for a given resource in the format requested. If your application has the appropriate access, your calls to a time series endpoint for a specific day (by using start and end dates on the same day or a period of 1d), the response will include extended intraday values with a one-minute detail level for that day. Unlike other time series calls that allow fetching data of other users, intraday data is available only for and to the authorized user.
     *
     * @tags Heart Rate Intraday Time Series
     * @name GetHeartByDateRangeIntraday
     * @summary Get Heart Rate Intraday Time Series
     * @request GET:/1/user/-/activities/heart/date/{date}/{end-date}/{detail-level}.json
     * @secure
     */
    getHeartByDateRangeIntraday: (
      date: string,
      endDate: string,
      detailLevel: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/heart/date/${date}/${endDate}/${detailLevel}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the intraday time series for a given resource in the format requested. If your application has the appropriate access, your calls to a time series endpoint for a specific day (by using start and end dates on the same day or a period of 1d), the response will include extended intraday values with a one-minute detail level for that day. Unlike other time series calls that allow fetching data of other users, intraday data is available only for and to the authorized user.
     *
     * @tags Heart Rate Intraday Time Series
     * @name GetHeartByDateRangeTimestampIntraday
     * @summary Get Heart Rate Intraday Time Series
     * @request GET:/1/user/-/activities/heart/date/{date}/{end-date}/{detail-level}/time/{start-time}/{end-time}.json
     * @secure
     */
    getHeartByDateRangeTimestampIntraday: (
      date: string,
      endDate: string,
      detailLevel: string,
      startTime: string,
      endTime: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/heart/date/${date}/${endDate}/${detailLevel}/time/${startTime}/${endTime}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the intraday time series for a given resource in the format requested. If your application has the appropriate access, your calls to a time series endpoint for a specific day (by using start and end dates on the same day or a period of 1d), the response will include extended intraday values with a one-minute detail level for that day. Unlike other time series calls that allow fetching data of other users, intraday data is available only for and to the authorized user.
     *
     * @tags Heart Rate Intraday Time Series
     * @name GetHeartByDateIntraday
     * @summary Get Heart Rate Intraday Time Series
     * @request GET:/1/user/-/activities/heart/date/{date}/1d/{detail-level}.json
     * @secure
     */
    getHeartByDateIntraday: (
      date: string,
      detailLevel: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/heart/date/${date}/1d/${detailLevel}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the intraday time series for a given resource in the format requested. If your application has the appropriate access, your calls to a time series endpoint for a specific day (by using start and end dates on the same day or a period of 1d), the response will include extended intraday values with a one-minute detail level for that day. Unlike other time series calls that allow fetching data of other users, intraday data is available only for and to the authorized user.
     *
     * @tags Heart Rate Intraday Time Series
     * @name GetHeartByDateTimestampIntraday
     * @summary Get Heart Rate Intraday Time Series
     * @request GET:/1/user/-/activities/heart/date/{date}/1d/{detail-level}/time/{start-time}/{end-time}.json
     * @secure
     */
    getHeartByDateTimestampIntraday: (
      date: string,
      detailLevel: string,
      startTime: string,
      endTime: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/activities/heart/date/${date}/1d/${detailLevel}/time/${startTime}/${endTime}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the Heart Rate Variability (HRV) data for a single date. HRV data applies specifically to a user's "main sleep," which is the longest single period of time asleep on a given date.
     *
     * @tags Heart Rate Variability
     * @name GetHrvSummaryDate
     * @summary Get HRV Summary by Date
     * @request GET:/1/user/-/hrv/date/{date}.json
     * @secure
     */
    getHrvSummaryDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/hrv/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the Heart Rate Variability (HRV) data for a date range. HRV data applies specifically to a user's "main sleep," which is the longest single period of time asleep on a given date.
     *
     * @tags Heart Rate Variability
     * @name GetHrvSummaryInterval
     * @summary Get HRV Summary by Interval
     * @request GET:/1/user/-/hrv/date/{startDate}/{endDate}.json
     * @secure
     */
    getHrvSummaryInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/hrv/date/${startDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the Heart Rate Variability (HRV) intraday data for a single date. HRV data applies specifically to a user's "main sleep," which is the longest single period of time asleep on a given date.
     *
     * @tags Heart Rate Variability Intraday
     * @name GetHrvIntradayByDate
     * @summary Get HRV Intraday by Date
     * @request GET:/1/user/-/hrv/date/{date}/all.json
     * @secure
     */
    getHrvIntradayByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/hrv/date/${date}/all.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the Heart Rate Variability (HRV) intraday data for a single date. HRV data applies specifically to a user's "main sleep," which is the longest single period of time asleep on a given date.
     *
     * @tags Heart Rate Variability Intraday
     * @name GetHrvIntradayByInterval
     * @summary Get HRV Intraday by Interval
     * @request GET:/1/user/-/hrv/date/{startDate}/{endDate}/all.json
     * @secure
     */
    getHrvIntradayByInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/hrv/date/${startDate}/${endDate}/all.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns a paginated list of Irregular Rhythm Notifications (IRN) alerts, as well as all of the alert tachograms. This endpoint will only return alerts that the user has read in the Fitbit app already, as that is meant as the primary entrypoint for viewing notifications.
     *
     * @tags Irregular Rhythm Notifications
     * @name GetIrnAlertsList
     * @summary Get IRN Alerts List
     * @request GET:/1/user/-/irn/alerts/list.json
     * @secure
     */
    getIrnAlertsList: (
      query: {
        /**
         * The date in the format yyyy-MM-ddTHH:mm:ss. Only yyyy-MM-dd is required. Either beforeDate or afterDate should be specified.
         * @format date
         */
        beforeDate?: string;
        /**
         * The date in the format yyyy-MM-ddTHH:mm:ss. Only yyyy-MM-dd is required. Either beforeDate or afterDate should be specified.
         * @format date
         */
        afterDate?: string;
        /** The sort order of entries by date. Use asc (ascending) when using afterDate. Use desc (descending) when using beforeDate. */
        sort: string;
        /**
         * The offset number of entries.
         * @default "0"
         */
        offset: number;
        /** The maximum number of entries returned (maximum;10). */
        limit: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/irn/alerts/list.json`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the user state for Irregular Rhythm Notifications (IRN). The user state contains most information about the user's current engagement with the feature, including onboarding progress and algorithm processing state.
     *
     * @tags Irregular Rhythm Notifications
     * @name GetIrnProfile
     * @summary Get IRN Profile
     * @request GET:/1/user/-/irn/profile.json
     * @secure
     */
    getIrnProfile: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/irn/profile.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the food locales that the user may choose to search, log, and create food in.
     *
     * @tags Nutrition
     * @name GetFoodsLocales
     * @summary Get Food Locales
     * @request GET:/1/foods/locales.json
     * @secure
     */
    getFoodsLocales: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/foods/locales.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a user's current daily calorie consumption goal and/or foodPlan value in the format requested.
     *
     * @tags Nutrition
     * @name GetFoodsGoal
     * @summary Get Food Goals
     * @request GET:/1/user/-/foods/log/goal.json
     * @secure
     */
    getFoodsGoal: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/goal.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Updates a user's daily calories consumption goal or food plan and returns a response in the format requested.
     *
     * @tags Nutrition
     * @name AddUpdateFoodsGoal
     * @summary Update Food Goal
     * @request POST:/1/user/-/foods/log/goal.json
     * @secure
     */
    addUpdateFoodsGoal: (
      query: {
        /** Manual calorie consumption goal in either calories or intensity must be provided. */
        calories: number;
        /** Food plan intensity (MAINTENANCE, EASIER, MEDIUM, KINDAHARD, or HARDER). Either calories or intensity must be provided. */
        intensity?: string;
        /** Food plan type; true or false. */
        personalized?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/goal.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a summary and list of a user's food log entries for a given day in the format requested.
     *
     * @tags Nutrition
     * @name GetFoodsByDate
     * @summary Get Food Logs
     * @request GET:/1/user/-/foods/log/date/{date}.json
     * @secure
     */
    getFoodsByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a summary and list of a user's water log entries for a given day in the requested using units in the unit system that corresponds to the Accept-Language header provided.
     *
     * @tags Nutrition
     * @name GetWaterByDate
     * @summary Get Water Logs
     * @request GET:/1/user/-/foods/log/water/date/{date}.json
     * @secure
     */
    getWaterByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/water/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a summary and list of a user's water goal entries for a given day in the requested using units in the unit system that corresponds to the Accept-Language header provided.
     *
     * @tags Nutrition
     * @name GetWaterGoal
     * @summary Get Water Goal
     * @request GET:/1/user/-/foods/log/water/goal.json
     * @secure
     */
    getWaterGoal: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/1/user/-/foods/log/water/goal.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Updates a user's daily calories consumption goal or food plan and returns a response in the format requested.
     *
     * @tags Nutrition
     * @name AddUpdateWaterGoal
     * @summary Update Water Goal
     * @request POST:/1/user/-/foods/log/water/goal.json
     * @secure
     */
    addUpdateWaterGoal: (
      query: {
        /** The target water goal in the format X.X is set in unit based on locale. */
        target: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/water/goal.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Updates a user's daily activity goals and returns a response using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Nutrition Time Series
     * @name GetFoodsByDateRange
     * @summary Get Food or Water Time Series
     * @request GET:/1/user/-/foods/log/{resource-path}/date/{base-date}/{end-date}.json
     * @secure
     */
    getFoodsByDateRange: (
      resourcePath: "caloriesIn" | "water",
      baseDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/${resourcePath}/date/${baseDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Updates a user's daily activity goals and returns a response using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Nutrition Time Series
     * @name GetFoodsResourceByDatePeriod
     * @summary Get Food or Water Time Series
     * @request GET:/1/user/-/foods/log/{resource-path}/date/{date}/{period}.json
     * @secure
     */
    getFoodsResourceByDatePeriod: (
      resourcePath: "caloriesIn" | "water",
      date: string,
      period: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/${resourcePath}/date/${date}/${period}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Creates food log entries for users with or without foodId value.
     *
     * @tags Nutrition
     * @name AddFoodsLog
     * @summary Log Food
     * @request POST:/1/user/-/foods/log.json
     * @secure
     */
    addFoodsLog: (
      query: {
        /** The ID of the food to be logged. Either foodId or foodName must be provided. */
        foodId: string;
        /** Food entry name. Either foodId or foodName must be provided. */
        foodName?: string;
        /** Meal types. 1=Breakfast; 2=Morning Snack; 3=Lunch; 4=Afternoon Snack; 5=Dinner; 7=Anytime. */
        mealTypeId: string;
        /** The ID of units used. Typically retrieved via a previous call to Get Food Logs, Search Foods, or Get Food Units. */
        unitId: string;
        /** The amount consumed in the format X.XX in the specified unitId. */
        amount: string;
        /**
         * Log entry date in the format yyyy-MM-dd.
         * @format date
         */
        date: string;
        /** The `true` value will add the food to the user's favorites after creating the log entry; while the `false` value will not. Valid only with foodId value. */
        favorite?: boolean;
        /** Brand name of food. Valid only with foodName parameters. */
        brandName?: string;
        /** Calories for this serving size. This is allowed with foodName parameter (default to zero); otherwise it is ignored. */
        calories?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Deletes a user's food log entry with the given ID.
     *
     * @tags Nutrition
     * @name DeleteFoodsLog
     * @summary Delete Food Log
     * @request DELETE:/1/user/-/foods/log/{food-log-id}.json
     * @secure
     */
    deleteFoodsLog: (foodLogId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/${foodLogId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description The Edit Food Log endpoint changes the quantity or calories consumed for a user's food log entry with the given Food Log ID.
     *
     * @tags Nutrition
     * @name EditFoodsLog
     * @summary Edit Food Log
     * @request POST:/1/user/-/foods/log/{food-log-id}.json
     * @secure
     */
    editFoodsLog: (
      foodLogId: string,
      query: {
        /** Meal types. 1=Breakfast; 2=Morning Snack; 3=Lunch; 4=Afternoon Snack; 5=Dinner; 7=Anytime. */
        mealTypeId: string;
        /** The ID of units used. Typically retrieved via a previous call to Get Food Logs, Search Foods, or Get Food Units. */
        unitId: string;
        /** The amount consumed in the format X.XX in the specified unitId. */
        amount: string;
        /** Calories for this serving size. This is allowed with foodName parameter (default to zero); otherwise it is ignored. */
        calories?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/${foodLogId}.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Creates a log entry for water using units in the unit systems that corresponds to the Accept-Language header provided.
     *
     * @tags Nutrition
     * @name AddWaterLog
     * @summary Log Water
     * @request POST:/1/user/-/foods/log/water.json
     * @secure
     */
    addWaterLog: (
      query: {
        /**
         * The date of records to be returned in the format yyyy-MM-dd.
         * @format date
         */
        date: string;
        /** The amount consumption in the format X.XX and in the specified waterUnit or in the unit system that corresponds to the Accept-Language header provided. */
        amount: number;
        /** Water measurement unit; `ml`, `fl oz`, or `cup`. */
        unit?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/water.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Deletes a user's water log entry with the given ID.
     *
     * @tags Nutrition
     * @name DeleteWaterLog
     * @summary Delete Water Log
     * @request DELETE:/1/user/-/foods/log/water/{water-log-id}.json
     * @secure
     */
    deleteWaterLog: (waterLogId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/water/${waterLogId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Updates a user's water log entry with the given ID.
     *
     * @tags Nutrition
     * @name UpdateWaterLog
     * @summary Update Water Log
     * @request POST:/1/user/-/foods/log/water/{water-log-id}.json
     * @secure
     */
    updateWaterLog: (
      waterLogId: string,
      query: {
        /** Amount consumed; in the format X.X and in the specified waterUnit or in the unit system that corresponds to the Accept-Language header provided. */
        amount: string;
        /** Water measurement unit. 'ml', 'fl oz', or 'cup'. */
        unit?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/water/${waterLogId}.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a list of a user's favorite foods in the format requested. A favorite food in the list provides a quick way to log the food via the Log Food endpoint.
     *
     * @tags Nutrition
     * @name GetFavoriteFoods
     * @summary Get Favorite Foods
     * @request GET:/1/user/-/foods/log/favorite.json
     * @secure
     */
    getFavoriteFoods: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/favorite.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a list of a user's frequent foods in the format requested. A frequent food in the list provides a quick way to log the food via the Log Food endpoint.
     *
     * @tags Nutrition
     * @name GetFrequentFoods
     * @summary Get Frequent Foods
     * @request GET:/1/user/-/foods/log/frequent.json
     * @secure
     */
    getFrequentFoods: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/frequent.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Updates a user's daily activity goals and returns a response using units in the unit system which corresponds to the Accept-Language header provided.
     *
     * @tags Nutrition
     * @name AddFavoriteFood
     * @summary Add Favorite Food
     * @request POST:/1/user/-/foods/log/favorite/{food-id}.json
     * @secure
     */
    addFavoriteFood: (foodId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/favorite/${foodId}.json`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Deletes a food with the given ID to the user's list of favorite foods.
     *
     * @tags Nutrition
     * @name DeleteFavoriteFood
     * @summary Delete Favorite Food
     * @request DELETE:/1/user/-/foods/log/favorite/{food-id}.json
     * @secure
     */
    deleteFavoriteFood: (foodId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/favorite/${foodId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a list of meals created by user in the user's food log in the format requested. User creates and manages meals on the Food Log tab on the website.
     *
     * @tags Nutrition
     * @name GetMeals
     * @summary Get Meals
     * @request GET:/1/user/-/meals.json
     * @secure
     */
    getMeals: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/meals.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Creates a meal with the given food contained in the post body.
     *
     * @tags Nutrition
     * @name AddMeal
     * @summary Create Meal
     * @request POST:/1/user/-/meals.json
     * @secure
     */
    addMeal: (meal: Meal, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/meals.json`,
        method: "POST",
        body: meal,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Replaces an existing meal with the contents of the request. The response contains the updated meal.
     *
     * @tags Nutrition
     * @name UpdateMeal
     * @summary Update Meal
     * @request POST:/1/user/-/meals/{meal-id}.json
     * @secure
     */
    updateMeal: (mealId: string, meal: Meal, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/meals/${mealId}.json`,
        method: "POST",
        body: meal,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Deletes a user's meal with the given meal id.
     *
     * @tags Nutrition
     * @name DeleteMeal
     * @summary Delete Meal
     * @request DELETE:/1/user/-/meals/{meal-id}.json
     * @secure
     */
    deleteMeal: (mealId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/meals/${mealId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a list of a user's frequent foods in the format requested. A frequent food in the list provides a quick way to log the food via the Log Food endpoint.
     *
     * @tags Nutrition
     * @name GetRecentFoods
     * @summary Get Recent Foods
     * @request GET:/1/user/-/foods/log/recent.json
     * @secure
     */
    getRecentFoods: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/log/recent.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Creates a new private food for a user and returns a response in the format requested. The created food is found via the Search Foods call.
     *
     * @tags Nutrition
     * @name AddFoods
     * @summary Create Food
     * @request POST:/1/user/-/foods.json
     * @secure
     */
    addFoods: (
      query: {
        /** The food name. */
        name: string;
        /** The ID of the default measurement unit. Full list of units can be retrieved via the Get Food Units endpoint. */
        defaultFoodMeasurementUnitId: string;
        /** The size of the default serving. Nutrition values should be provided for this serving size. */
        defaultServingSize: string;
        /** The calories in the default serving size. */
        calories: string;
        /** Form type; LIQUID or DRY. */
        formType?: string;
        /** The description of the food. */
        description?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/foods.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Deletes custom food for a user and returns a response in the format requested.
     *
     * @tags Nutrition
     * @name DeleteFoods
     * @summary Delete Custom Food
     * @request DELETE:/1/user/-/foods/{food-id}.json
     * @secure
     */
    deleteFoods: (foodId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/foods/${foodId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the details of a specific food in the Fitbit food databases or a private food that an authorized user has entered in the format requested.
     *
     * @tags Nutrition
     * @name GetFoodsInfo
     * @summary Get Food
     * @request GET:/1/foods/{food-id}.json
     * @secure
     */
    getFoodsInfo: (foodId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/foods/${foodId}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a list of all valid Fitbit food units in the format requested.
     *
     * @tags Nutrition
     * @name GetFoodsUnits
     * @summary Get Food Units
     * @request GET:/1/foods/units.json
     * @secure
     */
    getFoodsUnits: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/foods/units.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a list of public foods from the Fitbit food database and private food the user created in the format requested.
     *
     * @tags Nutrition
     * @name GetFoodsList
     * @summary Search Foods
     * @request GET:/1/foods/search.json
     * @secure
     */
    getFoodsList: (
      query: {
        /** The URL-encoded search query. */
        query: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/foods/search.json`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the SpO2 summary data for a single date. SpO2 applies specifically to a user's "main sleep", which is the longest single period of time asleep on a given date.
     *
     * @tags SpO2
     * @name GetSpO2SummaryByDate
     * @summary Get SpO2 Summary by Date
     * @request GET:/1/user/-/spo2/date/{date}.json
     * @secure
     */
    getSpO2SummaryByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/spo2/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the SpO2 summary data for a date range. SpO2 applies specifically to a user's "main sleep", which is the longest single period of time asleep on a given date.
     *
     * @tags SpO2
     * @name GetSpO2SummaryByInterval
     * @summary Get SpO2 Summary by Interval
     * @request GET:/1/user/-/spo2/date/{startDate}/{endDate}.json
     * @secure
     */
    getSpO2SummaryByInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/spo2/date/${startDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the SpO2 intraday data for a single date. SpO2 applies specifically to a user's "main sleep", which is the longest single period of time asleep on a given date.
     *
     * @tags SpO2 Intraday
     * @name GetSpO2IntradayByDate
     * @summary Get SpO2 Intraday by Date
     * @request GET:/1/user/-/spo2/date/{date}/all.json
     * @secure
     */
    getSpO2IntradayByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/spo2/date/${date}/all.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint returns the SpO2 intraday data for a specified date range. SpO2 applies specifically to a user's "main sleep", which is the longest single period of time asleep on a given date.
     *
     * @tags SpO2 Intraday
     * @name GetSpO2IntradayByInterval
     * @summary Get SpO2 Intraday by Interval
     * @request GET:/1/user/-/spo2/date/{startDate}/{endDate}/all.json
     * @secure
     */
    getSpO2IntradayByInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/spo2/date/${startDate}/${endDate}/all.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retreives a list of a user's subscriptions for your application in the format requested. You can either fetch subscriptions for a specific collection or the entire list of subscriptions for the user. For best practice, make sure that your application maintains this list on your side and use this endpoint only to periodically ensure data consistency.
     *
     * @tags Subscriptions
     * @name GetSubscriptionsList
     * @summary Get a List of Subscriptions
     * @request GET:/1/user/-/{collection-path}/apiSubscriptions.json
     * @secure
     */
    getSubscriptionsList: (
      collectionPath: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/${collectionPath}/apiSubscriptions.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Adds a subscription in your application so that users can get notifications and return a response in the format requested. The subscription-id value provides a way to associate an update with a particular user stream in your application.
     *
     * @tags Subscriptions
     * @name AddSubscriptions
     * @summary Add a Subscription
     * @request POST:/1/user/-/{collection-path}/apiSubscriptions/{subscription-id}.json
     * @secure
     */
    addSubscriptions: (
      collectionPath: string,
      subscriptionId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/${collectionPath}/apiSubscriptions/${subscriptionId}.json`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Deletes a subscription for a user..
     *
     * @tags Subscriptions
     * @name DeleteSubscriptions
     * @summary Delete a Subscription
     * @request DELETE:/1/user/-/{collection-path}/apiSubscriptions/{subscription-id}.json
     * @secure
     */
    deleteSubscriptions: (
      collectionPath: string,
      subscriptionId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/${collectionPath}/apiSubscriptions/${subscriptionId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the Temperature (Core) data for a single date. Temperature (Core) data applies specifically to data logged manually by the user throughout the day.
     *
     * @tags Temperature
     * @name GetTempCoreSummaryByDate
     * @summary Get Temperature (Core) Summary by Date
     * @request GET:/1/user/-/temp/core/date/{date}.json
     * @secure
     */
    getTempCoreSummaryByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/temp/core/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns Temperature (Core) data for a date range. Temperature (Core) data applies specifically to data logged manually by the user throughout the day and the maximum date range cannot exceed 30 days.
     *
     * @tags Temperature
     * @name GetTempCoreSummaryByInterval
     * @summary Get Temperature (Core) Summary by Interval
     * @request GET:/1/user/-/temp/core/date/{startDate}/{endDate}.json
     * @secure
     */
    getTempCoreSummaryByInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/temp/core/date/${startDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the Temperature (Skin) data for a single date. Temperature (Skin) data applies specifically to a user's "main sleep", which is the longest single period of time asleep on a given date.
     *
     * @tags Temperature
     * @name GetTempSkinSummaryDate
     * @summary Get Temperature (Skin) Summary by Date
     * @request GET:/1/user/-/temp/skin/date/{date}.json
     * @secure
     */
    getTempSkinSummaryDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/temp/skin/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns Temperature (Skin) data for a date range. It only returns a value for dates on which the Fitbit device was able to record Temperature (skin) data and the maximum date range cannot exceed 30 days.
     *
     * @tags Temperature
     * @name GetTempSkinSummaryByInterval
     * @summary Get Temperature (Skin) Summary by Interval
     * @request GET:/1/user/-/temp/skin/date/{startDate}/{endDate}.json
     * @secure
     */
    getTempSkinSummaryByInterval: (
      startDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1/user/-/temp/skin/date/${startDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Retrieves the user's badges in the format requested. Response includes all badges for the user as seen on the Fitbit website badge locker (both activity and weight related.) The endpoint returns weight and distance badges based on the user's unit profile preference as on the website.
     *
     * @tags User
     * @name GetBadges
     * @summary Get Badges
     * @request GET:/1/user/-/badges.json
     * @secure
     */
    getBadges: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/badges.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Returns a user's profile. The authenticated owner receives all values. However, the authenticated user's access to other users' data is subject to those users' privacy settings. Numerical values are returned in the unit system specified in the Accept-Language header.
     *
     * @tags User
     * @name GetProfile
     * @summary Get Profile
     * @request GET:/1/user/-/profile.json
     * @secure
     */
    getProfile: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1/user/-/profile.json`,
        method: "GET",
        secure: true,
        ...params,
      }),
  };
  v12 = {
    /**
     * @description Deletes a user's sleep log entry with the given ID.
     *
     * @tags Sleep
     * @name DeleteSleep
     * @summary Delete Sleep Log
     * @request DELETE:/1.2/user/-/sleep/{log-id}.json
     * @secure
     */
    deleteSleep: (logId: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1.2/user/-/sleep/${logId}.json`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description The Get Sleep Logs by Date endpoint returns a summary and list of a user's sleep log entries (including naps) as well as detailed sleep entry data for a given day.
     *
     * @tags Sleep
     * @name GetSleepByDate
     * @summary Get Sleep Log
     * @request GET:/1.2/user/-/sleep/date/{date}.json
     * @secure
     */
    getSleepByDate: (date: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1.2/user/-/sleep/date/${date}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description The Get Sleep Logs by Date Range endpoint returns a list of a user's sleep log entries (including naps) as well as detailed sleep entry data for a given date range (inclusive of start and end dates).
     *
     * @tags Sleep
     * @name GetSleepByDateRange
     * @summary Get Sleep Logs by Date Range
     * @request GET:/1.2/user/-/sleep/date/{base-date}/{end-date}.json
     * @secure
     */
    getSleepByDateRange: (
      baseDate: string,
      endDate: string,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1.2/user/-/sleep/date/${baseDate}/${endDate}.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description The Get Sleep Logs List endpoint returns a list of a user's sleep logs (including naps) before or after a given day with offset, limit, and sort order.
     *
     * @tags Sleep
     * @name GetSleepList
     * @summary Get Sleep Logs List
     * @request GET:/1.2/user/-/sleep/list.json
     * @secure
     */
    getSleepList: (
      query: {
        /**
         * The date in the format yyyy-MM-ddTHH:mm:ss. Only yyyy-MM-dd is required. Either beforeDate or afterDate should be specified.
         * @format date
         */
        beforeDate?: string;
        /**
         * The date in the format yyyy-MM-ddTHH:mm:ss.
         * @format date
         */
        afterDate?: string;
        /** The sort order of entries by date asc (ascending) or desc (descending). */
        sort: string;
        /**
         * The offset number of entries.
         * @default "0"
         */
        offset: number;
        /** The maximum number of entries returned (maximum;100). */
        limit: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1.2/user/-/sleep/list.json`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Returns the user's sleep goal.
     *
     * @tags Sleep
     * @name GetSleepGoal
     * @summary Get Sleep Goal
     * @request GET:/1.2/user/-/sleep/goal.json
     * @secure
     */
    getSleepGoal: (params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/1.2/user/-/sleep/goal.json`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * @description Create or update the user's sleep goal and get a response in the JSON format.
     *
     * @tags Sleep
     * @name UpdateSleepGoal
     * @summary Update Sleep Goal
     * @request POST:/1.2/user/-/sleep/goal.json
     * @secure
     */
    updateSleepGoal: (
      query: {
        /** Duration of sleep goal. */
        minDuration: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1.2/user/-/sleep/goal.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Creates a log entry for a sleep event and returns a response in the format requested.
     *
     * @tags Sleep
     * @name AddSleep
     * @summary Log Sleep
     * @request POST:/1.2/user/-/sleep.json
     * @secure
     */
    addSleep: (
      query: {
        /** Start time includes hours and minutes in the format HH:mm. */
        startTime: string;
        /** Duration in milliseconds. */
        duration: number;
        /**
         * Log entry in the format yyyy-MM-dd.
         * @format date
         */
        date: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/1.2/user/-/sleep.json`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),
  };
  post = {
    /**
     * No description
     *
     * @name TagsPost
     * @request TAGS:post
     */
    tagsPost: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `post`,
        method: "TAGS",
        ...params,
      }),

    /**
     * No description
     *
     * @name SummaryPost
     * @request SUMMARY:post
     */
    summaryPost: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `post`,
        method: "SUMMARY",
        ...params,
      }),

    /**
     * No description
     *
     * @name DescriptionPost
     * @request DESCRIPTION:post
     */
    descriptionPost: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `post`,
        method: "DESCRIPTION",
        ...params,
      }),

    /**
     * No description
     *
     * @name OperationIdPost
     * @request OPERATION ID:post
     */
    operationIdPost: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `post`,
        method: "OPERATION ID",
        ...params,
      }),

    /**
     * No description
     *
     * @name ConsumesPost
     * @request CONSUMES:post
     */
    consumesPost: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `post`,
        method: "CONSUMES",
        ...params,
      }),

    /**
     * No description
     *
     * @name ProducesPost
     * @request PRODUCES:post
     */
    producesPost: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `post`,
        method: "PRODUCES",
        ...params,
      }),

    /**
     * No description
     *
     * @name ResponsesPost
     * @request RESPONSES:post
     */
    responsesPost: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `post`,
        method: "RESPONSES",
        ...params,
      }),

    /**
     * No description
     *
     * @name SecurityPost
     * @request SECURITY:post
     */
    securityPost: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `post`,
        method: "SECURITY",
        ...params,
      }),
  };
}
