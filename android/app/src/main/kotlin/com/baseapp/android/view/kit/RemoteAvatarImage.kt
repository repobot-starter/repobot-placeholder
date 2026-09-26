package com.baseapp.android.view.kit

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

/**
 * Renders a remote image in a circle, falling back to the given placeholder
 * while loading or on failure — the Compose stand-in for the iOS twin's
 * AsyncImage (this repo deliberately has no image-loading dependency; avatars
 * are the only remote images the kernel renders). A small in-memory cache
 * keeps the sidebar footer from refetching on every recomposition.
 */
@Composable
fun RemoteAvatarImage(
    url: String,
    size: Dp,
    placeholder: @Composable () -> Unit,
) {
    val image by produceState<ImageBitmap?>(initialValue = cache[url], key1 = url) {
        if (value == null) {
            value = fetchImage(url)?.also { cache[url] = it }
        }
    }
    val loaded = image
    if (loaded != null) {
        Image(
            bitmap = loaded,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(size)
                .clip(CircleShape),
        )
    } else {
        placeholder()
    }
}

// Avatars are tiny (uploads are downscaled to ≤1024 px) and there is one per
// signed-in user, so an unbounded per-process map is effectively a 1-2 entry
// cache that naturally invalidates: a new avatar gets a new upload id and URL.
private val cache = mutableMapOf<String, ImageBitmap>()

private val httpClient = OkHttpClient()

private suspend fun fetchImage(url: String): ImageBitmap? = withContext(Dispatchers.IO) {
    try {
        httpClient.newCall(Request.Builder().url(url).build()).execute().use { response ->
            if (!response.isSuccessful) {
                return@withContext null
            }
            val bytes = response.body?.bytes() ?: return@withContext null
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
        }
    } catch (_: Exception) {
        null
    }
}
