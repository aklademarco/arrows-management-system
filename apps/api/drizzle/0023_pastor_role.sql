INSERT INTO "roles" ("name", "description")
VALUES ('PASTOR', 'Church-wide pastoral care and leadership')
ON CONFLICT ("name") DO NOTHING;
