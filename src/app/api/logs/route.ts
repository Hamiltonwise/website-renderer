import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Log file paths mapping
const LOG_FILES: Record<string, string> = {
  'website-scrape': path.join(process.cwd(), 'logs/website-scrape.log'),
};

// Valid log types
const VALID_LOG_TYPES = Object.keys(LOG_FILES);

/**
 * GET /api/logs
 *
 * Returns the latest lines from the specified log file
 *
 * Query params:
 *   - type: Log file type (website-scrape). Default: website-scrape
 *   - lines: Maximum number of lines to return (default: 500)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logType = searchParams.get('type') || 'website-scrape';
    const maxLines = parseInt(searchParams.get('lines') || '500', 10);

    // Validate log type
    if (!VALID_LOG_TYPES.includes(logType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_LOG_TYPE',
          message: `Invalid log type. Valid types: ${VALID_LOG_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const logFilePath = LOG_FILES[logType];

    // Check if log file exists
    if (!fs.existsSync(logFilePath)) {
      return NextResponse.json({
        success: true,
        data: {
          logs: [],
          total_lines: 0,
          timestamp: new Date().toISOString(),
          log_type: logType,
        },
        message: 'Log file does not exist yet',
      });
    }

    // Read the log file
    const content = fs.readFileSync(logFilePath, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim() !== '');

    // Get the latest lines (last N lines)
    const latestLines = allLines.slice(-maxLines);

    return NextResponse.json({
      success: true,
      data: {
        logs: latestLines,
        total_lines: allLines.length,
        timestamp: new Date().toISOString(),
        log_type: logType,
      },
    });
  } catch (error) {
    console.error('[Logs API] Error reading log file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'READ_ERROR',
        message: error instanceof Error ? error.message : 'Failed to read log file',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/logs
 *
 * Clears the specified log file
 *
 * Query params:
 *   - type: Log file type (website-scrape). Default: website-scrape
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logType = searchParams.get('type') || 'website-scrape';

    // Validate log type
    if (!VALID_LOG_TYPES.includes(logType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_LOG_TYPE',
          message: `Invalid log type. Valid types: ${VALID_LOG_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const logFilePath = LOG_FILES[logType];

    // Check if log file exists
    if (!fs.existsSync(logFilePath)) {
      return NextResponse.json({
        success: true,
        message: 'Log file does not exist',
      });
    }

    // Clear the log file by writing an empty string
    fs.writeFileSync(logFilePath, '');

    console.log(`[Logs API] ${logType} log file cleared successfully`);

    return NextResponse.json({
      success: true,
      message: `${logType} log file cleared successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Logs API] Error clearing log file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'CLEAR_ERROR',
        message: error instanceof Error ? error.message : 'Failed to clear log file',
      },
      { status: 500 }
    );
  }
}
