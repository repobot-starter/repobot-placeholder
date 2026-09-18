package com.baseapp.android

import com.baseapp.android.util.AvatarImageProcessing
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Pure-geometry tests for the avatar downscale (the bitmap decode/compress
 * half needs the Android framework and is exercised on-device). Mirrors the
 * iOS AvatarImageProcessing targetSize coverage: ≤1024 px long edge,
 * aspect ratio preserved.
 */
class AvatarImageProcessingTest {
    @Test
    fun smallImagesPassThroughUnscaled() {
        assertEquals(800 to 600, AvatarImageProcessing.targetSize(800, 600))
        assertEquals(1024 to 512, AvatarImageProcessing.targetSize(1024, 512))
    }

    @Test
    fun largeImagesDownscaleToTheMaxLongEdgePreservingAspectRatio() {
        assertEquals(1024 to 768, AvatarImageProcessing.targetSize(4096, 3072))
        assertEquals(576 to 1024, AvatarImageProcessing.targetSize(2160, 3840))
        assertEquals(1024 to 1024, AvatarImageProcessing.targetSize(5000, 5000))
    }

    @Test
    fun degenerateSizesPassThrough() {
        assertEquals(0 to 0, AvatarImageProcessing.targetSize(0, 0))
    }
}
