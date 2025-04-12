import { users, type User, type InsertUser, sessions, type Session, type InsertSession, biometricData, type BiometricData, type InsertBiometricData } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session methods
  getSession(sessionId: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(sessionId: string, data: Partial<InsertSession>): Promise<Session | undefined>;
  getActiveSessions(): Promise<Session[]>;
  
  // Biometric data methods
  storeBiometricData(data: InsertBiometricData): Promise<BiometricData>;
  getBiometricData(sessionId: string): Promise<BiometricData[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Session methods
  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId));
    return session || undefined;
  }
  
  async createSession(session: InsertSession): Promise<Session> {
    const [createdSession] = await db
      .insert(sessions)
      .values(session)
      .returning();
    return createdSession;
  }
  
  async updateSession(sessionId: string, data: Partial<InsertSession>): Promise<Session | undefined> {
    const [updatedSession] = await db
      .update(sessions)
      .set(data)
      .where(eq(sessions.sessionId, sessionId))
      .returning();
    return updatedSession || undefined;
  }
  
  async getActiveSessions(): Promise<Session[]> {
    return await db
      .select()
      .from(sessions)
      .where(eq(sessions.isActive, true));
  }
  
  // Biometric data methods
  async storeBiometricData(data: InsertBiometricData): Promise<BiometricData> {
    const [storedData] = await db
      .insert(biometricData)
      .values(data)
      .returning();
    return storedData;
  }
  
  async getBiometricData(sessionId: string): Promise<BiometricData[]> {
    return await db
      .select()
      .from(biometricData)
      .where(eq(biometricData.sessionId, sessionId));
  }
}

export const storage = new DatabaseStorage();
