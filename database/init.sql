CREATE TABLE IF NOT EXISTS users(
    user_id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash BYTEA,
    is_approved BOOLEAN
);

CREATE TABLE IF NOT EXISTS agents(
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS admins(
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DO $$ BEGIN
    CREATE TYPE PRIORITY AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE STATUS AS ENUM ('new', 'open', 'pending', 'closed', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS ticket_categories(
    category_id INTEGER PRIMARY KEY,
    category_name TEXT
);

CREATE TABLE IF NOT EXISTS tickets(
    ticket_id INTEGER PRIMARY KEY,
    title TEXT,
    description TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ticket_priority PRIORITY,
    ticket_status STATUS,
    ticket_category_id INTEGER REFERENCES ticket_categories(category_id) ON DELETE SET NULL ON UPDATE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    assignee_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ticket_updates(
    update_id INTEGER PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ticket_status STATUS,
    message TEXT,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

