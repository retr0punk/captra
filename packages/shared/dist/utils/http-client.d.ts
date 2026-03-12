type ResponseType = "arrayBuffer" | "blob" | "formData" | "json" | "text";
type SearchParams = Record<string, string | number | boolean>;
type HttpResponse = Response & {
    data: any;
};
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
type Options = Config & ({
    body: Exclude<RequestInit["body"], undefined>;
    json?: never;
    form?: never;
} | {
    body?: never;
    json: unknown;
    form?: never;
} | {
    body?: never;
    json?: never;
    form: SearchParams;
} | {
    body?: never;
    json?: never;
    form?: never;
}) & {
    searchParams?: SearchParams;
    context?: Context;
};
type HttpClient = ((path: string, opts?: Omit<RequestInit, "body"> & Options) => Promise<HttpResponse>) & {
    [K in (typeof methods)[number]]: (path: string, opts?: Omit<RequestInit, "method" | "body"> & Options) => Promise<HttpResponse>;
};
declare const methods: readonly ["get", "post", "delete", "put", "patch"];
interface IHttpClientError {
    request: Request;
    response: HttpResponse;
    context: Context;
}
export interface HttpClientError extends IHttpClientError {
}
export declare class HttpClientError extends Error {
    constructor({ request, response, context }: IHttpClientError);
}
export declare function createHttpClient(config?: Config): HttpClient;
export declare const httpClient: HttpClient;
export {};
//# sourceMappingURL=http-client.d.ts.map