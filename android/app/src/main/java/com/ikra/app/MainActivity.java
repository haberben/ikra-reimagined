package com.ikra.app;

import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String PREFS_NAME = "ikra_app_prefs";
    private static final String KEY_VERSION_CODE = "last_version_code";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Check version and clear cache BEFORE calling super.onCreate()
        // so Capacitor loads fresh assets after an update
        clearCacheOnUpdate();
        super.onCreate(savedInstanceState);
    }

    private void clearCacheOnUpdate() {
        try {
            PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            int currentVersionCode = pInfo.versionCode;

            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            int lastVersionCode = prefs.getInt(KEY_VERSION_CODE, -1);

            if (lastVersionCode != -1 && lastVersionCode != currentVersionCode) {
                // App was updated — clear WebView cache to prevent white screen
                WebView webView = new WebView(this);
                webView.clearCache(true);

                // Also delete Capacitor's cached web assets
                deleteDir(getCacheDir());
                deleteDir(getFilesDir());
            }

            // Always save current version
            prefs.edit().putInt(KEY_VERSION_CODE, currentVersionCode).apply();

        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
    }

    private void deleteDir(java.io.File dir) {
        if (dir != null && dir.isDirectory()) {
            String[] children = dir.list();
            if (children != null) {
                for (String child : children) {
                    deleteDir(new java.io.File(dir, child));
                }
            }
        }
        if (dir != null) dir.delete();
    }
}

