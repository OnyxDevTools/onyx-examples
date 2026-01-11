import datetime
from typing import Any, Optional

class Note:
    """Generated model (plain Python class). Resolver/extra fields are allowed via **extra."""
    def __init__(self, id: str = None, title: str = None, content: str = None, createdAt: datetime.datetime = None, updatedAt: datetime.datetime = None, **extra: Any):
        self.id = id
        self.title = title
        self.content = content
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        # allow resolver-attached fields or extra properties
        for k, v in extra.items():
            setattr(self, k, v)

