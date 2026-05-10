CREATE TABLE IF NOT EXISTS users(
    user_id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash BYTEA,
    is_approved BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'user'
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

UPDATE users
SET role = 'user'
WHERE role IS NULL;

UPDATE users
SET is_approved = false
WHERE is_approved IS NULL;

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
    ticket_priority PRIORITY DEFAULT 'medium',
    ticket_status STATUS DEFAULT 'open',
    ticket_category_id INTEGER REFERENCES ticket_categories(category_id) ON DELETE SET NULL ON UPDATE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    assignee_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT false,
    chat_started BOOLEAN DEFAULT false
);

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS chat_started BOOLEAN DEFAULT false;

ALTER TABLE tickets
ALTER COLUMN ticket_priority SET DEFAULT 'medium';

ALTER TABLE tickets
ALTER COLUMN ticket_status SET DEFAULT 'open';

UPDATE tickets
SET is_archived = false
WHERE is_archived IS NULL;

UPDATE tickets
SET chat_started = false
WHERE chat_started IS NULL;

UPDATE tickets
SET ticket_priority = 'medium'
WHERE ticket_priority IS NULL;

UPDATE tickets
SET ticket_status = 'open'
WHERE ticket_status IS NULL;

CREATE TABLE IF NOT EXISTS ticket_messages (
    message_id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
    sender_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_updates(
    update_id INTEGER PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(ticket_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ticket_status STATUS,
    message TEXT,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- manually insert an ADMIN user upon starting/querying the database
INSERT INTO users (email, name, password_hash, is_approved, role)
VALUES (
    'test@example.com',
    'Test Admin',
    convert_to('$2b$10$Dx2nfdBpynRXMS6ecDkFNO9tyAoh0Pyp11m6AB0X1OoCJKcMZ/YxS', 'UTF8'),
    TRUE,
	'admin'
)
ON CONFLICT (email)
DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    is_approved = TRUE,
	role = 'admin';

-- give test user admin role
INSERT INTO admins (user_id)
SELECT user_id
FROM users
WHERE email = 'test@example.com'
ON CONFLICT DO NOTHING;