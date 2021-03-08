import * as NgApi from '../types/navigraph';
import { OAuthPkce } from './OAuthPkce';
import { request, RequestResult } from './WebRequest';

export class NavigraphApi {
  public readonly RFRSH_TOKEN_KEY = "WT_NG_REFRESH_TOKEN"

  private _refreshToken: string = "";
  private _accessToken: string = "";
  private _accessTokenTimestamp: number = 0;

  private _chartListCache: Map<string, NgApi.NG_Charts> = new Map();
  private _chartCacheTimestamp: number = 0;

  /** Gets a boolean indicating if the navigraph account is linked */
  public get isAccountLinked(): boolean {
    this._refreshToken = WTDataStore.get(this.RFRSH_TOKEN_KEY, "");
    return this._refreshToken !== "";
  }

  /** Sets the refresh token */
  public set refreshToken(val: string) {
    this._refreshToken = val;
    WTDataStore.set(this.RFRSH_TOKEN_KEY, val);
  }

  public get refreshToken(): string {
    return WTDataStore.get(this.RFRSH_TOKEN_KEY, "");
  }

  /** Returns a boolean indicating if a access token is known */
  public get hasAccessToken(): boolean {
    return this._accessToken !== "";
  }

  /** Sets the access token */
  public set accessToken(val: string) {
    this._accessToken = val;
    this._accessTokenTimestamp = Date.now();
  }

  /**
   * Checks if the access token is still good or starts the link account process
   */
  async validateToken(): Promise<void> {
    if (this.isAccountLinked) {
      if (!this.hasAccessToken ||
        (this.hasAccessToken && (Date.now() - this._accessTokenTimestamp) > 900000)) {
        await this.refreshAccessToken();
      }
    } else {
      await this.linkAccount();
    }
  }

  /**
   * Refreshes the access token using the refresh token
   */
  async refreshAccessToken(): Promise<void> {
    const refreshForm: Map<string, string> = new Map([
      ["grant_type", "refresh_token"],
      ["refresh_token", this.refreshToken],
    ]);
    const refreshResp = await this.sendRequest("https://identity.api.navigraph.com/connect/token", "post", refreshForm);
    if (refreshResp.ok) {
      this.refreshToken = refreshResp.json<any>().refresh_token;
      this.accessToken = refreshResp.json<any>().access_token;
    }
    return;
  }

  /**
   * Gets a list of charts for the given ICAO
   * @param icao The ICAO of the airport to get the charts from
   */
  async getChartsList(icao: string): Promise<NgApi.NG_Charts | undefined> {
    this.invalidateChartCache();

    let chartsObj: NgApi.NG_Charts;
    if (icao === "" || icao === "----") {
      return chartsObj;
    }

    if (!this._chartListCache.has(icao)) {
      await this.validateToken();
      const signedUrlResp = await this.sendRequest(`https://charts.api.navigraph.com/2/airports/${icao}/signedurls/charts.json`, "get", null, true);
      const signedUrl = signedUrlResp.data;
      const chartsListResp = await this.sendRequest(signedUrl, "get");
      if (chartsListResp.ok) {
        chartsObj = chartsListResp.json<NgApi.NG_Charts>();
        this._chartListCache.set(icao, chartsObj);
      }
      return chartsObj;
    } else {
      return this._chartListCache.get(icao);
    }
  }

  private invalidateChartCache() {
    if (this._chartCacheTimestamp === 0 || ((Date.now() - this._chartCacheTimestamp) > 300000)) {
      this._chartCacheTimestamp = Date.now();
      this._chartListCache.clear();
    }
  }

  /**
   * Executes the navigraph account linking process
   */
  async linkAccount(): Promise<boolean> {
    this.refreshToken = "";
    this.accessToken = "";

    const pkce = OAuthPkce.getChallenge(32);
    const authForm: Map<string, string> = new Map([
      ["code_challenge", pkce.code_challenge],
      ["code_challenge_method", "S256"]
    ]);

    // send auth request
    const authResp = await this.sendRequest("https://identity.api.navigraph.com/connect/deviceauthorization", "post", authForm);
    if (authResp.ok) {
      // send user to page
      OpenBrowser(authResp.json<any>().verification_uri_complete);
      // poll for token
      const pollForm: Map<string, string> = new Map([
        ["grant_type", "urn:ietf:params:oauth:grant-type:device_code"],
        ["device_code", authResp.json<any>().device_code],
        ["scope", "openid charts offline_access"],
        ["code_verifier", pkce.code_verifier]
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

  /**
   * Used to encapsulate requests to navigraph
   * @param path The url the request points to
   * @param method "GET" or "POST"
   * @param form A map of data to send in the request body
   * @param auth A boolean indicating if the auth token should be used for this request
   */
  async sendRequest(path: string, method: 'get' | 'post', form: Map<string, string> = null, auth: boolean = false): Promise<RequestResult> {
    const formData = new Map<string, string>();
    formData.set(LZUTF8.decompress(this.placeholdertext1, { inputEncoding: "StorageBinaryString" }), LZUTF8.decompress(this.placeholdertext2, { inputEncoding: "StorageBinaryString" }));
    formData.set(LZUTF8.decompress(this.placeholdertext3, { inputEncoding: "StorageBinaryString" }), LZUTF8.decompress(this.placeholdertext4, { inputEncoding: "StorageBinaryString" }));
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

  /**
   * Artificial delay
   * @param ms Time to delay
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private readonly placeholdertext1: string = "ㆶᩙⷎ䗶䬠耂老";
  private readonly placeholdertext2: string = "㮺୘浆䀀耀";
  private readonly placeholdertext3: string = "ㆶᩙⷎ䗷ᬫ෉䫨耂老";
  private readonly placeholdertext4: string = "⎜啐䫩瑔ᨚ⦕ӊㅎㄧ嶌☋ᙤ㨓㶜炬楖㔤䀀耀";
}