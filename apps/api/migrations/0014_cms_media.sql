-- 0014_cms_media.sql
-- Backing table for the admin CMS "Media Library" tab, which shipped with a
-- full UI (upload/list/delete/copy-URL) but no API — POST /cms/media 404'd.

CREATE TABLE IF NOT EXISTS cms_media (
  id           SERIAL PRIMARY KEY,
  filename     TEXT NOT NULL,
  url          TEXT NOT NULL,
  mime_type    TEXT,
  size_bytes   INT,
  uploaded_by  UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_media_created ON cms_media(created_at DESC);
