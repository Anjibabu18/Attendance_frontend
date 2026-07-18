package com.attendance.api.dto;

public class CompanyDtos {
  public static class CompanyProfileResponse {
    private String groupPhotoUrl;

    public CompanyProfileResponse(String groupPhotoUrl) {
      this.groupPhotoUrl = groupPhotoUrl;
    }

    public String getGroupPhotoUrl() {
      return groupPhotoUrl;
    }
  }
}

