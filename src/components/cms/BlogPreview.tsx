"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import type { BlogPostResponse, StrapiData, BlogPost } from "@/types/cms";

export default function BlogPreview() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch("/api/cms/blogs?limit=3");
        if (!response.ok) {
          throw new Error("Failed to fetch blog posts");
        }
        const data: BlogPostResponse = await response.json();
        console.log("[BlogPreview] Raw data from API:", data);
        console.log("[BlogPreview] data.data:", data.data);
        setBlogPosts(data.data || []);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setError(err instanceof Error ? err.message : "Failed to load blog posts");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-ink bg-opacity-20 rounded w-32"></div>
          <div className="h-6 bg-ink bg-opacity-20 rounded w-24"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="fantasy-border overflow-hidden animate-pulse">
              <div className="h-48 bg-ink bg-opacity-20"></div>
              <div className="p-6">
                <div className="h-6 bg-ink bg-opacity-20 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-ink bg-opacity-20 rounded mb-4 w-full"></div>
                <div className="h-4 bg-ink bg-opacity-20 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Show fallback blog when there's an error or no posts
  if (error || blogPosts.length === 0) {
    return (
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-ink">Latest Blog Posts</h2>
          <Link
            href="/blog"
            className="flex items-center text-forest hover:text-forest/80 transition-colors"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="fantasy-border p-6 text-center">
          <h3 className="text-lg font-semibold text-ink mb-2">No Blog Posts Available</h3>
          <p className="text-ink/70 mb-4">
            Check back soon for community content, tips, and D&D adventures!
          </p>
          <Link
            href="/sessions"
            className="fantasy-button inline-block px-6 py-2 text-sm"
          >
            Explore Sessions
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-ink">Latest Blog Posts</h2>
        <Link
          href="/blog"
          className="flex items-center text-forest hover:text-forest/80 transition-colors"
        >
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => {
          const imageUrl = post.Image?.url;
          const publishedDate = new Date(post.PublishDate || post.publishedAt);

          return (
            <article key={post.id} className="fantasy-border overflow-hidden hover:shadow-lg transition-shadow">
              {imageUrl && (
                <div className="relative h-48">
                  <Image
                    src={imageUrl}
                    alt={post.Image?.alternativeText || post.Title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center text-sm text-ink/70 mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {publishedDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-ink mb-2 line-clamp-2">
                  <Link
                    href={`/blog/${post.Slug}`}
                    className="hover:text-forest transition-colors"
                  >
                    {post.Title}
                  </Link>
                </h3>
                
                {post.Excerpt && (
                  <p className="text-ink/80 mb-4 line-clamp-3">
                    {post.Excerpt}
                  </p>
                )}
                
                {post.Author && (
                  <p className="text-sm text-ink/60">
                    By {post.Author}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
} 