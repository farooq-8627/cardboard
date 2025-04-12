import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// WebRTC sessions
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  createdAt: integer("created_at").notNull(),
  connectionType: text("connection_type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  metrics: jsonb("metrics"),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  sessionId: true,
  createdAt: true, 
  connectionType: true,
  isActive: true,
  metrics: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Biometric data for storing analytics
export const biometricData = pgTable("biometric_data", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  timestamp: integer("timestamp").notNull(),
  attentionScore: integer("attention_score"),
  heartRate: integer("heart_rate"),
  emotion: text("emotion"),
  emotionConfidence: integer("emotion_confidence"),
  eyeTrackingData: jsonb("eye_tracking_data"),
});

export const insertBiometricDataSchema = createInsertSchema(biometricData).pick({
  sessionId: true,
  timestamp: true,
  attentionScore: true,
  heartRate: true,
  emotion: true,
  emotionConfidence: true,
  eyeTrackingData: true,
});

export type InsertBiometricData = z.infer<typeof insertBiometricDataSchema>;
export type BiometricData = typeof biometricData.$inferSelect;
