-- Per-space sidebar configuration (menu + styles)
BEGIN;

ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS sidebar_config JSONB DEFAULT '{
    "style": {
      "backgroundType": "color",          -- color | image | gradient
      "backgroundColor": "#0f172a",
      "backgroundImage": null,
      "gradient": {
        "from": "#0f172a",
        "to": "#1e293b",
        "angle": 180
      },
      "fontColor": "#ffffff",
      "size": "medium"                    -- small | medium | large
    },
    "menu": []
  }'::jsonb;

COMMIT;


