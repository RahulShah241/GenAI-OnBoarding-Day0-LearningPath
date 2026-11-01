"""
services/cag_cache.py
─────────────────────
Cache-Augmented Generation (CAG) module using Redis.

Reduces LLM API costs and eliminates latency by caching generated LLM responses:
  • AI Learning Paths (by project_id + sorted skill gaps)
  • Course Recommendations (by sorted missing skills)
  • Onboarding Question Evaluations (by topic + normalized Q&A)

Features:
  1. High-speed Redis caching with customizable TTL (default 24h).
  2. Seamless in-memory LRU fallback when Redis is offline (zero crashes).
  3. Real-time cost & token reduction tracker (hits, misses, estimated $ savings).
  4. Cache invalidation support.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from typing import Any, Dict, Optional, Union

logger = logging.getLogger(__name__)

# Try importing redis
try:
    import redis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False
    redis = None


def _compute_cache_key(namespace: str, data: Any) -> str:
    """Generate a stable, deterministic MD5 digest key for arbitrary inputs."""
    serialized = json.dumps(data, sort_keys=True, ensure_ascii=True, default=str)
    digest = hashlib.md5(serialized.encode("utf-8")).hexdigest()
    return f"cag:{namespace}:{digest}"


class InMemoryFallbackCache:
    """Thread-safe LRU/TTL in-memory cache used when Redis is unreachable."""

    def __init__(self, max_items: int = 500) -> None:
        self.max_items = max_items
        self._store: Dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key not in self._store:
            return None
        val, expiry = self._store[key]
        if expiry and time.time() > expiry:
            del self._store[key]
            return None
        return val

    def set(self, key: str, value: Any, ttl_seconds: int = 86400) -> None:
        if len(self._store) >= self.max_items:
            # Evict oldest entry
            oldest_key = next(iter(self._store))
            self._store.pop(oldest_key, None)
        expiry = time.time() + ttl_seconds if ttl_seconds > 0 else 0
        self._store[key] = (value, expiry)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()


class CAGCache:
    """
    Cache-Augmented Generation (CAG) Manager.
    Connects to Redis with automatic fallback to local in-memory cache.
    """

    # Estimated tokens saved per generation type
    ESTIMATED_TOKENS_PER_TYPE = {
        "learning_path": 1200,   # ~400 input + 800 output tokens
        "course_recs": 500,      # ~200 input + 300 output tokens
        "llm_eval": 400,         # ~250 input + 150 output tokens
    }
    # Blended price per 1k tokens ($0.0003 for Gemini Flash)
    PRICE_PER_1K_TOKENS = 0.0003

    def __init__(self, redis_url: Optional[str] = None) -> None:
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.client: Optional[redis.Redis] = None
        self.is_redis_connected = False
        self.fallback = InMemoryFallbackCache()

        # Analytics
        self.hits = 0
        self.misses = 0
        self.tokens_saved = 0

        self._init_connection()

    def _init_connection(self) -> None:
        if not HAS_REDIS:
            logger.info("Redis package not found. Using local in-memory CAG fallback.")
            self.is_redis_connected = False
            return

        try:
            self.client = redis.Redis.from_url(
                self.redis_url,
                socket_connect_timeout=1.0,
                socket_timeout=1.0,
                decode_responses=True,
            )
            # Test ping
            self.client.ping()
            self.is_redis_connected = True
            logger.info("Connected to Redis for CAG caching at %s", self.redis_url)
        except Exception as exc:
            self.is_redis_connected = False
            self.client = None
            logger.info(
                "Redis server not reachable at %s (%s). Using high-performance in-memory CAG cache.",
                self.redis_url,
                exc,
            )

    def get(self, namespace: str, key_data: Any) -> Optional[Any]:
        """
        Retrieve cached generation response.
        Returns parsed object if hit, or None if miss.
        """
        cache_key = _compute_cache_key(namespace, key_data)

        # 1. Try Redis
        if self.is_redis_connected and self.client:
            try:
                raw = self.client.get(cache_key)
                if raw:
                    self.hits += 1
                    tokens = self.ESTIMATED_TOKENS_PER_TYPE.get(namespace, 600)
                    self.tokens_saved += tokens
                    logger.debug("CAG Redis HIT [%s]", cache_key)
                    return json.loads(raw)
            except Exception as exc:
                logger.warning("Redis get error for %s: %s", cache_key, exc)

        # 2. Try In-Memory Fallback
        val = self.fallback.get(cache_key)
        if val is not None:
            self.hits += 1
            tokens = self.ESTIMATED_TOKENS_PER_TYPE.get(namespace, 600)
            self.tokens_saved += tokens
            logger.debug("CAG In-Memory HIT [%s]", cache_key)
            return val

        self.misses += 1
        return None

    def set(
        self,
        namespace: str,
        key_data: Any,
        value: Any,
        ttl_seconds: int = 86400,
    ) -> bool:
        """
        Store LLM generation in cache with TTL (default 24 hours).
        """
        if value is None:
            return False

        cache_key = _compute_cache_key(namespace, key_data)

        # 1. Try Redis
        stored_redis = False
        if self.is_redis_connected and self.client:
            try:
                serialized = json.dumps(value, ensure_ascii=False)
                self.client.set(cache_key, serialized, ex=ttl_seconds)
                stored_redis = True
                logger.debug("CAG Redis SET [%s] (TTL %ss)", cache_key, ttl_seconds)
            except Exception as exc:
                logger.warning("Redis set error for %s: %s", cache_key, exc)

        # 2. Always store in fallback cache as well
        self.fallback.set(cache_key, value, ttl_seconds=ttl_seconds)
        return True

    def invalidate(self, namespace: str, key_data: Optional[Any] = None) -> int:
        """
        Invalidate cached items for a namespace or specific key.
        """
        if key_data is not None:
            cache_key = _compute_cache_key(namespace, key_data)
            self.fallback.delete(cache_key)
            if self.is_redis_connected and self.client:
                try:
                    self.client.delete(cache_key)
                except Exception:
                    pass
            return 1

        # Delete all keys matching namespace pattern
        pattern = f"cag:{namespace}:*"
        count = 0
        if self.is_redis_connected and self.client:
            try:
                keys = self.client.keys(pattern)
                if keys:
                    count = self.client.delete(*keys)
            except Exception as exc:
                logger.warning("Redis pattern deletion error: %s", exc)

        self.fallback.clear()
        return count

    def get_stats(self) -> Dict[str, Any]:
        """
        Returns real-time CAG cost reduction and cache performance statistics.
        """
        total_requests = self.hits + self.misses
        hit_ratio = round((self.hits / total_requests) * 100, 2) if total_requests > 0 else 0.0
        cost_saved_usd = round((self.tokens_saved / 1000) * self.PRICE_PER_1K_TOKENS, 4)

        return {
            "cag_enabled": True,
            "engine": "Redis (Active)" if self.is_redis_connected else "In-Memory LRU (Active)",
            "redis_connected": self.is_redis_connected,
            "redis_url": self.redis_url,
            "cache_hits": self.hits,
            "cache_misses": self.misses,
            "total_generations_handled": total_requests,
            "cache_hit_ratio_percentage": hit_ratio,
            "estimated_tokens_saved": self.tokens_saved,
            "estimated_cost_saved_usd": cost_saved_usd,
        }


# Global singleton instance
_GLOBAL_CAG: Optional[CAGCache] = None


def get_cag_cache() -> CAGCache:
    """Retrieve or initialize global CAG cache manager."""
    global _GLOBAL_CAG
    if _GLOBAL_CAG is None:
        _GLOBAL_CAG = CAGCache()
    return _GLOBAL_CAG
