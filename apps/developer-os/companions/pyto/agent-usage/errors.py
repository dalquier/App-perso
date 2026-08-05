"""Typed errors for DeveloperOS Agent Usage."""


class AgentUsageError(Exception):
    """Base error for the local Agent Usage core."""


class ValidationError(AgentUsageError):
    """Raised when a record does not satisfy the data contract."""


class StorageError(AgentUsageError):
    """Raised when local storage cannot safely read or write data."""
