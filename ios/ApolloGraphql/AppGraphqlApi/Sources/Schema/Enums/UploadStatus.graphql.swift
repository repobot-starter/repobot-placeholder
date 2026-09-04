// @generated
// This file was automatically generated and should not be edited.

import ApolloAPI

public enum UploadStatus: String, EnumType {
  /// The slot exists; bytes have not been verified yet.
  case pending = "PENDING"
  /// Bytes are verified and the file is servable.
  case ready = "READY"
}
