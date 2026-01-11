from rest_framework import serializers


class OnyxNoteSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, allow_blank=False)
    title = serializers.CharField(required=True, allow_blank=False)
    content = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    createdAt = serializers.DateTimeField(required=False, allow_null=True)
    updatedAt = serializers.DateTimeField(required=False, allow_null=True)


# Kept for compatibility; not used in Onyx-backed operations.
class NoteSerializer(OnyxNoteSerializer):
    pass
