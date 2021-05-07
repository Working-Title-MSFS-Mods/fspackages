class WT_URLRequest {
    static _queryParams(params = {}) {
        if (params === null) {
            return "";
        }
        return Object.keys(params)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
            .join('&');
    }
    static _urlencodeFormData(fd) {
        const params = new URLSearchParams();
        fd.forEach((v, k) => {
            params.append(k, v);
        });
        return params.toString();
    }
    static _withQuery(url, params = {}) {
        const queryString = WT_URLRequest._queryParams(params);
        return queryString ? url + (url.indexOf('?') === -1 ? '?' : '&') + queryString : url;
    }
    static _parseXHRResult(xhr) {
        return {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: xhr.getAllResponseHeaders(),
            data: xhr.responseText,
            json: () => JSON.parse(xhr.responseText),
        };
    }
    static _errorResponse(xhr, message = null) {
        return {
            ok: false,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: xhr.getAllResponseHeaders(),
            data: message || xhr.statusText,
            json: () => JSON.parse(message || xhr.statusText),
        };
    }
    static request(method, url, queryParams = {}, body = null, options = WT_URLRequest.DEFAULT_REQUEST_OPTIONS) {
        return WT_Wait.awaitGenerator(this, void 0, void 0, function* () {
            const ignoreCache = options.ignoreCache || WT_URLRequest.DEFAULT_REQUEST_OPTIONS.ignoreCache;
            const headers = options.headers || WT_URLRequest.DEFAULT_REQUEST_OPTIONS.headers;
            const timeout = options.timeout || WT_URLRequest.DEFAULT_REQUEST_OPTIONS.timeout;
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const href = WT_URLRequest._withQuery(url, queryParams);
                xhr.open(method, url, true);
                if (headers) {
                    Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));
                }
                // xhr.timeout = timeout;
                xhr.onload = evt => {
                    resolve(WT_URLRequest._parseXHRResult(xhr));
                };
                xhr.onerror = evt => {
                    resolve(WT_URLRequest._errorResponse(xhr, 'Failed to make request.'));
                };
                xhr.ontimeout = evt => {
                    resolve(WT_URLRequest._errorResponse(xhr, 'Request took longer than expected.'));
                };
                if (method === 'post' && body) {
                    if (body instanceof Map) {
                        xhr.send(WT_URLRequest._urlencodeFormData(body));
                    }
                    else {
                        xhr.send(JSON.stringify(body));
                    }
                }
                else {
                    xhr.send();
                }
            });
        });
    }
}
WT_URLRequest.DEFAULT_REQUEST_OPTIONS = {
    ignoreCache: true,
    headers: {
        Accept: 'application/json, text/javascript, text/plain',
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    // default max duration for a request
    timeout: 10000,
};