import asyncio
from pathlib import Path
import sys
import logging


# Ensure backend root is importable when script is run directly.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.sentiment_service import sentiment_service

# Enable logging to see download progress and retries
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


async def main() -> None:
    print("=" * 70)
    print("SENTIMENT MODEL DOWNLOADER")
    print("=" * 70)
    print()
    
    try:
        print("Downloading sentiment models to local sentiment directory...")
        print("(This may take a few minutes on the first run.)")
        print()
        paths = await sentiment_service.download_models()
        
        print()
        print("✓ Download complete:")
        for model_id, model_path in paths.items():
            print(f"  • {model_id}")
            print(f"    → {model_path}")
        print()
        
        print("Warming up local model pipelines...")
        await sentiment_service.warmup_models()
        
        print()
        print("=" * 70)
        print("✓ SUCCESS — Sentiment models are ready for offline/local loading.")
        print("=" * 70)
        
    except Exception as e:
        print()
        print("=" * 70)
        print(f"✗ FAILED — {e}")
        print("=" * 70)
        print()
        print("Troubleshooting:")
        print("  1. Check your internet connection")
        print("  2. Verify Hugging Face Hub is accessible (https://huggingface.co)")
        print("  3. Run this script again — it will resume from interruption point")
        print("  4. If it keeps failing, try after a few minutes")
        print()
        raise


if __name__ == "__main__":
    asyncio.run(main())
