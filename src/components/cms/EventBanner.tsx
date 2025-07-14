"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import type { EventBannerResponse, StrapiData, EventBanner } from "@/types/cms";

export default function EventBanner() {
  const [event, setEvent] = useState<EventBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/cms/event-banner");
        if (!response.ok) {
          throw new Error("Failed to fetch events data");
        }
        const data: EventBannerResponse = await response.json();
        
        console.log("[EventBanner] Raw data from API:", data);
        const eventData = data.data;
        if (eventData && eventData.IsActive) {
          setEvent(eventData);
        } else {
          setEvent(null);
        }
      } catch (err) {
        console.error("Error fetching events data:", err);
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="fantasy-border p-6 mb-8 animate-pulse">
        <div className="h-6 bg-ink bg-opacity-20 rounded mb-4 w-48"></div>
        <div className="h-4 bg-ink bg-opacity-20 rounded w-64"></div>
      </div>
    );
  }

  // Show fallback events when there's an error or no events
  if (error || !event) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-ink mb-4">Upcoming Events</h2>
        <div className="fantasy-border p-6 text-center">
          <h3 className="text-lg font-semibold text-ink mb-2">No Events Currently Scheduled</h3>
          <p className="text-ink/70 mb-4">
            Check back soon for upcoming D&D sessions and community events!
          </p>
          <Link
            href="/sessions"
            className="fantasy-button inline-block px-6 py-2 text-sm"
          >
            Browse Sessions
          </Link>
        </div>
      </section>
    );
  }

  const imageUrl = event.Image?.url;
  const startDate = new Date(event.StartDate);
  const endDate = event.EndDate ? new Date(event.EndDate) : null;

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-ink mb-4">Upcoming Events</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div key={event.id} className="fantasy-border overflow-hidden">
          {imageUrl && (
            <div className="relative h-48">
              <Image
                src={imageUrl}
                alt={event.Image?.alternativeText || event.Title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="p-6">
            <h3 className="text-xl font-bold text-ink mb-2">
              {event.Title}
            </h3>
            
            {event.Description && (
              <p className="text-ink/80 mb-4 line-clamp-3">
                {event.Description}
              </p>
            )}
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-ink/70">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {startDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {endDate && endDate.getTime() !== startDate.getTime() && (
                    <>
                      {" - "}
                      {endDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </>
                  )}
                </span>
              </div>
              
              {event.Location && (
                <div className="flex items-center text-sm text-ink/70">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{event.Location}</span>
                </div>
              )}
            </div>
            
            {event.ButtonText && event.ButtonLink && (
              <Link
                href={event.ButtonLink}
                className="fantasy-button inline-block px-4 py-2 text-sm"
              >
                {event.ButtonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 