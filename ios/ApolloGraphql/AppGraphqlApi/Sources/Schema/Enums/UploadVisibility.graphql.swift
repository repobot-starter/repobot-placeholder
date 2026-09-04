// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public enum UploadVisibility: String, EnumType {
  /// Anyone with the file URL can read it (stable /file/<id> serving URL).
  case `public` = "PUBLIC"
  /// Only the owner can mint a short-lived download URL.
  case `private` = "PRIVATE"
}
