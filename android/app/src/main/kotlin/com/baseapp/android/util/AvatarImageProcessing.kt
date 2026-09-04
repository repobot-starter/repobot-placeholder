package com.baseapp.android.util

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Prepares a picked photo for the avatar upload: downscales to a sensible
 * avatar resolution and JPEG-compresses, so a 20 MB camera photo never rides
 * through the upload path at full size (the storage kernel caps uploads at
 * 20 MB, and avatars render at ~44 dp). Mirrors the iOS AvatarImageProcessing
 * (1024 px long edge, 0.8 JPEG quality).
 */
object AvatarImageProcessing {
    const val MAX_DIMENSION = 1024
    const val JPEG_QUALITY = 80
    const val CONTENT_TYPE = "image/jpeg"

    /**
     * The downscaled pixel size: fits within maxDimension on the long edge,
     * preserving aspect ratio; images already small enough pass through.
     */
    fun targetSize(width: Int, height: Int, maxDimension: Int = MAX_DIMENSION): Pair<Int, Int> {
        val longEdge = max(width, height)
        if (longEdge <= maxDimension || longEdge <= 0) {
            return width to height
        }
        val scale = maxDimension.toDouble() / longEdge
        return (width * scale).roundToInt() to (height * scale).roundToInt()
    }

    /**
     * Downscaled, JPEG-compressed bytes for the upload; null when the data is
     * not a decodable image.
     */
    fun jpegBytes(imageData: ByteArray): ByteArray? {
        val bitmap = BitmapFactory.decodeByteArray(imageData, 0, imageData.size) ?: return null
        val (targetWidth, targetHeight) = targetSize(bitmap.width, bitmap.height)
        val scaled = if (targetWidth == bitmap.width && targetHeight == bitmap.height) {
            bitmap
        } else {
            Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
        }
        val output = ByteArrayOutputStream()
        val compressed = scaled.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, output)
        return if (compressed) output.toByteArray() else null
    }
}
