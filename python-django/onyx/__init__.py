from .models import Note
from .tables import tables
from .schema import SCHEMA_JSON
SCHEMA = {"Note": Note}
__all__ = ['tables', 'SCHEMA_JSON', 'SCHEMA', 'Note']
