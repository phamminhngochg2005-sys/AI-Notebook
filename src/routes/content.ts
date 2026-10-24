import { Hono } from 'hono';
import type { Bindings } from '../types';
import seed from '../../public/js/mock/seed-data.js';
import { requireStaff, requireAdmin } from '../lib/auth';
import { need, str, norm } from '../lib/http';
import { putKv } from '../lib/db';
const META=seed.meta;
const clone=o=>structuredClone(o);
const arrStr=(v,maxItems,maxLen)=>(Array.isArray(v)?v:[]).map(x=>str(x,maxLen)).filter(Boolean).slice(0,maxItems);
export const contentRoutes=new Hono<Bindings>();
const on=(method,path,fn)=>contentRoutes.on(method,path,fn);
    on('GET', '/content', async ctx => { requireStaff(ctx); return ctx.json(ctx.get('content')); });
    const HB_FIELDS = { productTitle: [300, 10], shortName: [40, 2], researchTitle: [400, 10], groupName: [150, 0], members: [400, 0], advisor: [150, 0], organization: [200, 0], year: [20, 0], applicationArea: [200, 0], applicationDescription: [1500, 0], introduction: [2000, 0] };
    const HB_LABEL = { productTitle: 'Tên sản phẩm', shortName: 'Tên ngắn', researchTitle: 'Tên đề tài' };
    on('PUT', '/handbook', async ctx => {
      requireStaff(ctx); const b = ctx.get('body'); const h = clone(ctx.get('content').handbook);
      for (const [k, [max, min]] of Object.entries(HB_FIELDS)) if (k in b) {
        h[k] = str(b[k], max);
        if (min) need(h[k].length >= min, 400, `${HB_LABEL[k]} cần ít nhất ${min} ký tự`);
        else if (!h[k]) h[k] = 'Đang cập nhật';
      }
      if ('announcement' in b) h.announcement = { enabled: !!b.announcement?.enabled, text: str(b.announcement?.text, 300) };
      need(!h.announcement.enabled || h.announcement.text.length >= 5, 400, 'Nhập nội dung thông báo hoặc tắt thông báo');
      await putKv(ctx.env.DB, 'handbook', h);
      return ctx.json({ handbook: clone(h) });
    });
    on('PUT', '/guide', async ctx => {
      requireStaff(ctx); const b = ctx.get('body'); const g = clone(ctx.get('content').guide);
      if ('steps' in b) {
        need(Array.isArray(b.steps) && b.steps.length >= 1 && b.steps.length <= 8, 400, 'Hướng dẫn cần từ 1 đến 8 bước');
        const visualIds = META.visuals.map(v => v.id);
        g.steps = b.steps.map((s, i) => {
          const x = { id: str(s?.id, 20) || 's' + (i + 1), title: str(s?.title, 80), summary: str(s?.summary, 160), visual: visualIds.includes(s?.visual) ? s.visual : 'none', points: arrStr(s?.points, 6, 300) };
          need(x.title.length >= 3, 400, `Bước ${i + 1} cần có tiêu đề`); need(x.points.length >= 1, 400, `Bước ${i + 1} cần ít nhất 1 ý hướng dẫn`);
          return x;
        });
      }
      if ('tools' in b) {
        need(Array.isArray(b.tools) && b.tools.length <= 6, 400, 'Tối đa 6 công cụ AI');
        g.tools = b.tools.map((t, i) => {
          const x = { id: str(t?.id, 30) || norm(t?.name || 'tool' + i).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tool' + i, name: str(t?.name, 40), url: str(t?.url, 200) };
          need(x.name, 400, 'Mỗi công cụ cần có tên'); need(/^https:\/\/[^\s]+$/.test(x.url), 400, `Địa chỉ của ${x.name} phải bắt đầu bằng https://`);
          return x;
        });
      }
      if ('video' in b) {
        const v = b.video || {};
        g.video = { title: str(v.title, 120), url: str(v.url, 300), duration: str(v.duration, 10), note: str(v.note, 200) };
        need(!g.video.url || /^https:\/\/[^\s]+$/.test(g.video.url), 400, 'Đường dẫn video phải bắt đầu bằng https://');
      }
      await putKv(ctx.env.DB, 'guide', g);
      return ctx.json({ guide: clone(g) });
    });
    on('PUT', '/checklist', async ctx => {
      requireStaff(ctx); const b = ctx.get('body');
      need(Array.isArray(b.items) && b.items.length >= 3 && b.items.length <= 12, 400, 'Danh mục kiểm tra cần từ 3 đến 12 mục');
      const items = b.items.map((x, i) => { const o = { title: str(x?.title, 100), detail: str(x?.detail, 300) }; need(o.title.length >= 3, 400, `Mục ${i + 1} cần có tiêu đề`); return o; });
      await putKv(ctx.env.DB, 'checklist', items);
      return ctx.json({ checklist: clone(items) });
    });
    on('PUT', '/settings', async ctx => {
      requireAdmin(ctx); const b = ctx.get('body'); const s = clone(ctx.get('content').settings);
      if ('allowRegistration' in b) s.allowRegistration = !!b.allowRegistration;
      if ('allowAnonymousFeedback' in b) s.allowAnonymousFeedback = !!b.allowAnonymousFeedback;
      if ('maxPlansPerUser' in b) { const n = Number(b.maxPlansPerUser); need(Number.isInteger(n) && n >= 1 && n <= 500, 400, 'Số kế hoạch tối đa từ 1 đến 500'); s.maxPlansPerUser = n; }
      if ('maxProfilesPerUser' in b) { const n = Number(b.maxProfilesPerUser); need(Number.isInteger(n) && n >= 1 && n <= 100, 400, 'Số hồ sơ lớp tối đa từ 1 đến 100'); s.maxProfilesPerUser = n; }
      await putKv(ctx.env.DB, 'settings', s);
      return ctx.json({ settings: clone(s) });
    });

