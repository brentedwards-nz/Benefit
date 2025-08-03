// utils/ai/tools/databaseTool.ts
import { DynamicTool } from "@langchain/core/tools";
import { Pool } from "pg";

// Supabase PostgreSQL connection details
const dbConfig = {
  user: process.env.SUPABASE_DB_USER,
  host: process.env.SUPABASE_DB_HOST,
  database: process.env.SUPABASE_DB_NAME,
  password: process.env.SUPABASE_DB_PASSWORD,
  port: parseInt(process.env.SUPABASE_DB_PORT || "5432", 10),
};

const pool = new Pool(dbConfig);

// Function to safely execute a SQL query
async function executeSql(
  sqlQuery: string,
  params: any[] = []
): Promise<any[]> {
  const client = await pool.connect();
  try {
    // Basic validation to prevent certain harmful operations
    const lowerCaseQuery = sqlQuery.toLowerCase().trim();
    if (
      lowerCaseQuery.startsWith("delete") ||
      lowerCaseQuery.startsWith("update") ||
      lowerCaseQuery.startsWith("insert") ||
      lowerCaseQuery.startsWith("drop") ||
      lowerCaseQuery.startsWith("truncate") ||
      lowerCaseQuery.includes(";") // Prevent multiple statements
    ) {
      throw new Error("Only SELECT queries are allowed through this tool.");
    }

    const result = await client.query(sqlQuery, params);
    return result.rows;
  } catch (error: any) {
    console.error("Database query error:", error);
    throw new Error(`Failed to execute database query: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Tool for querying the Supabase PostgreSQL database.
 * The AI can use this tool to retrieve information from the database.
 *
 * IMPORTANT: You must provide the schema information to the AI via the prompt.
 * For example, "The database has a table named 'products' with columns: id (INT), name (TEXT), price (NUMERIC), description (TEXT)."
 *
 * This tool is designed for SELECT queries only to minimize risks.
 */
export const queryDatabaseTool = new DynamicTool({
  name: "queryDatabase",
  description: `Useful for retrieving data from the Supabase PostgreSQL database.
  Input should be a single, valid SQL SELECT query.
  Example usage: 'SELECT * FROM users WHERE age > 30;'
  DO NOT include any UPDATE, INSERT, DELETE, DROP, or TRUNCATE statements.
  DO NOT use semicolons in the input.
  `,
  func: async (input: string) => {
    try {
      const results = await executeSql(input);
      // Format results nicely for the AI
      if (results.length === 0) {
        return "No results found for the query.";
      }
      return JSON.stringify(results, null, 2);
    } catch (error: any) {
      return `Error executing database query: ${error.message}`;
    }
  },
});

// Example of a more specific database tool (safer than a generic query tool)
// This tool would be called when the AI needs to specifically get user info by ID.
// This reduces the chance of the AI generating arbitrary or harmful SQL.
export const getUserInfoTool = new DynamicTool({
  name: "getUserInfo",
  description: `Useful for getting information about a user by their user ID.
  Input should be a single integer representing the user's ID.
  Example usage: '123'
  `,
  func: async (userId: string) => {
    try {
      const id = parseInt(userId, 10);
      if (isNaN(id)) {
        throw new Error("Invalid user ID. Must be an integer.");
      }
      const query = `SELECT id, name, email FROM users WHERE id = $1;`;
      const results = await executeSql(query, [id]);
      if (results.length === 0) {
        return `No user found with ID: ${userId}`;
      }
      return JSON.stringify(results[0], null, 2);
    } catch (error: any) {
      return `Error fetching user info: ${error.message}`;
    }
  },
});
