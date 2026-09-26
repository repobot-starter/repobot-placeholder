// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public enum PushDevicePlatform: String, EnumType {
  /// A browser, via Web Push (the only channel with a live transport today).
  case web = "WEB"
  /// An iPhone/iPad via APNs. Registration rails exist; the transport is the C1b follow-up.
  case ios = "IOS"
  /// An Android device via FCM. Registration rails exist; the transport is the C1b follow-up.
  case android = "ANDROID"
}
