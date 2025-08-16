export interface Response {
  type: string;
  payload: unknown;
}

export interface DriversResponse extends Response {
  type: "driver";
  payload: DriversResponsePayload;
}

export interface DriversResponsePayload {
  LPAC_APDU: string[];
  LPAC_HTTP: string[];
}

export interface LPAResponse<T = unknown[] | Record<string | number | symbol, unknown> | null> extends Response {
  type: "lpa";
  payload: {
    code: number;
    message: string;
    data: T;
  };
}

export type ProfilesResponse = LPAResponse<Profile[]>;

export interface Profile{
  iccid: string; // e.g. "8937204016920043713"
  isdpAid: string; // e.g. "a0000005591010ffffffff8900001000"
  profileState: "enabled" | "disabled"; 
  profileNickname: string; // e.g. "🇭🇰乌龟亚洲 +372"
  serviceProviderName: string; // e.g. "eSIM Internet"
  profileName: string; // e.g. "Top_Connect_eSIM"
  iconType: string | null; // e.g png
  icon: string | null; // base64
  profileClass: string; // e.g. "operational"
}

export type NullResponse = LPAResponse<null>;

export interface ApduPayload {
  env: string; // e.g. "LPAC_APDU_PCSC_DRV_IFID" / "LPAC_APDU_AT_DEVICE"
  data: { env: string; name: string }[];
}

export interface ApduListResponse extends Response {
  type: "driver";
  payload: ApduPayload;
}

