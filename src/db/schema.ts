import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const projectStatusEnum = pgEnum("project_status", [
  "pipeline",
  "planned",
  "active",
  "on_hold",
  "complete",
]);

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
  location: text("location"),
  /** Hours that constitute 1 FTE for this person (e.g. 37.5 UK, 40 US) */
  fteHoursPerWeek: numeric("fte_hours_per_week", { precision: 5, scale: 2 })
    .notNull()
    .default("37.5"),
  /** Default contracted FTE (1.0 = full time) */
  defaultFte: numeric("default_fte", { precision: 4, scale: 2 })
    .notNull()
    .default("1.0"),
  isActive: integer("is_active").notNull().default(1),
  /** Contractor or non-Arithmos staff */
  isExternal: integer("is_external").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  client: text("client"),
  zohoUrl: text("zoho_url"),
  status: projectStatusEnum("status").notNull().default("planned"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  totalHoursBudgeted: numeric("total_hours_budgeted", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Weekly FTE allocation — weekStart should be the Monday of the week */
export const allocations = pgTable(
  "allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    fteAllocated: numeric("fte_allocated", { precision: 4, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("allocations_resource_project_week_idx").on(
      table.resourceId,
      table.projectId,
      table.weekStart,
    ),
  ],
);

export const outOfOffice = pgTable("out_of_office", {
  id: uuid("id").defaultRandom().primaryKey(),
  resourceId: uuid("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  role: one(roles, {
    fields: [resources.roleId],
    references: [roles.id],
  }),
  allocations: many(allocations),
  outOfOffice: many(outOfOffice),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  allocations: many(allocations),
}));

export const allocationsRelations = relations(allocations, ({ one }) => ({
  resource: one(resources, {
    fields: [allocations.resourceId],
    references: [resources.id],
  }),
  project: one(projects, {
    fields: [allocations.projectId],
    references: [projects.id],
  }),
}));

export const outOfOfficeRelations = relations(outOfOffice, ({ one }) => ({
  resource: one(resources, {
    fields: [outOfOffice.resourceId],
    references: [resources.id],
  }),
}));
