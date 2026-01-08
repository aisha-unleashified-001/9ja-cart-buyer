import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Loading, Alert } from '../UI';
import { cn } from '../../lib/utils';
import { orderApi } from '../../api/order';
import type { OrderRating } from '../../types';

interface RatingDisplayProps {
  orderId: string;
  className?: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({ orderId, className }) => {
  const [ratings, setRatings] = useState<OrderRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await orderApi.getOrderRatings(orderId);
        setRatings(response.data || []);
      } catch (err: any) {
        console.error('Failed to fetch ratings:', err);
        setError(err.message || 'Failed to load ratings');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchRatings();
    }
  }, [orderId]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-6', className)}>
        <Loading size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        {error}
      </Alert>
    );
  }

  if (!ratings || ratings.length === 0) {
    return null;
  }

  // Calculate average rating
  const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {renderStars(Math.round(averageRating))}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {ratings.length} rating{ratings.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {ratings.map((rating) => (
          <div
            key={rating.id}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {renderStars(rating.rating)}
                <span className="text-sm font-medium text-gray-900">
                  {rating.rating}.0
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(rating.createdAt)}
              </span>
            </div>

            {rating.comment && (
              <div className="flex gap-2 text-sm text-gray-700 mt-2">
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="flex-1">{rating.comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};














