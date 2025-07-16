import { supabaseAdmin } from '../context/supabase-auth';
import { GraphQLError } from 'graphql';
import type { PostgrestError } from '@supabase/supabase-js';

export class BaseSupabaseRepository<
  Row extends { id: string },
  Insert extends object,
  Update extends object,
> {
  protected readonly supabase = supabaseAdmin;
  protected readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected handleError(error: PostgrestError, context?: string): never {
    const errorMessage = context
      ? `Database error in ${context}: ${error.message}`
      : `Database error: ${error.message}`;
    console.error(errorMessage, error);
    throw new GraphQLError(errorMessage, {
      extensions: { code: 'DATABASE_ERROR', details: error.details },
    });
  }

  // These can be overridden by subclasses to add validation
  protected async validateInsert(data: Insert): Promise<void> {}
  protected async validateUpdate(data: Update): Promise<void> {}

  async create(insertData: Insert): Promise<Row> {
    await this.validateInsert(insertData);
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      this.handleError(error, `creating a record in ${this.tableName}`);
    }

    return data as Row;
  }

  async getById(id: string): Promise<Row | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.handleError(error, `fetching a record from ${this.tableName} by id`);
    }

    return data as Row;
  }

  async update(id: string, updates: Update): Promise<Row> {
    await this.validateUpdate(updates);
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, `updating a record in ${this.tableName}`);
    }

    return data as Row;
  }

  async delete(id: string): Promise<{ success: boolean; count: number | null }> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      this.handleError(error, `deleting a record from ${this.tableName}`);
    }

    return { success: !error, count };
  }
} 