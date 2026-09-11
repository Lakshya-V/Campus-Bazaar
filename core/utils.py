import uuid
from pathlib import Path

from django.conf import settings
from supabase import create_client


def upload_listing_image(image):
    """Upload an image and return its public Supabase Storage URL."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError('Supabase Storage is not configured.')

    extension = Path(image.name).suffix.lower()
    file_path = f'{uuid.uuid4()}{extension}'
    storage = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY).storage
    storage.from_(settings.SUPABASE_BUCKET_NAME).upload(
        file_path,
        image.read(),
        file_options={'content-type': image.content_type, 'upsert': 'false'},
    )
    return storage.from_(settings.SUPABASE_BUCKET_NAME).get_public_url(file_path)