export interface Env extends Omit<Cloudflare.Env, 'APP_ENV'> {
  APP_ENV: string;
  BOOTSTRAP_ADMIN_EMAIL?: string;
  BOOTSTRAP_ADMIN_PASSWORD?: string;
}
// JSON records preserve the reference API's optional fields during validation.
export type Row = Record<string, any>;
export type Bindings = { Bindings: Env; Variables: { me: Row | null; token: string; body: Row; settings: Row; content: Row } };
