"""config URL routing."""
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("api/", include("api.urls")),
    path(
        "",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="openapi-playground",
    ),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
]
