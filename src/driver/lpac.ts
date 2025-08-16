import { Command } from '@tauri-apps/plugin-shell';
import Logger from '../Logger';
import DebounceCancelPrevious from "../utils/Debounce";
import type { DriversResponse, DriversResponsePayload, Profile, ProfilesResponse, NullResponse, ApduListResponse, ApduPayload } from './types';
import type { ChildProcess } from '@tauri-apps/plugin-shell';

export default class LPAC {
  private encoding: string;
  private logger?: Logger;
  public env: Record<string, string>;

  constructor({ encoding, logger, env }: { encoding?: string; logger?: Logger; env?: Record<string, string> }) {
    this.encoding = encoding || "utf-8";
    this.env = env || {};
    this.logger = logger;
  }

  public getEnvKey(key: string): string | null {
    let keyValue:string|null|undefined = this.env[key];
    if (keyValue === undefined) {
      keyValue = null;
    }
    this.logger?.info(`Getting environment variable ${key}: ${keyValue}`);
    return keyValue;
  }

  public setEnvKey(key: string, value: string) {
    this.logger?.info(`Setting environment variable ${key} to ${value}`);
    this.env[key] = value;
  }

  public delEnvKey(key: string) {
    this.logger?.info(`Deleting environment variable ${key}`);
    delete this.env[key];
  }

  // 封装重复逻辑
  @DebounceCancelPrevious(500)
  private async _execCommand<T>(args: string[]): Promise<{ raw: ChildProcess<string>, output: T }> {
    const command = Command.sidecar('sidecar/lpac', args, { encoding: this.encoding, env: this.env });
    const raw = await command.execute();

    if (raw.code !== 0) {
      const msg = `Command failed: stderr: ${raw.stderr}, stdout: ${raw.stdout}, code: ${raw.code}`;
      this.logger?.error(msg);
      throw new Error(msg);
    }

    const lines = raw.stdout.trim().split(/\r?\n/);
    const lastLine = lines.pop()!;
    lines.forEach(line => this.logger?.info(line));

    try {
      const parsed = JSON.parse(lastLine) as T;
      return { raw, output: parsed };
    } catch (err) {
      this.logger?.error(`Failed to parse JSON, discarding last line: ${lastLine}`);
      throw err;
    }
  }


  public async getDrivers(): Promise<DriversResponsePayload> {
    const raw = await this._execCommand<DriversResponse>(['driver', 'list']);
    return raw.output.payload;
  }

  public async getApdus(): Promise<ApduPayload> {
    try {
      const raw = await this._execCommand<ApduListResponse>(['driver', 'apdu', 'list']);
      return raw.output.payload;
    } catch (e) {
      this.logger?.error(`Error getting APDU: ${(e as Error).message}`);
      return { env: "", data: [] };
    }
  }

  public async getProfiles(): Promise<Profile[]> {
    try {
      const raw = await this._execCommand<ProfilesResponse>(['profile', 'list']);
      if (raw.output.payload.message !== "success") {
        this.logger?.error(`Failed to get profiles list, message: ${raw.output.payload.message}`);
        return [];
      }
      return raw.output.payload.data;
    } catch (e) {
      this.logger?.error(`Error getting profiles: ${(e as Error).message}`);
      return [];
    }
  }

  public async switchProfile(iccid: string, type: "enable" | "disable"): Promise<boolean> {
    try {
      const raw = await this._execCommand<NullResponse>(['profile', type, iccid]);
      if (raw.output.payload.message !== "success") {
        this.logger?.error(`Failed to switch profile, message: ${raw.output.payload.message}`);
        return false;
      }
      this.logger?.info(`Profile switched successfully: ${iccid}`);
      return true;
    } catch (e) {
      this.logger?.error(`Error switching profile: ${(e as Error).message}`);
      return false;
    }
  }

  public async setProfileName(iccid: string, name: string): Promise<boolean> {
    try {
      const raw = await this._execCommand<NullResponse>(['profile', 'nickname', iccid, name]);
      if (raw.output.payload.message !== "success" || raw.output.payload.code !== 0) {
        this.logger?.error(`Failed to set profile name, message: ${raw.output.payload.message}`);
        return false;
      }
      this.logger?.info(`Profile name set successfully: ${iccid} -> ${name}`);
      return true;
    } catch (e) {
      this.logger?.error(`Error setting profile name: ${(e as Error).message}`);
      return false;
    }
  }
}
