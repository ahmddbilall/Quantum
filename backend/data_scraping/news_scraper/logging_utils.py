"""
Logging configuration and utilities.
"""
import logging
import logging.handlers
import os
from datetime import datetime
from typing import Dict, Any

from .config import LOGGING_CONFIG

def setup_logging():
    """Setup logging configuration."""
    # Create logs directory if it doesn't exist
    log_dir = os.path.dirname(LOGGING_CONFIG['handlers']['file']['filename'])
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(LOGGING_CONFIG['level'])
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Create formatter
    formatter = logging.Formatter(LOGGING_CONFIG['format'])
    
    # Console handler
    if LOGGING_CONFIG['handlers']['console']['enabled']:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # File handler with rotation
    file_config = LOGGING_CONFIG['handlers']['file']
    file_handler = logging.handlers.RotatingFileHandler(
        filename=file_config['filename'],
        maxBytes=file_config['max_bytes'],
        backupCount=file_config['backup_count'],
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    # Set specific logger levels
    logging.getLogger('aiohttp').setLevel(logging.WARNING)
    logging.getLogger('asyncio').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    
    logging.info("Logging system initialized")

class PerformanceLogger:
    """Logger for performance metrics and statistics."""
    
    def __init__(self):
        self.logger = logging.getLogger('performance')
        self.start_times = {}
    
    def start_timer(self, operation: str):
        """Start timing an operation."""
        self.start_times[operation] = datetime.now()
    
    def end_timer(self, operation: str, metadata: Dict[str, Any] = None):
        """End timing an operation and log the result."""
        if operation not in self.start_times:
            self.logger.warning(f"No start time found for operation: {operation}")
            return
        
        duration = (datetime.now() - self.start_times[operation]).total_seconds()
        del self.start_times[operation]
        
        log_data = {
            'operation': operation,
            'duration_seconds': round(duration, 3),
            'timestamp': datetime.now().isoformat()
        }
        
        if metadata:
            log_data.update(metadata)
        
        self.logger.info(f"Performance: {log_data}")
        return duration

# Global performance logger
perf_logger = PerformanceLogger()

class ErrorTracker:
    """Track and log errors with context."""
    
    def __init__(self):
        self.logger = logging.getLogger('errors')
        self.error_counts = {}
    
    def log_error(self, error: Exception, context: Dict[str, Any] = None):
        """Log an error with context."""
        error_type = type(error).__name__
        error_message = str(error)
        
        # Track error counts
        if error_type not in self.error_counts:
            self.error_counts[error_type] = 0
        self.error_counts[error_type] += 1
        
        log_data = {
            'error_type': error_type,
            'error_message': error_message,
            'error_count': self.error_counts[error_type],
            'timestamp': datetime.now().isoformat()
        }
        
        if context:
            log_data['context'] = context
        
        self.logger.error(f"Error tracked: {log_data}")
    
    def get_error_stats(self) -> Dict[str, int]:
        """Get error statistics."""
        return self.error_counts.copy()
    
    def reset_error_counts(self):
        """Reset error counters."""
        self.error_counts.clear()

# Global error tracker
error_tracker = ErrorTracker()

class ScrapingMetrics:
    """Track scraping metrics and statistics."""
    
    def __init__(self):
        self.logger = logging.getLogger('metrics')
        self.session_metrics = {}
    
    def start_session(self, source: str):
        """Start a scraping session."""
        self.session_metrics[source] = {
            'start_time': datetime.now(),
            'articles_scraped': 0,
            'articles_failed': 0,
            'urls_processed': 0,
            'errors': []
        }
    
    def update_session(self, source: str, scraped: int = 0, failed: int = 0, urls: int = 0):
        """Update session metrics."""
        if source not in self.session_metrics:
            self.start_session(source)
        
        metrics = self.session_metrics[source]
        metrics['articles_scraped'] += scraped
        metrics['articles_failed'] += failed
        metrics['urls_processed'] += urls
    
    def add_session_error(self, source: str, error: str):
        """Add an error to the session."""
        if source not in self.session_metrics:
            self.start_session(source)
        
        self.session_metrics[source]['errors'].append({
            'error': error,
            'timestamp': datetime.now().isoformat()
        })
    
    def end_session(self, source: str):
        """End a scraping session and log metrics."""
        if source not in self.session_metrics:
            self.logger.warning(f"No session found for source: {source}")
            return
        
        metrics = self.session_metrics[source]
        duration = (datetime.now() - metrics['start_time']).total_seconds()
        
        summary = {
            'source': source,
            'duration_seconds': round(duration, 3),
            'articles_scraped': metrics['articles_scraped'],
            'articles_failed': metrics['articles_failed'],
            'urls_processed': metrics['urls_processed'],
            'success_rate': (
                metrics['articles_scraped'] / max(1, metrics['urls_processed'])
                if metrics['urls_processed'] > 0 else 0
            ),
            'error_count': len(metrics['errors']),
            'timestamp': datetime.now().isoformat()
        }
        
        self.logger.info(f"Session completed: {summary}")
        
        # Clean up session data
        del self.session_metrics[source]
        
        return summary
    
    def get_active_sessions(self) -> Dict[str, Dict]:
        """Get currently active sessions."""
        return self.session_metrics.copy()

# Global metrics tracker
metrics_tracker = ScrapingMetrics()
