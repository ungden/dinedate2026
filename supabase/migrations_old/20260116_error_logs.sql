-- Error Logs Table for DineDate Error Tracking System
-- Simple Sentry-like error tracking

-- Create the error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Error information
    error_type VARCHAR(255) NOT NULL DEFAULT 'Error',
    message TEXT NOT NULL,
    stack_trace TEXT,

    -- Context information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    url VARCHAR(500),
    user_agent VARCHAR(500),

    -- Additional data
    metadata JSONB DEFAULT '{}',

    -- Severity level
    severity VARCHAR(20) NOT NULL DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'info')),

    -- Resolution tracking
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_is_resolved ON error_logs(is_resolved);
CREATE INDEX idx_error_logs_session_id ON error_logs(session_id);

-- Composite index for common admin queries
CREATE INDEX idx_error_logs_severity_created ON error_logs(severity, created_at DESC);
CREATE INDEX idx_error_logs_unresolved ON error_logs(is_resolved, created_at DESC) WHERE is_resolved = FALSE;

-- Enable Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert error logs (including unauthenticated users)
CREATE POLICY "Anyone can insert error logs"
    ON error_logs
    FOR INSERT
    WITH CHECK (true);

-- Policy: Only admins can view error logs
CREATE POLICY "Admins can view all error logs"
    ON error_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Policy: Only admins can update error logs (for resolution)
CREATE POLICY "Admins can update error logs"
    ON error_logs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Policy: Only admins can delete error logs
CREATE POLICY "Admins can delete error logs"
    ON error_logs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Create a view for error statistics
CREATE OR REPLACE VIEW error_stats AS
SELECT
    error_type,
    severity,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE NOT is_resolved) as unresolved_count,
    MAX(created_at) as last_occurrence,
    MIN(created_at) as first_occurrence
FROM error_logs
GROUP BY error_type, severity
ORDER BY count DESC;

-- Create a function to clean up old resolved errors (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM error_logs
    WHERE is_resolved = TRUE
    AND resolved_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE error_logs IS 'Error tracking table for DineDate - stores application errors, warnings, and info messages';
COMMENT ON COLUMN error_logs.error_type IS 'Type/name of the error (e.g., TypeError, NetworkError)';
COMMENT ON COLUMN error_logs.metadata IS 'Additional context data including breadcrumbs and user context';
COMMENT ON COLUMN error_logs.severity IS 'Error severity: error, warning, or info';
