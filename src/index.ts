import { app } from './app';
import type { Env } from './types';
import { cleanup } from './lib/maintenance';
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/js/mock/')) return new Response('Không tìm thấy', { status: 404 });
    if (path === '/api' || path.startsWith('/api/')) return app.fetch(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext) {
    await cleanup(env.DB);
  }
} satisfies ExportedHandler<Env>;
