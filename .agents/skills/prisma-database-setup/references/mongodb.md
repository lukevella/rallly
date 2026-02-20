# MongoDB Setup

**⚠️ WARNING: MongoDB is NOT supported in Prisma ORM v7.**

Support for MongoDB is planned for a future v7 release. If you need MongoDB, you must use **Prisma ORM v6**.

## Prerequisites

- MongoDB 4.2+
- Replica Set configured (required for transactions)
- **Prisma ORM v6.x**

## 1. Schema Configuration (v6)

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### ID Field Requirement

MongoDB models **must** have a mapped `_id` field using `@id` and `@map("_id")`, usually of type `String` with `auto()` and `db.ObjectId`.

```prisma
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String @unique
  name  String?
}
```

### Relations

Relations in MongoDB expect IDs to be `db.ObjectId` type.

```prisma
model Post {
  id       String @id @default(auto()) @map("_id") @db.ObjectId
  author   User   @relation(fields: [authorId], references: [id])
  authorId String @db.ObjectId
}
```

## 2. Environment Variable

In `.env`:

```env
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority"
```

## Migrations vs Introspection

- **No Migrations**: MongoDB is schema-less. `prisma migrate` commands **do not work**.
- **db push**: Use `prisma db push` to sync indexes and constraints.
- **db pull**: Use `prisma db pull` to generate schema from existing data (sampling).

## Common Issues

### "Transactions not supported"
Ensure your MongoDB instance is a **Replica Set**. Standalone instances do not support transactions. Atlas clusters are replica sets by default.

### "Invalid ObjectID"
Ensure fields referencing IDs are decorated with `@db.ObjectId` if the target is an ObjectID.
