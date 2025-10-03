import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Skeleton */}
        <div className="text-center mb-12 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
        </div>

        {/* Featured Post Skeleton */}
        <div className="mb-12">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 h-64 bg-gray-200 animate-pulse"></div>
              <div className="md:w-1/2 p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
