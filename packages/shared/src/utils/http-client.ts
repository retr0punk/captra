type ResponseType = "arrayBuffer" | "blob" | "formData" | "json" | "text";

type SearchParams = Record<string, string | number | boolean>;

type HttpResponse = Response & { data: any };

type Context = Record<string, unknown>;

type BeforeRequestHook = (args: {
  request: Request;
  context: Context;
}) => Request | void | Promise<Request | void>;

type AfterResponseHook = (args: {
  response: HttpResponse;
  context: Context;
}) => HttpResponse | void | Promise<HttpResponse | void>;

interface Config {
  baseUrl?: string;
  responseType?: ResponseType;
  hooks?: {
    beforeRequest?: BeforeRequestHook[];
    afterResponse?: AfterResponseHook[];
  };
}

type Options = Config &
  (
    | {
        body: Exclude<RequestInit["body"], undefined>;
        json?: never;
        form?: never;
      }
    | { body?: never; json: unknown; form?: never }
    | {
        body?: never;
        json?: never;
        form: SearchParams;
      }
    | { body?: never; json?: never; form?: never }
  ) & {
    searchParams?: SearchParams;
    context?: Context;
  };

type HttpClient = ((
  path: string,
  opts?: Omit<RequestInit, "body"> & Options,
) => Promise<HttpResponse>) & {
  [K in (typeof methods)[number]]: (
    path: string,
    opts?: Omit<RequestInit, "method" | "body"> & Options,
  ) => Promise<HttpResponse>;
};

const methods = ["get", "post", "delete", "put", "patch"] as const;
const acceptHeaderValues = {
  arrayBuffer: "*/*",
  blob: "*/*",
  formData: "multipart/form-data",
  json: "application/json",
  text: "text/*",
};

interface IHttpClientError {
  request: Request;
  response: HttpResponse;
  context: Context;
}

export interface HttpClientError extends IHttpClientError {}
export class HttpClientError extends Error {
  constructor({ request, response, context }: IHttpClientError) {
    super(
      `Request failed with code '${response.status.toString()}' and status '${response.statusText}'`,
    );
    this.name = this.constructor.name;
    this.request = request;
    this.response = response;
    this.context = context;
  }
}

export function createHttpClient(config?: Config) {
  const fn = (async (
    path,
    {
      baseUrl,
      context,
      responseType,
      hooks,
      json,
      form,
      searchParams,
      ...init
    } = {},
  ) => {
    let finalBaseUrl = baseUrl ?? config?.baseUrl;
    const finalContext = context ?? {};
    const finalResponseType = responseType ?? config?.responseType;
    const finalHooks = {
      beforeRequest: [
        ...(config?.hooks?.beforeRequest ?? []),
        ...(hooks?.beforeRequest ?? []),
      ],
      afterResponse: [
        ...(config?.hooks?.afterResponse ?? []),
        ...(hooks?.afterResponse ?? []),
      ],
    };

    let url: URL;
    if (finalBaseUrl) {
      if (!finalBaseUrl.endsWith("/")) finalBaseUrl += "/";
      const resolvedBaseUrl = finalBaseUrl.startsWith("http")
        ? finalBaseUrl
        : // @ts-expect-error: No 'window' as we're in a non-browser environment
          typeof window !== "undefined"
          ? // @ts-expect-error: Same as above
            new URL(finalBaseUrl, window.location.href).href
          : (() => {
              throw new Error(
                "Base URL must be absolute in non-browser environments",
              );
            })();
      url = path.startsWith("/")
        ? new URL(path.substring(1), resolvedBaseUrl)
        : new URL(path, resolvedBaseUrl);
    } else {
      url = new URL(path);
    }

    init.headers = new Headers(init.headers);

    if (json) {
      init.body = JSON.stringify(json);
      init.headers.set("content-type", "application/json");
      init.headers.set("content-length", init.body.length.toString());
    } else if (form) {
      init.body = new URLSearchParams();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined)
          (init.body as URLSearchParams).append(k, v.toString());
      });
      init.headers.set(
        "content-length",
        init.body.toString().length.toString(),
      );
      init.headers.set("content-type", "application/x-www-form-urlencoded");
    }

    if (finalResponseType)
      init.headers.set(
        "accept",
        init.headers.get("accept") ?? acceptHeaderValues[finalResponseType],
      );

    if (searchParams)
      Object.entries(searchParams).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, v.toString());
      });

    let request = new Request(url, init);

    for (const hook of finalHooks.beforeRequest) {
      const modifiedRequest = await hook({ request, context: finalContext });
      if (modifiedRequest instanceof Request) request = modifiedRequest;
    }

    let response = (await fetch(request)) as HttpResponse;

    if (finalResponseType) {
      try {
        response.data = await response[finalResponseType]();
      } catch {
        /* empty */
      }
    }

    for (const hook of finalHooks.afterResponse) {
      const modifiedResponse = await hook({ response, context: finalContext });
      if (modifiedResponse instanceof Response) response = modifiedResponse;
    }

    if (!response.ok)
      throw new HttpClientError({ request, response, context: finalContext });

    return response;
  }) as HttpClient;

  methods.forEach((method) => {
    fn[method] = (path, opts) =>
      fn(path, { ...opts, method: method.toUpperCase() });
  });

  return fn;
}

export const httpClient = createHttpClient();
