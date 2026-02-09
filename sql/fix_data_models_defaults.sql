-- Migration to add missing defaults to data_models and data_model_spaces
ALTER TABLE public.data_models ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.data_model_spaces ALTER COLUMN id SET DEFAULT gen_random_uuid();
