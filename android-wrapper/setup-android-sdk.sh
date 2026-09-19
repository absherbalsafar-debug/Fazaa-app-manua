#!/usr/bin/env bash
set -euo pipefail
SDK_ROOT=/home/ubuntu/android-sdk
TOOLS_ZIP=/tmp/android-commandline-tools.zip
mkdir -p "$SDK_ROOT/cmdline-tools"
if [ ! -x "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
  curl -fL --retry 3 -o "$TOOLS_ZIP" https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip
  rm -rf "$SDK_ROOT/cmdline-tools/latest" "$SDK_ROOT/cmdline-tools/cmdline-tools"
  unzip -q "$TOOLS_ZIP" -d "$SDK_ROOT/cmdline-tools"
  mv "$SDK_ROOT/cmdline-tools/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
fi
export ANDROID_HOME="$SDK_ROOT"
export ANDROID_SDK_ROOT="$SDK_ROOT"
export PATH="$SDK_ROOT/cmdline-tools/latest/bin:$SDK_ROOT/platform-tools:$PATH"
 yes | sdkmanager --licenses >/tmp/fazaa-android-licenses.log || true
 sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
 echo "ANDROID_HOME=$ANDROID_HOME"
 sdkmanager --list_installed
