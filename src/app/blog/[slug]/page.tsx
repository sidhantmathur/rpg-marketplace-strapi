"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowLeft, User } from "lucide-react";
import type { BlogPostResponse, StrapiData, BlogPost } from "@/types/cms";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { slug } = await params;
        const response = await fetch(`/api/cms/blogs?slug=${slug}`);
        if (!response.ok) {
          throw new Error("Failed to fetch blog post");
        }
        const data: BlogPostResponse = await response.json();
        
        if (data.data.length === 0) {
          throw new Error("Blog post not found");
        }
        
        setPost(data.data[0]);
      } catch (err) {
        console.error("Error fetching blog post:", err);
        setError(err instanceof Error ? err.message : "Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-6 bg-ink bg-opacity-20 rounded w-32 mb-4"></div>
          <div className="h-12 bg-ink bg-opacity-20 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-ink bg-opacity-20 rounded w-1/2"></div>
        </div>
        <div className="h-96 bg-ink bg-opacity-20 rounded mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-ink bg-opacity-20 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink mb-4">Blog Post Not Found</h1>
          <p className="text-ink/70 mb-6">
            {error || "The blog post you're looking for doesn't exist."}
          </p>
          <Link
            href="/blog"
            className="fantasy-button inline-block px-6 py-2"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = post.Image?.url;
  const publishedDate = new Date(post.PublishDate || post.publishedAt);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to Blog */}
      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-forest hover:text-forest-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Link>
      </div>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-bold text-ink mb-4 leading-tight">
          {post.Title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-ink/70 mb-6">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              {publishedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          
          {post.Author && (
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>By {post.Author}</span>
            </div>
          )}
        </div>
        
        {post.Excerpt && (
          <p className="text-xl text-ink/80 leading-relaxed">
            {post.Excerpt}
          </p>
        )}
      </header>

      {/* Featured Image */}
      {imageUrl && (
        <div className="relative h-64 lg:h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={post.Image?.alternativeText || post.Title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <div 
          className="text-ink leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.Content }}
        />
      </div>

      {/* Tags */}
      {post.Tags && post.Tags.length > 0 && (
        <div className="mt-8 pt-8 border-t border-ink/20">
          <h3 className="text-lg font-semibold text-ink mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {post.Tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-forest/10 text-forest border border-forest/20 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Back to Blog */}
      <div className="mt-12 pt-8 border-t border-ink/20">
        <Link
          href="/blog"
          className="fantasy-button inline-block px-6 py-2"
        >
          ← Back to Blog
        </Link>
      </div>
    </article>
  );
} 