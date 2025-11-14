#include <jni.h>

// Minimal OnLoad.cpp for React Native
// Actual native modules will be added later

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved) {
  return JNI_VERSION_1_6;
}
