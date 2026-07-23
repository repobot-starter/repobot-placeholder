package com.baseapp.android.view.blog

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.SimpleDateFormat
import java.util.Locale

/** The blog's reading palette, mirrored from BlogPage.styles.css.ts. */
private object BlogPalette {
    val paper = Color(0xFFFCFBF6)
    val ink = Color(0xFF20211C)
    val inkSoft = Color(0xFF71716A)
    val line = Color(0xFFE5E3D8)
    val accent = Color(0xFF3E6B4F)
    val accentSoft = Color(0xFFEEF2EA)
    val codeBg = Color(0xFFF2F0E8)
}

@Composable
fun BlogView() {
    var activeTag by remember { mutableStateOf<String?>(null) }
    var openSlug by remember { mutableStateOf<String?>(null) }

    val orderedPosts = remember { BlogContent.sortedPosts() }
    val openPost = openSlug?.let { slug -> orderedPosts.firstOrNull { it.slug == slug } }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BlogPalette.paper),
    ) {
        if (openPost != null) {
            ArticleView(post = openPost, onBack = { openSlug = null })
        } else {
            PostListView(
                posts = orderedPosts,
                activeTag = activeTag,
                onTagChange = { activeTag = it },
                onOpen = { openSlug = it },
            )
        }
    }
}

@Composable
private fun PostListView(
    posts: List<BlogContent.Post>,
    activeTag: String?,
    onTagChange: (String?) -> Unit,
    onOpen: (String) -> Unit,
) {
    val visible = if (activeTag == null) posts else posts.filter { activeTag in it.tags }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp)
            .padding(bottom = 48.dp),
    ) {
        Masthead()
        TagRow(posts = posts, activeTag = activeTag, onTagChange = onTagChange)
        visible.forEach { post -> PostCard(post = post, onOpen = onOpen) }
        Text(
            text = "${BlogContent.TITLE} — written by ${BlogContent.author.name}. Built with Repobot.",
            fontSize = 13.sp,
            color = BlogPalette.inkSoft,
            modifier = Modifier.padding(top = 28.dp),
        )
    }
}

@Composable
private fun Masthead() {
    Column(modifier = Modifier.padding(top = 40.dp)) {
        Text(
            text = BlogContent.TITLE,
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = BlogPalette.ink,
        )
        Text(
            text = BlogContent.TAGLINE,
            fontSize = 15.sp,
            lineHeight = 22.sp,
            color = BlogPalette.inkSoft,
            modifier = Modifier.padding(top = 8.dp),
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(top = 18.dp),
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(BlogPalette.accent),
            ) {
                Text(
                    text = BlogContent.author.initials,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = BlogPalette.paper,
                )
            }
            Column(modifier = Modifier.padding(start = 12.dp)) {
                Text(
                    text = BlogContent.author.name,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BlogPalette.ink,
                )
                Text(
                    text = BlogContent.author.role,
                    fontSize = 12.sp,
                    color = BlogPalette.inkSoft,
                )
            }
        }
        HorizontalRule(modifier = Modifier.padding(top = 18.dp))
    }
}

@Composable
private fun TagRow(
    posts: List<BlogContent.Post>,
    activeTag: String?,
    onTagChange: (String?) -> Unit,
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier
            .horizontalScroll(rememberScrollState())
            .padding(vertical = 14.dp),
    ) {
        TagChip(label = "All", isActive = activeTag == null) { onTagChange(null) }
        BlogContent.allTags(posts).forEach { tag ->
            TagChip(label = tag, isActive = activeTag == tag) {
                onTagChange(if (activeTag == tag) null else tag)
            }
        }
    }
}

@Composable
private fun TagChip(label: String, isActive: Boolean, onClick: () -> Unit) {
    Text(
        text = label,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        color = if (isActive) BlogPalette.paper else BlogPalette.inkSoft,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(if (isActive) BlogPalette.accent else Color.Transparent)
            .border(
                width = 1.dp,
                color = if (isActive) BlogPalette.accent else BlogPalette.line,
                shape = RoundedCornerShape(999.dp),
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 7.dp),
    )
}

@Composable
private fun PostCard(post: BlogContent.Post, onOpen: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onOpen(post.slug) }
            .padding(top = 18.dp),
    ) {
        PostMeta(post = post, showTags = false)
        Text(
            text = post.title,
            fontSize = 22.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Serif,
            color = BlogPalette.ink,
            modifier = Modifier.padding(top = 8.dp),
        )
        Text(
            text = post.summary,
            fontSize = 14.sp,
            lineHeight = 21.sp,
            color = BlogPalette.inkSoft,
            modifier = Modifier.padding(top = 6.dp),
        )
        HorizontalRule(modifier = Modifier.padding(top = 16.dp))
    }
}

@Composable
private fun PostMeta(post: BlogContent.Post, showTags: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = "${formatDate(post.date)} · ${BlogMarkdown.readingTimeMinutes(post.body)} min read",
            fontSize = 12.sp,
            color = BlogPalette.inkSoft,
        )
        if (showTags) {
            post.tags.forEach { tag ->
                Text(
                    text = tag,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BlogPalette.accent,
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(BlogPalette.accentSoft)
                        .padding(horizontal = 9.dp, vertical = 2.dp),
                )
            }
        }
    }
}

