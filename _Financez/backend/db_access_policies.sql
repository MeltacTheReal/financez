-- Categories
alter table public.categories enable row level security;

drop policy if exists "auth all categories" on public.categories;
create policy "auth all categories"
on public.categories
for all
to authenticated
using (true)
with check (true);

-- Expenses
alter table public.expenses enable row level security;

drop policy if exists "auth all expenses" on public.expenses;
create policy "auth all expenses"
on public.expenses
for all
to authenticated
using (true)
with check (true);