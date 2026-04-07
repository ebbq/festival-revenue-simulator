-- EBBQ Festival Management System — Budget & Edition Comparison
-- Version: 1.1
-- Date: 2026-04-08

-- Add budget flag to expenses
ALTER TABLE public.expenses ADD COLUMN is_budget boolean NOT NULL DEFAULT false;

-- Add edition comparison toggle
ALTER TABLE public.editions ADD COLUMN show_edition_comparison boolean NOT NULL DEFAULT false;

-- Make description nullable for budget entries
ALTER TABLE public.expenses ALTER COLUMN description DROP NOT NULL;
