package com.voice_relay_temp

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import java.util.ArrayList

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost by lazy {
    object : ReactNativeHost(this) {
      override fun getPackages(): ArrayList<ReactPackage> {
        return ArrayList()  // No packages for now
      }

      override fun getUseDeveloperSupport(): Boolean {
        return true  // Enable developer menu for debugging
      }

      override fun getJSMainModuleName(): String {
        return "index"
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
  }
}
