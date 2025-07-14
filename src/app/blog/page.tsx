"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";
import type { BlogPostResponse, StrapiData, BlogPost } from "@/types/cms";

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cms/blogs?page=${currentPage}&limit=9`);
        if (!response.ok) {
          throw new Error("Failed to fetch blog posts");
        }
        const data: BlogPostResponse = await response.json();
        setBlogPosts(data.data);
        setTotalPages(data.meta.pagination?.pageCount || 1);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setError(err instanceof Error ? err.message : "Failed to load blog posts");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, [currentPage]);

  if (loading && blogPosts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-8 bg-ink bg-opacity-20 rounded w-32 mb-4"></div>
          <div className="h-4 bg-ink bg-opacity-20 rounded w-64"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      </div>
    );
  }

  if (error && blogPosts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink mb-4">Blog</h1>
          <p className="text-ink/70">Failed to load blog posts. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-forest hover:text-forest-dark transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-ink mb-2">Blog</h1>
        <p className="text-ink/70">
          Discover stories, tips, and insights from the RPG community
        </p>
      </div>

      {blogPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ink/70">No blog posts found.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                    
                    <h2 className="text-xl font-bold text-ink mb-3 line-clamp-2">
                      <Link
                        href={`/blog/${post.Slug}`}
                        className="hover:text-forest transition-colors"
                      >
                        {post.Title}
                      </Link>
                    </h2>
                    
                    {post.Excerpt && (
                      <p className="text-ink/80 mb-4 line-clamp-4">
                        {post.Excerpt}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      {post.Author && (
                        <p className="text-sm text-ink/60">
                          By {post.Author}
                        </p>
                      )}
                      
                      <Link
                        href={`/blog/${post.Slug}`}
                        className="text-forest hover:text-forest-dark text-sm font-medium transition-colors"
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <nav className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="fantasy-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="flex items-center px-4 py-2 text-ink">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="fantasy-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
} 