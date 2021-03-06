#!/usr/bin/env bash

set -xeu
set -o pipefail

function finish() {
  ditto -c -k --sequesterRsrc --keepParent "${RESULT_BUNDLE_PATH}" "${RESULT_BUNDLE_PATH}.zip"
  rm -rf "${RESULT_BUNDLE_PATH}"
}

trap finish EXIT

SDK="${SDK:-iphoneos}"
WORKSPACE="${WORKSPACE:-App.xcworkspace}"
SCHEME="${SCHEME:-App}"
CONFIGURATION=${CONFIGURATION:-Release}

BUILD_DIR=${BUILD_DIR:-.build}
ARTIFACT_PATH=${RESULT_PATH:-${BUILD_DIR}/Artifacts}
RESULT_BUNDLE_PATH="${ARTIFACT_PATH}/${SCHEME}.xcresult"
ARCHIVE_PATH=${ARCHIVE_PATH:-${BUILD_DIR}/Archives/${SCHEME}.xcarchive}
DERIVED_DATA_PATH=${DERIVED_DATA_PATH:-${BUILD_DIR}/DerivedData}
CURRENT_PROJECT_VERSION=${BUILD_NUMBER:-0}
EXPORT_OPTIONS_FILE="Support/ExportOptions.plist"

echo "Build Version:"
echo $CURRENT_PROJECT_VERSION

rm -rf .build

# TODO: sed out the version number ./ios/App/App.xcodeprod/project.pbxproj

xcrun xcodebuild \
    -workspace "${WORKSPACE}" \
    -scheme "${SCHEME}" \
    -configuration "${CONFIGURATION}" \
    -sdk "${SDK}" \
    -parallelizeTargets \
    -showBuildTimingSummary \
    -disableAutomaticPackageResolution \
    -derivedDataPath "${DERIVED_DATA_PATH}" \
    -archivePath "${ARCHIVE_PATH}" \
    -resultBundlePath "${RESULT_BUNDLE_PATH}" \
    CURRENT_PROJECT_VERSION="${CURRENT_PROJECT_VERSION}" \
    archive
