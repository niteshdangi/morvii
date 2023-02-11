package com.morvii;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

import com.facebook.react.ReactActivity;
import com.morvii.nativecomponents.RNTDeepAR;

public class MorviiCamera extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "deeparRNExample";
    }

    private RNTDeepAR deepArView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (this.deepArView != null) {
            this.deepArView.onStart();
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (this.deepArView != null) {
            this.deepArView.onStop();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        this.deepArView = null;
    }

    public void setDeepArView(RNTDeepAR view) {
        this.deepArView = view;
    }
}
