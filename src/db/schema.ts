import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  sex: varchar("sex", { length: 16 }).notNull(),
  phone: text("phone"),
  teethCount: integer("teeth_count").notNull(),
  smoking: varchar("smoking", { length: 16 }).notNull().default("none"),
  chiefComplaint: text("chief_complaint"),
  inclusion: jsonb("inclusion").$type<Record<string, boolean>>().notNull(),
  exclusion: jsonb("exclusion").$type<Record<string, boolean>>().notNull(),
  eligible: boolean("eligible").notNull().default(false),
  consentSigned: boolean("consent_signed").notNull().default(false),
  consentSignature: text("consent_signature"),
  examiner: text("examiner"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  clinical: jsonb("clinical").notNull(),
  photo: text("photo"),
  radiograph: text("radiograph"),
  imageFeatures: jsonb("image_features"),
  result: jsonb("result").notNull(),
  aiCategory: varchar("ai_category", { length: 32 }).notNull(),
  aiStage: varchar("ai_stage", { length: 16 }),
  clinicianCategory: varchar("clinician_category", { length: 32 }),
  clinicianStage: varchar("clinician_stage", { length: 16 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Patient = typeof patients.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
