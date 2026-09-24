
import os
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from both root .env and backend/.env if present
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

def _load_credentials():
    url = os.getenv("SUPABASE_URL", "").strip()
    key = (os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_API_KEY", "")).strip()
    return url, key

_client: Optional[Client] = None

def get_supabase() -> Client:
    """Return the Supabase client instance, initializing on first call."""
    global _client
    if _client is not None:
        return _client

    # Reload environment variables in case .env was updated
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

    url, key = _load_credentials()
    if not url or not key:
        raise RuntimeError(
            "Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY in your .env file."
        )

    _client = create_client(url, key)
    return _client

class _SupabaseProxy:
    """Convenient proxy allowing direct usage like `from backend.database import supabase; supabase.table(...)`"""
    def __getattr__(self, name):
        return getattr(get_supabase(), name)

supabase = _SupabaseProxy()
