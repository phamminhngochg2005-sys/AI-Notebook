-- Sổ tay AI — schema D1 (SQLite). Áp dụng: npm run cf:db:migrate:local | cf:db:migrate:remote
-- Quy ước: thời gian TEXT ISO 8601 UTC có 'Z'; mảng/đối tượng lưu TEXT JSON; boolean INTEGER 0/1.
-- Thay đổi về sau: tạo 0002_*.sql, không sửa file này. Xem PLAN.md mục 5.

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id              TEXT PRIMARY KEY,                      -- u_xxxxxxxxxx (seed: u_admin, u_lan…)
  email           TEXT NOT NULL UNIQUE,                  -- chữ thường
  name            TEXT NOT NULL,
  school          TEXT NOT NULL DEFAULT '',
  province        TEXT NOT NULL DEFAULT '',
  subjects        TEXT NOT NULL DEFAULT '[]',            -- JSON string[]
  grades          TEXT NOT NULL DEFAULT '[]',            -- JSON number[]
  role            TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'editor', 'admin')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked')),
  lock_reason     TEXT NOT NULL DEFAULT '',
  pass_hash       TEXT NOT NULL,                         -- pbkdf2$<iter>$<salt_b64>$<hash_b64>
  created_at      TEXT NOT NULL,
  last_active_at  TEXT
);
CREATE INDEX idx_users_role ON users(role, status);
CREATE INDEX idx_users_created ON users(created_at);

CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,                          -- sha256(token) hex
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE TABLE prompts (
  id           TEXT PRIMARY KEY,                         -- seed: p01…p80; mới: p_xxxxxxxxxx
  title        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  grade        INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 5),
  purpose      TEXT NOT NULL CHECK (purpose IN ('draft', 'adapt', 'review', 'materials')),
  description  TEXT NOT NULL DEFAULT '',                 -- JSON: desc
  howto        TEXT NOT NULL DEFAULT '',
  conditions   TEXT NOT NULL DEFAULT '[]',               -- JSON string[]
  body         TEXT NOT NULL,                            -- JSON: text (nội dung câu lệnh)
  status       TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  sort_order   REAL NOT NULL DEFAULT 0,                  -- JSON: order
  search_text  TEXT NOT NULL DEFAULT '',                 -- vnNormalize(title, desc, subject, 'lop '+grade, howto, conditions, text)
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_prompts_list ON prompts(status, sort_order);
CREATE INDEX idx_prompts_subject ON prompts(subject, grade);

CREATE TABLE lessons (
  id           TEXT PRIMARY KEY,                         -- slug: toan-3-chu-vi…
  title        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  grade        INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 5),
  duration     INTEGER NOT NULL DEFAULT 35,
  summary      TEXT NOT NULL DEFAULT '',
  conditions   TEXT NOT NULL DEFAULT '[]',               -- JSON string[]
  goals        TEXT NOT NULL DEFAULT '',
  materials    TEXT NOT NULL DEFAULT '[]',               -- JSON string[]
  activities   TEXT NOT NULL DEFAULT '[]',               -- JSON [{name, minutes, teacher, students, evidence}]
  worksheet    TEXT NOT NULL DEFAULT '',
  questions    TEXT NOT NULL DEFAULT '[]',               -- JSON string[]
  adaptations  TEXT NOT NULL DEFAULT '[]',               -- JSON string[]
  review       TEXT NOT NULL DEFAULT '[]',               -- JSON string[]
  status       TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  sort_order   REAL NOT NULL DEFAULT 0,
  search_text  TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_lessons_list ON lessons(status, sort_order);

CREATE TABLE profiles (                                  -- hồ sơ lớp của giáo viên
  id          TEXT PRIMARY KEY,                          -- cp_xxxxxxxxxx
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  data        TEXT NOT NULL,                             -- JSON (PLAN.md 6.4)
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX idx_profiles_user ON profiles(user_id, updated_at);

CREATE TABLE plans (                                     -- "Kế hoạch của tôi"
  id              TEXT PRIMARY KEY,                      -- pl_xxxxxxxxxx
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  subject         TEXT NOT NULL,
  grade           INTEGER NOT NULL,
  base_prompt_id  TEXT,                                  -- không FK: câu lệnh có thể bị xoá
  prompt_text     TEXT NOT NULL,
  ai_result       TEXT NOT NULL DEFAULT '',
  note            TEXT NOT NULL DEFAULT '',
  checks          TEXT NOT NULL DEFAULT '[]',            -- JSON boolean[]
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'taught')),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX idx_plans_user ON plans(user_id, updated_at);

CREATE TABLE bookmarks (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('prompt', 'lesson')),
  target_id   TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, kind, target_id)
);
CREATE INDEX idx_bookmarks_target ON bookmarks(kind, target_id);

CREATE TABLE feedback (
  id          TEXT PRIMARY KEY,                          -- fb_xxxxxxxxxx
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  visitor_id  TEXT,                                      -- khi gửi ẩn danh
  kind        TEXT NOT NULL CHECK (kind IN ('prompt', 'lesson', 'general')),
  target_id   TEXT,                                      -- NULL với góp ý chung
  rating      INTEGER,                                   -- prompt: 1 | -1; lesson: 1..5; general: 1..5 | NULL
  comment     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'handled')),
  admin_note  TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX idx_feedback_target ON feedback(kind, target_id);
CREATE INDEX idx_feedback_status ON feedback(status, created_at);
-- Mỗi người chỉ có 1 đánh giá cho mỗi câu lệnh / bài mẫu (gửi lại = cập nhật)
CREATE UNIQUE INDEX uq_feedback_user ON feedback(user_id, kind, target_id) WHERE user_id IS NOT NULL AND kind <> 'general';
CREATE UNIQUE INDEX uq_feedback_visitor ON feedback(visitor_id, kind, target_id) WHERE user_id IS NULL AND kind <> 'general';

CREATE TABLE events (                                    -- số liệu sử dụng cho báo cáo nghiên cứu
  id          TEXT PRIMARY KEY,                          -- ev_xxxxxxxxxx
  type        TEXT NOT NULL CHECK (type IN ('visit', 'prompt_view', 'prompt_copy', 'custom_copy', 'lesson_view', 'lesson_copy', 'tool_open')),
  target_id   TEXT,
  visitor_id  TEXT NOT NULL,
  user_id     TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_events_time ON events(created_at);
CREATE INDEX idx_events_type_time ON events(type, created_at);
CREATE INDEX idx_events_target ON events(type, target_id);
CREATE INDEX idx_events_user ON events(user_id);

CREATE TABLE kv_store (                                  -- khoá: handbook, guide, checklist, settings
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,                             -- JSON
  updated_at  TEXT NOT NULL
);

CREATE TABLE rate_limits (
  key           TEXT NOT NULL,                           -- vd 'login:<ip>:<email>'
  window_start  INTEGER NOT NULL,                        -- unix giây, làm tròn theo cửa sổ
  count         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
