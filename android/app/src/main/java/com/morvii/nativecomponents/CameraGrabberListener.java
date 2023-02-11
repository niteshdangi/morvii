package com.morvii.nativecomponents;

public interface CameraGrabberListener {
    void onCameraInitialized();

    void onCameraError(String errorMsg);
}
