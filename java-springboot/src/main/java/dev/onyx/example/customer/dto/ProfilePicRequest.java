package dev.onyx.example.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public class ProfilePicRequest {

    @NotBlank(message = "url is required when profilePic is provided")
    private String url;

    private String contentType;

    @PositiveOrZero(message = "sizeBytes must be zero or positive")
    private Long sizeBytes;

    public ProfilePicRequest() {
    }

    public ProfilePicRequest(String url, String contentType, Long sizeBytes) {
        this.url = url;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }
}
