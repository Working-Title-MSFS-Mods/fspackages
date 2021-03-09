/*
  This code is "public domain". You can copy, modify, re-release and re-license, 
  or incorporate into any other project without restriction of any kind.
  Tiny SHA256 by Geraint Luff - https://github.com/geraintluff/
*/

export interface PkceChallenge {
  code_verifier: string,
  code_challenge: string
}

export class OAuthPkce {
  // eslint-disable-next-line no-var
  static sha256(r:string): any { function t(r, t) { return r >>> t | r << 32 - t } for (var h, n, o = Math.pow, e = o(2, 32), f = "", a = [], l = 8 * r.length, g = h = h || [], c = k = k || [], i = c.length, s = {}, u = 2; i < 64; u++)if (!s[u]) { for (h = 0; h < 313; h += u)s[h] = u; g[i] = o(u, .5) * e | 0, c[i++] = o(u, 1 / 3) * e | 0 } for (r += ""; r.length % 64 - 56;)r += "\0"; for (h = 0; h < r.length; h++) { if ((n = r.charCodeAt(h)) >> 8) return; a[h >> 2] |= n << (3 - h) % 4 * 8 } for (a[a.length] = l / e | 0, a[a.length] = l, n = 0; n < a.length;) { var v = a.slice(n, n += 16), k = g; for (g = g.slice(0, 8), h = 0; h < 64; h++) { var d = v[h - 15], p = v[h - 2], w = g[0], A = g[4], C = g[7] + (t(A, 6) ^ t(A, 11) ^ t(A, 25)) + (A & g[5] ^ ~A & g[6]) + c[h] + (v[h] = h < 16 ? v[h] : v[h - 16] + (t(d, 7) ^ t(d, 18) ^ d >>> 3) + v[h - 7] + (t(p, 17) ^ t(p, 19) ^ p >>> 10) | 0); (g = [C + ((t(w, 2) ^ t(w, 13) ^ t(w, 22)) + (w & g[1] ^ w & g[2] ^ g[1] & g[2])) | 0].concat(g))[4] = g[4] + C | 0 } for (h = 0; h < 8; h++)g[h] = g[h] + k[h] | 0 } for (h = 0; h < 8; h++)for (n = 3; n + 1; n--) { var M = g[h] >> 8 * n & 255; f += (M < 16 ? 0 : "") + M.toString(16) } return f }

  private static getRandomBytes(length) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes)
    return bytes
  }

  private static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((previousValue, currentValue) => {
      return previousValue + String.fromCharCode(currentValue)
    }, "")
    return btoa(binary);
  }

  private static base64URLEncode(str) {
    return OAuthPkce.arrayBufferToBase64(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  private static hexStringToBytes(str) {
    return Array.from(str.match(/.{1,2}/g), (byte:string) => {
      return parseInt(byte, 16)
    })
  }

  public static getChallenge(len: number): PkceChallenge {
    const verifier = OAuthPkce.base64URLEncode(OAuthPkce.getRandomBytes(len))
    const challenge = OAuthPkce.base64URLEncode(OAuthPkce.hexStringToBytes(OAuthPkce.sha256(verifier)))
    return { "code_verifier": verifier, "code_challenge": challenge }
  }
}
