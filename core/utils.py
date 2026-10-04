import logging
import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.storage import default_storage
from supabase import create_client

logger = logging.getLogger(__name__)


def _upload_file(image, *, storage_path, supabase_path):
    extension = Path(image.name).suffix.lower()
    file_name = f'{uuid.uuid4()}{extension}'

    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        supabase_url = settings.SUPABASE_URL.strip().rstrip('/')
        if supabase_url.lower().endswith('/rest/v1'):
            supabase_url = supabase_url[:-len('/rest/v1')]

        try:
            storage = create_client(supabase_url, settings.SUPABASE_KEY).storage
            bucket = storage.from_(settings.SUPABASE_BUCKET_NAME)
            image.seek(0)
            bucket.upload(
                supabase_path.format(file_name=file_name),
                image.read(),
                file_options={'content-type': image.content_type, 'upsert': False},
            )
            return bucket.get_public_url(supabase_path.format(file_name=file_name))
        except Exception:
            logger.warning(
                'Supabase upload failed for "%s"; falling back to local media storage.',
                image.name,
                exc_info=True,
            )

    image.seek(0)
    saved_path = default_storage.save(storage_path.format(file_name=file_name), image)
    return default_storage.url(saved_path)


def upload_listing_image(image):
    """Upload a listing image to Supabase or Django's configured media storage."""
    return _upload_file(
        image,
        storage_path='listings/{file_name}',
        supabase_path='{file_name}',
    )


def upload_chat_attachment(image):
    """Upload a chat attachment to Supabase or Django's configured media storage."""
    return _upload_file(
        image,
        storage_path='chat/{file_name}',
        supabase_path='chat/{file_name}',
    )