@Composable
private fun ArticleView(post: BlogContent.Post, onBack: () -> Unit) {
    val blocks = remember(post.slug) { BlogMarkdown.parseMarkdown(post.body) }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 22.dp)
            .padding(bottom = 48.dp),
    ) {
        Text(
            text = "← All posts",
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = BlogPalette.accent,
            modifier = Modifier
                .padding(top = 40.dp)
                .clickable(onClick = onBack),
        )
        Text(
            text = post.title,
            fontSize = 30.sp,
            lineHeight = 36.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = BlogPalette.ink,
            modifier = Modifier.padding(top = 14.dp),
        )
        Box(modifier = Modifier.padding(top = 8.dp)) {
            PostMeta(post = post, showTags = true)
        }
        Column(
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(top = 24.dp),
        ) {
            blocks.forEach { block -> BlockView(block) }
        }
        HorizontalRule(modifier = Modifier.padding(vertical = 24.dp))
        Text(
            text = "${BlogContent.author.name} — ${BlogContent.author.bio}",
            fontSize = 13.sp,
            lineHeight = 19.sp,
            color = BlogPalette.inkSoft,
        )
    }
}

@Composable
private fun BlockView(block: BlogBlock) {
    when (block) {
        is BlogBlock.Heading -> Text(
            text = inlineAnnotated(block.inlines),
            fontSize = when (block.level) {
                1 -> 26.sp
                2 -> 22.sp
                else -> 19.sp
            },
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Serif,
            color = BlogPalette.ink,
            modifier = Modifier.padding(top = 12.dp),
        )
        is BlogBlock.Paragraph -> InlineText(block.inlines)
        is BlogBlock.Quote -> Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(2.dp))
                    .background(BlogPalette.accent),
            )
            Text(
                text = inlineAnnotated(block.inlines),
                fontSize = 16.sp,
                lineHeight = 25.sp,
                fontStyle = FontStyle.Italic,
                color = BlogPalette.inkSoft,
                modifier = Modifier.padding(start = 12.dp),
            )
        }
        is BlogBlock.Code -> Text(
            text = block.text,
            fontSize = 12.5.sp,
            lineHeight = 19.sp,
            fontFamily = FontFamily.Monospace,
            color = BlogPalette.ink,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(BlogPalette.codeBg)
                .border(1.dp, BlogPalette.line, RoundedCornerShape(10.dp))
                .horizontalScroll(rememberScrollState())
                .padding(14.dp),
        )
        is BlogBlock.ListBlock -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            block.items.forEachIndexed { index, item ->
                Row {
                    Text(
                        text = if (block.ordered) "${index + 1}." else "•",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = BlogPalette.accent,
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    InlineText(item)
                }
            }
        }
        BlogBlock.Divider -> Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
        ) {
            Box(
                modifier = Modifier
                    .width(96.dp)
                    .height(1.dp)
                    .background(BlogPalette.line),
            )
        }
    }
}

private const val LINK_TAG = "URL"

@Composable
private fun InlineText(inlines: List<BlogInline>) {
    val uriHandler = LocalUriHandler.current
    val annotated = inlineAnnotated(inlines)
    val hasLink = annotated.getStringAnnotations(LINK_TAG, 0, annotated.length).isNotEmpty()
    if (hasLink) {
        androidx.compose.foundation.text.ClickableText(
            text = annotated,
            style = androidx.compose.ui.text.TextStyle(
                fontSize = 16.sp,
                lineHeight = 26.sp,
                color = BlogPalette.ink,
            ),
            onClick = { offset ->
                annotated.getStringAnnotations(LINK_TAG, offset, offset)
                    .firstOrNull()
                    ?.let { uriHandler.openUri(it.item) }
            },
        )
    } else {
        Text(
            text = annotated,
            fontSize = 16.sp,
            lineHeight = 26.sp,
            color = BlogPalette.ink,
        )
    }
}

private fun inlineAnnotated(inlines: List<BlogInline>): AnnotatedString =
    buildAnnotatedString {
        inlines.forEach { inline ->
            when (inline) {
                is BlogInline.Text -> append(inline.text)
                is BlogInline.Bold -> {
                    pushStyle(SpanStyle(fontWeight = FontWeight.Bold))
                    append(inline.text)
                    pop()
                }
                is BlogInline.Italic -> {
                    pushStyle(SpanStyle(fontStyle = FontStyle.Italic))
                    append(inline.text)
                    pop()
                }
                is BlogInline.Code -> {
                    pushStyle(
                        SpanStyle(
                            fontFamily = FontFamily.Monospace,
                            fontSize = 14.sp,
                            background = BlogPalette.codeBg,
                        ),
                    )
                    append(inline.text)
                    pop()
                }
                is BlogInline.Link -> {
                    pushStringAnnotation(tag = LINK_TAG, annotation = inline.href)
                    pushStyle(
                        SpanStyle(
                            color = BlogPalette.accent,
                            fontWeight = FontWeight.SemiBold,
                            textDecoration = TextDecoration.Underline,
                        ),
                    )
                    append(inline.text)
                    pop()
                    pop()
                }
            }
        }
    }

@Composable
private fun HorizontalRule(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(BlogPalette.line),
    )
}

private fun formatDate(iso: String): String {
    val parser = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    val date = parser.parse(iso) ?: return iso
    return SimpleDateFormat("MMMM d, yyyy", Locale.US).format(date)
}
