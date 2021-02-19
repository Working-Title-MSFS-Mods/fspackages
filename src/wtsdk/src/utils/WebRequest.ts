export interface RequestOptions {
  ignoreCache?: boolean;
  headers?: { [key: string]: string };
  // 0 (or negative) to wait forever
  timeout?: number;
}

export const DEFAULT_REQUEST_OPTIONS = {
  ignoreCache: true,
  headers: {
    Accept: 'application/json, text/javascript, text/plain',
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  // default max duration for a request
  timeout: 10000,
};

export interface RequestResult {
  ok: boolean;
  status: number;
  statusText: string;
  data: string;
  json: <T>() => T;
  headers: string;
}

function queryParams(params: any = {}) {
  if (params === null) {
    return "";
  }
  return Object.keys(params)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');
}

function urlencodeFormData(fd: Map<string, string>) {
  const params = new URLSearchParams();
  fd.forEach((v, k) => {
    params.append(k, v);
  });
  return params.toString();
}

function withQuery(url: string, params: any = {}) {
  const queryString = queryParams(params);
  return queryString ? url + (url.indexOf('?') === -1 ? '?' : '&') + queryString : url;
}

function parseXHRResult(xhr: XMLHttpRequest): RequestResult {
  return {
    ok: xhr.status >= 200 && xhr.status < 300,
    status: xhr.status,
    statusText: xhr.statusText,
    headers: xhr.getAllResponseHeaders(),
    data: xhr.responseText,
    json: <T>() => JSON.parse(xhr.responseText) as T,
  };
}

function errorResponse(xhr: XMLHttpRequest, message: string | null = null): RequestResult {
  return {
    ok: false,
    status: xhr.status,
    statusText: xhr.statusText,
    headers: xhr.getAllResponseHeaders(),
    data: message || xhr.statusText,
    json: <T>() => JSON.parse(message || xhr.statusText) as T,
  };
}

export async function request(method: 'get' | 'post',
  url: string,
  queryParams: any = {},
  body: any = null,
  options: RequestOptions = DEFAULT_REQUEST_OPTIONS): Promise<RequestResult> {

  const ignoreCache = options.ignoreCache || DEFAULT_REQUEST_OPTIONS.ignoreCache;
  const headers = options.headers || DEFAULT_REQUEST_OPTIONS.headers;
  const timeout = options.timeout || DEFAULT_REQUEST_OPTIONS.timeout;

  return new Promise<RequestResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const href = withQuery(url, queryParams);
    xhr.open(method, url, true);

    if (headers) {
      Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));
    }

    if (ignoreCache) {
      xhr.setRequestHeader('Cache-Control', 'no-cache');
    }

    // xhr.timeout = timeout;

    xhr.onload = evt => {
      resolve(parseXHRResult(xhr));
    };

    xhr.onerror = evt => {
      resolve(errorResponse(xhr, 'Failed to make request.'));
    };

    xhr.ontimeout = evt => {
      resolve(errorResponse(xhr, 'Request took longer than expected.'));
    };

    if (method === 'post' && body) {
      if (body instanceof Map) {
        xhr.send(urlencodeFormData(body));
      } else {
        xhr.send(JSON.stringify(body));
      }
    } else {
      xhr.send();
    }
  });
}