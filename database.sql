DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

DROP DATABASE IF EXISTS launchstoredb;

-- Para reiniciar uma tabela, veja o exemplo:
DELETE FROM nomedatabela;
ALTER SEQUENCE nomedatabela_id_seq RESTART;
UPDATE nomedatabela SET id = DEFAULT;
--

CREATE DATABASE launchstoredb;

CREATE TABLE "products"
(
  "id" SERIAL PRIMARY KEY,
  "category_id" int NOT NULL,
  "user_id" int,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "old_price" int,
  "price" int NOT NULL,
  "quantity" int DEFAULT 0,
  "status" int DEFAULT 1,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "categories"
(
  "id" SERIAL PRIMARY KEY,
  "name" text NOT NULL
);

CREATE TABLE "files"
(
  "id" SERIAL PRIMARY KEY,
  "product_id" int,
  "name" text,
  "path" text NOT NULL
);

ALTER TABLE "products" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id");
ALTER TABLE "files" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id");

CREATE TABLE "users"
(
  "id" SERIAL PRIMARY KEY,
  "name" text NOT NULL,
  "email" text UNIQUE NOT NULL,
  "password" text NOT NULL,
  "cpf_cnpj" text UNIQUE NOT NULL,
  "cep" text,
  "address" text,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

-- token password recovery
ALTER TABLE "users" ADD COLUMN reset_token text;
ALTER TABLE "users" ADD COLUMN reset_token_expires text;

-- foreign key
ALTER TABLE "products" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

-- create procedure
CREATE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- auto updated_at products
CREATE TRIGGER set_timestamp
BEFORE
UPDATE ON products
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp
();

-- auto updated_at users
CREATE TRIGGER set_timestamp
BEFORE
UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp
();

-- connect pg simple table
CREATE TABLE "session"
(
  "sid" varchar NOT NULL
  COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp
  (6) NOT NULL
)
  WITH
  (OIDS=FALSE);

  ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
  NOT DEFERRABLE INITIALLY IMMEDIATE;

  CREATE INDEX "IDX_session_expire" ON "session" ("expire");

  -- cascade effect when delete user and products
  ALTER TABLE "products"
DROP CONSTRAINT products_user_id_fkey
  ,
  ADD CONSTRAINT products_user_id_fkey
FOREIGN KEY
  ("user_id")
REFERENCES "users"
  ("id")
ON
  DELETE CASCADE;

  ALTER TABLE "files"
DROP CONSTRAINT files_product_id_fkey
  ,
  ADD CONSTRAINT files_product_id_fkey
FOREIGN KEY
  ("product_id")
REFERENCES "products"
  ("id")
ON
  DELETE CASCADE;
  

CREATE TABLE "orders" (
  "id" SERIAL PRIMARY KEY,
  "seller_id" int NOT NULL,
  "buyer_id" int NOT NULL,
  "product_id" int NOT NULL,
  "price" int NOT NULL,
  "quantity" int DEFAULT 0,
  "total" int NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
  );
  
ALTER TABLE "orders" ADD FOREIGN KEY ("seller_id") REFERENCES "users" ("id");
ALTER TABLE "orders" ADD FOREIGN KEY ("buyer_id") REFERENCES "users" ("id");
ALTER TABLE "orders" ADD FOREIGN KEY ("product_id") REFERENCES "users" ("id");

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Soft DELETE
-- 1. Criar uma coluna na table products chamda "deleted_at"
ALTER TABLE products ADD COLUMN "deleted_at" timestamp;
-- 2. Criar uma Regra que vai rodar todas as vezes que solicitamos o DELETE
CREATE OR REPLACE RULE delete_product AS
ON DELETE TO products DO INSTEAD
UPDATE products
SET deleted_at = now()
WHERE products.id = old.id;
-- 3. Criar uma VIEW onde vamos puxar somente os dados que estão ativos
CREATE VIEW products_without_deleted AS
SELECT * FROM products WHERE deleted_at IS NULL;
-- 4. Renomear a VIEW e a TABLE
ALTER TABLE products RENAME TO products_with_deleted;
ALTER VIEW products_without_deleted RENAME TO products;