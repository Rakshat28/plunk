/**
 * Import and bulk operation queue job data types
 */

/**
 * Job data for importing contacts from CSV
 * Used by: importQueue worker
 */
export interface ContactImportJobData {
  projectId: string;
  csvData: string; // Base64 encoded CSV content
  filename: string;
}

/**
 * Job data for bulk contact actions (subscribe, unsubscribe, delete)
 * Used by: bulkContactQueue worker
 */
export interface BulkContactActionJobData {
  projectId: string;
  contactIds: string[];
  operation: 'subscribe' | 'unsubscribe' | 'delete';
}
