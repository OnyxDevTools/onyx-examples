from uuid import uuid4

from rest_framework import status, viewsets
from rest_framework.response import Response
from onyx_database import OnyxConfigError, OnyxHTTPError, onyx as onyx_facade

from .serializers import OnyxNoteSerializer
from django.conf import settings
from onyx import SCHEMA, Note as OnyxNote


class NoteViewSet(viewsets.ModelViewSet):
    queryset = []
    serializer_class = OnyxNoteSerializer

    def get_queryset(self):
        return []

    def _client(self):
        cfg = getattr(settings, "ONYX_DATABASE", {}) or {}
        cfg = {k: v for k, v in cfg.items() if v not in (None, "")}
        cfg["model_map"] = SCHEMA
        return onyx_facade.init(**cfg)

    def _table(self) -> str:
        return getattr(settings, "ONYX_NOTES_TABLE", "Note")

    def _normalize_note(self, note):
        if isinstance(note, dict):
            data = note
        else:
            data = {
                "id": getattr(note, "id", None),
                "title": getattr(note, "title", None),
                "content": getattr(note, "content", None),
                "createdAt": getattr(note, "createdAt", None),
                "updatedAt": getattr(note, "updatedAt", None),
            }
        return {k: v for k, v in data.items() if v is not None}

    def list(self, request, *args, **kwargs):
        try:
            limit = int(request.query_params.get("limit", 50))
        except ValueError:
            return Response({"detail": "limit must be an integer"}, status=status.HTTP_400_BAD_REQUEST)
        limit = max(1, min(limit, 200))
        page_token = request.query_params.get("page")

        try:
            client = self._client()
            query = client.from_table(self._table()).limit(limit)
            page = query.page(page_size=limit, next_page=page_token, model=OnyxNote)
        except (OnyxConfigError, OnyxHTTPError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        records = [self._normalize_note(n) for n in page.get("records", [])]
        next_token = page.get("nextPage") or page.get("next_page")
        serializer = OnyxNoteSerializer(records, many=True)
        return Response({"results": serializer.data, "nextPage": next_token})

    def retrieve(self, request, *args, **kwargs):
        note_id = kwargs.get("pk")
        try:
            client = self._client()
            note = client.find_by_id(self._table(), note_id)
        except (OnyxConfigError, OnyxHTTPError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        if not note:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        data = self._normalize_note(note)
        serializer = OnyxNoteSerializer(data)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = OnyxNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        payload.setdefault("id", str(uuid4()))

        try:
            client = self._client()
            saved = client.save(self._table(), payload)
        except (OnyxConfigError, OnyxHTTPError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        data = self._normalize_note(saved or payload)
        return Response(OnyxNoteSerializer(data).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        return self._save_with_merge(request, partial=False, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self._save_with_merge(request, partial=True, **kwargs)

    def _save_with_merge(self, request, partial: bool, **kwargs):
        note_id = kwargs.get("pk")
        try:
            client = self._client()
            existing = client.find_by_id(self._table(), note_id)
            if not existing:
                return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            base = self._normalize_note(existing)
            incoming = request.data or {}
            if not partial:
                serializer = OnyxNoteSerializer(data=incoming)
            else:
                serializer = OnyxNoteSerializer(data=incoming, partial=True)
            serializer.is_valid(raise_exception=True)
            merged = {**base, **serializer.validated_data, "id": note_id}
            saved = client.save(self._table(), merged)
        except (OnyxConfigError, OnyxHTTPError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        data = self._normalize_note(saved or merged)
        return Response(OnyxNoteSerializer(data).data)

    def destroy(self, request, *args, **kwargs):
        note_id = kwargs.get("pk")
        try:
            client = self._client()
            client.delete(self._table(), note_id)
        except (OnyxConfigError, OnyxHTTPError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(status=status.HTTP_204_NO_CONTENT)
