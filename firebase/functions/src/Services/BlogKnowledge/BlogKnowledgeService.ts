import { aiRetrievalService, RetrievalResult } from "../Ai/AiRetrievalService.js"
import { blogKnowledgePosts } from "./BlogKnowledgePosts.js"

/** The retrieval source this domain owns in the embeddings store. */
export const BLOG_KNOWLEDGE_SOURCE = "blog_posts"

/** How many passages a search returns to the model. */
const BLOG_KNOWLEDGE_TOP_K = 4

/**
 * The retrieval exemplar ("chat with your data"): the blog's posts, indexed
 * through the embeddings kernel and searched by the assistant's
 * search_blog_posts tool (Services/Ai/AiChatTools.ts). The shape any domain
 * copies — own your content, converge the index before searching, return
 * the kernel's hits:
 *
 * - Indexing runs through aiRetrievalService.indexDocuments on every
 *   search. That is deliberate, not wasteful: the content-hash skip makes
 *   an unchanged corpus cost one SELECT and zero embedding calls, and it
 *   means edited posts re-embed on next use with no separate pipeline. A
 *   domain with a large or hot corpus moves the same call into its write
 *   path or a registered job instead.
 * - Retrieval goes through aiRetrievalService.searchTopK — never
 *   hand-written vector SQL.
 */
class BlogKnowledgeService {
    async searchPosts(query: string): Promise<RetrievalResult[]> {
        await aiRetrievalService.indexDocuments({
            source: BLOG_KNOWLEDGE_SOURCE,
            documents: blogKnowledgePosts.map((post) => ({
                key: post.slug,
                title: post.title,
                body: `${post.summary}\n\n${post.body}`,
            })),
        })
        return aiRetrievalService.searchTopK({
            source: BLOG_KNOWLEDGE_SOURCE,
            query,
            k: BLOG_KNOWLEDGE_TOP_K,
        })
    }
}

export const blogKnowledgeService = new BlogKnowledgeService()
