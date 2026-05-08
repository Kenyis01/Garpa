# Supabase – Garpa

Esta carpeta contiene las migraciones SQL versionadas que definen el schema, RLS y RPC del backend.

## Estructura

```
supabase/
  migrations/
    20260101000000_initial_schema.sql       Tablas base (profiles, groups, expenses, splits, settlements...)
    20260101000100_rls_policies.sql         Row Level Security en todas las tablas
    20260101000200_create_expense_with_splits.sql  RPC atómica para crear gasto + splits
```

## Cómo aplicar

### Local (recomendado)

```bash
supabase start
supabase db reset
```

### Remoto

```bash
supabase link --project-ref <ref>
supabase db push
```

## Convenciones

- Cada migración es **idempotente** cuando es posible (`drop policy if exists`, `create table if not exists`).
- Las RPCs usan `security invoker` para respetar RLS.
- Toda tabla tiene RLS habilitada y al menos una política explícita.

## Generar tipos TypeScript

```bash
supabase gen types typescript --project-id <ref> > types/database.ts
```
