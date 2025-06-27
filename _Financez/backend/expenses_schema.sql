-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    amount DOUBLE PRECISION NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE NO ACTION,
    date DATE NOT NULL,
    description TEXT
); 