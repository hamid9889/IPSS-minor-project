"""
IPSS Supabase Database Client
Provides access to the Supabase client initialized in backend.database.
"""
from backend.database import supabase, get_supabase

__all__ = ["supabase", "get_supabase"]
