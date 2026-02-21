import {timestamp, pgTable, text, integer} from "drizzle-orm/pg-core"

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  password: text("password"),
  image: text("image"),
})

export const doorInstances = pgTable("door_instance", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

// Tabulka pro audit logy (každý klik na +/- se zde zapíše pro budoucí statistiky)
export const auditLogs = pgTable("audit_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  instanceId: text("instanceId")
    .notNull()
    .references(() => doorInstances.id, { onDelete: "cascade" }),
  // Typ stavu: 
  // 1 = Zavřeno -> Zavřeno
  // 2 = Zavřeno -> Otevřeno
  // 3 = Otevřeno -> Zavřeno
  // 4 = Otevřeno -> Otevřeno
  stateType: integer("stateType").notNull(), 
  action: text("action").notNull(), // Očekávané hodnoty: 'increment' nebo 'decrement'
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});