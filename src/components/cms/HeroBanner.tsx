"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HeroBannerResponse, StrapiData, HeroBanner } from "@/types/cms";

export default function HeroBanner() {
  const [heroData, setHeroData] = useState<HeroBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const response = await fetch("/api/cms/hero");
        if (!response.ok) {
          throw new Error("Failed to fetch hero data");
        }
        const data: HeroBannerResponse = await response.json();
        
        console.log("[HeroBanner] Raw data from API:", data);
        console.log("[HeroBanner] data.data:", data.data);
        
        // For single type, data.data is an object, not an array
        const heroData = data.data;
        if (heroData && heroData.IsActive) {
          setHeroData(heroData);
        } else {
          setHeroData(null);
        }
      } catch (err) {
        console.error("Error fetching hero data:", err);
        setError(err instanceof Error ? err.message : "Failed to load hero banner");
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, []);

  if (loading) {
    return (
      <div className="relative h-96 bg-gradient-to-r from-forest to-amber animate-pulse">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-parchment">
            <div className="h-8 bg-parchment bg-opacity-20 rounded mb-4 w-64"></div>
            <div className="h-4 bg-parchment bg-opacity-20 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show fallback hero when there's an error or no data
  if (error || !heroData) {
    return (
      <section className="relative h-96 overflow-hidden rounded-lg mb-8 bg-gradient-to-r from-forest to-amber">
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center h-full px-6 lg:px-12">
          <div className="max-w-2xl text-parchment">
            <p className="text-lg font-medium text-amber mb-2">
              Welcome to Adarle 20
            </p>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
              Your Adventure Awaits
            </h1>
            
            <p className="text-lg lg:text-xl mb-6 text-parchment/90 leading-relaxed">
              Connect with Dungeon Masters and players for epic tabletop role-playing game sessions. 
              Find your next adventure today!
            </p>
            
            <Link
              href="/onboarding"
              className="fantasy-button inline-block px-8 py-3 text-lg font-semibold"
            >
              Start Your Journey
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const imageUrl = heroData.Image?.url;

  return (
    <section className="relative h-96 overflow-hidden rounded-lg mb-8">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={heroData.Image?.alternativeText || heroData.Title}
          fill
          className="object-cover"
          priority
        />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center h-full px-6 lg:px-12">
        <div className="max-w-2xl text-parchment">
          {heroData.Subtitle && (
            <p className="text-lg font-medium text-amber mb-2">
              {heroData.Subtitle}
            </p>
          )}
          
          <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
            {heroData.Title}
          </h1>
          
          {heroData.Description && (
            <p className="text-lg lg:text-xl mb-6 text-parchment/90 leading-relaxed">
              {heroData.Description}
            </p>
          )}
          
          {heroData.ButtonText && heroData.ButtonLink && (
            <Link
              href={heroData.ButtonLink}
              className="fantasy-button inline-block px-8 py-3 text-lg font-semibold"
            >
              {heroData.ButtonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
} 