import * as NgApi from '../types/navigraph';
import { request, RequestResult } from './WebRequest';

export class NavigraphApi {
  public readonly RFRSH_TOKEN_KEY = "WT_NG_REFRESH_TOKEN"

  private _refreshToken: string = "";
  private _accessToken: string = "";
  private _accessTokenTimestamp: number = 0;

  public get isAccountLinked(): boolean {
    this._refreshToken = WTDataStore.get(this.RFRSH_TOKEN_KEY, "");
    return this._refreshToken !== "";
  }

  public set refreshToken(val: string) {
    this._refreshToken = val;
    WTDataStore.set(this.RFRSH_TOKEN_KEY, val);
  }

  public get hasAccessToken(): boolean {
    return this._accessToken !== "";
  }

  public set accessToken(val: string) {
    this._accessToken = val;
    this._accessTokenTimestamp = Date.now();
  }

  /**
   *
   */
  constructor() {
    this._refreshToken = WTDataStore.get(this.RFRSH_TOKEN_KEY, "");
  }

  async validateToken(): Promise<void> {
    if (this.isAccountLinked) {
      if (!this.hasAccessToken ||
        (this.hasAccessToken && (Date.now() - this._accessTokenTimestamp) > 1.8e+6)) {
        await this.refreshAccessToken();
      }
    } else {
      await this.linkAccount();
    }
  }

  async refreshAccessToken(): Promise<void> {
    const refreshForm: Map<string, string> = new Map([
      ["grant_type", "refresh_token"],
      ["refresh_token", this._refreshToken],
    ]);
    const refreshResp = await this.sendRequest("https://identity.api.navigraph.com/connect/token", "post", refreshForm);
    if (refreshResp.ok) {
      this.refreshToken = refreshResp.json<any>().refresh_token;
      this.accessToken = refreshResp.json<any>().access_token;
    }
    return;
  }

  async getChartsList(icao: string): Promise<NgApi.NG_Charts> {
    await this.validateToken();
    const signedUrlResp = await this.sendRequest(`https://charts.api.navigraph.com/2/airports/${icao}/signedurls/charts.json`, "get", null, true);
    const signedUrl = signedUrlResp.data;
    const chartsListResp = await this.sendRequest(signedUrl, "get");
    return chartsListResp.json<NgApi.NG_Charts>();
  }

  async linkAccount(): Promise<boolean> {
    // send auth request
    const authResp = await this.sendRequest("https://identity.api.navigraph.com/connect/deviceauthorization", "post");
    if (authResp.ok) {
      // send user to page
      OpenBrowser(authResp.json<any>().verification_uri_complete);
      // poll for token
      const pollForm: Map<string, string> = new Map([
        ["grant_type", "urn:ietf:params:oauth:grant-type:device_code"],
        ["device_code", authResp.json<any>().device_code],
        ["scope", "openid charts offline_access"]
      ]);

      while (!this.isAccountLinked) {
        await this.delay(4000);
        const pollResp = await this.sendRequest("https://identity.api.navigraph.com/connect/token", "post", pollForm);
        if (pollResp.ok) {
          this.refreshToken = pollResp.json<any>().refresh_token;
          this.accessToken = pollResp.json<any>().access_token;
        }
      }

      return true;
    } else {
      throw ("Auth failed");
    }
  }

  async sendRequest(path: string, method: 'get' | 'post', form: Map<string, string> = null, auth: boolean = false): Promise<RequestResult> {
    const formData = new Map<string, string>();
    formData.set('client_id', 'wt-cj4');
    formData.set('client_secret', 'G9UBWOECCJeBe1NbOv10YfGBog8ViVjI');
    if (form !== null) {
      form.forEach((v, k) => {
        formData.set(k, v);
      })
    }

    const options = {
      ignoreCache: false,
      headers: {
        Accept: 'application/json, text/javascript, text/plain',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // default max duration for a request
      timeout: 10000,
    };

    if (auth) {
      options.headers["Authorization"] = "Bearer " + this._accessToken;
    }

    const response = await request(method, path, null, formData, options);
    return response;
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}