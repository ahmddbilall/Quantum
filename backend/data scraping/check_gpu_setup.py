"""
GPU Setup checker and configuration script for BGE embeddings.
"""

import torch
import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def check_gpu_availability():
    """Check current GPU setup and PyTorch CUDA support."""
    print("🔍 Checking GPU Setup...")
    print("="*50)
    
    # Check if CUDA is available
    cuda_available = torch.cuda.is_available()
    print(f"CUDA Available: {cuda_available}")
    
    if cuda_available:
        # GPU Information
        gpu_count = torch.cuda.device_count()
        print(f"GPU Count: {gpu_count}")
        
        for i in range(gpu_count):
            gpu_name = torch.cuda.get_device_name(i)
            gpu_memory = torch.cuda.get_device_properties(i).total_memory / 1e9
            print(f"GPU {i}: {gpu_name} ({gpu_memory:.1f} GB)")
        
        # Current device
        current_device = torch.cuda.current_device()
        print(f"Current Device: {current_device}")
        
        # CUDA version
        cuda_version = torch.version.cuda
        print(f"CUDA Version: {cuda_version}")
        
    else:
        print("❌ CUDA not available")
        print("\nPossible reasons:")
        print("1. No NVIDIA GPU")
        print("2. CUDA not installed")
        print("3. PyTorch CPU-only version installed")
    
    # PyTorch version
    pytorch_version = torch.__version__
    print(f"PyTorch Version: {pytorch_version}")
    
    return cuda_available

def install_pytorch_gpu():
    """Install PyTorch with CUDA support."""
    print("\n🚀 Installing PyTorch with CUDA support...")
    
    # Uninstall CPU-only PyTorch first
    try:
        print("Uninstalling CPU-only PyTorch...")
        subprocess.run([sys.executable, "-m", "pip", "uninstall", "torch", "torchvision", "torchaudio", "-y"], 
                      check=True, capture_output=True)
    except subprocess.CalledProcessError:
        logger.warning("Could not uninstall existing PyTorch")
    
    # Install PyTorch with CUDA 11.8 (most compatible)
    try:
        print("Installing PyTorch with CUDA 11.8...")
        subprocess.run([
            sys.executable, "-m", "pip", "install", 
            "torch", "torchvision", "torchaudio", 
            "--index-url", "https://download.pytorch.org/whl/cu118"
        ], check=True)
        
        print("✅ PyTorch with CUDA installed successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install PyTorch with CUDA: {e}")
        return False

def test_bge_gpu_performance():
    """Test BGE model performance on CPU vs GPU."""
    print("\n⚡ Testing BGE Performance...")
    
    try:
        import time
        from sentence_transformers import SentenceTransformer
        
        # Test text
        test_texts = [
            "Artificial intelligence is transforming the technology industry.",
            "Cryptocurrency markets are experiencing significant volatility today.",
            "Climate change remains a critical global challenge requiring immediate action.",
            "Space exploration continues to push the boundaries of human knowledge.",
            "Renewable energy adoption is accelerating worldwide."
        ] * 10  # 50 texts total
        
        # Test on CPU
        print("\n📊 CPU Performance Test:")
        model_cpu = SentenceTransformer('BAAI/bge-base-en-v1.5', device='cpu')
        
        start_time = time.time()
        embeddings_cpu = model_cpu.encode(test_texts, batch_size=8)
        cpu_time = time.time() - start_time
        
        print(f"CPU Time: {cpu_time:.2f} seconds for {len(test_texts)} texts")
        print(f"CPU Speed: {len(test_texts)/cpu_time:.1f} texts/second")
        
        # Test on GPU (if available)
        if torch.cuda.is_available():
            print("\n🚀 GPU Performance Test:")
            model_gpu = SentenceTransformer('BAAI/bge-base-en-v1.5', device='cuda')
            
            # Warm up GPU
            _ = model_gpu.encode(test_texts[:5])
            
            start_time = time.time()
            embeddings_gpu = model_gpu.encode(test_texts, batch_size=32)  # Larger batch for GPU
            gpu_time = time.time() - start_time
            
            print(f"GPU Time: {gpu_time:.2f} seconds for {len(test_texts)} texts")
            print(f"GPU Speed: {len(test_texts)/gpu_time:.1f} texts/second")
            
            # Performance comparison
            speedup = cpu_time / gpu_time
            print(f"\n🎯 Performance Results:")
            print(f"GPU is {speedup:.1f}x faster than CPU")
            print(f"Time saved: {cpu_time - gpu_time:.2f} seconds ({(1-gpu_time/cpu_time)*100:.1f}%)")
            
        else:
            print("❌ GPU not available for testing")
            
    except Exception as e:
        logger.error(f"Performance test failed: {e}")

def update_config_for_gpu():
    """Update configuration to use GPU."""
    config_path = "news_scraper/config.py"
    
    if not os.path.exists(config_path):
        logger.warning(f"Config file not found: {config_path}")
        return
    
    print(f"\n⚙️ Updating {config_path} for GPU...")
    
    # Read current config
    with open(config_path, 'r') as f:
        content = f.read()
    
    # Update embedding config
    updated_content = content.replace(
        "'device': 'auto'",
        "'device': 'cuda' if torch.cuda.is_available() else 'cpu'"
    )
    
    # Increase batch size for GPU
    updated_content = updated_content.replace(
        "'batch_size': 8",
        "'batch_size': 32"  # Larger batches work better on GPU
    )
    
    # Write updated config
    with open(config_path, 'w') as f:
        f.write(updated_content)
    
    print("✅ Configuration updated for GPU usage")

def main():
    """Main GPU setup function."""
    print("🖥️ BGE GPU Setup and Performance Analyzer")
    print("="*50)
    
    # Check current setup
    gpu_available = check_gpu_availability()
    
    if not gpu_available:
        print("\n🔧 Setting up GPU support...")
        
        # Check if NVIDIA GPU exists
        try:
            result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ NVIDIA GPU detected")
                
                # Install PyTorch with CUDA
                if install_pytorch_gpu():
                    print("\n🔄 Please restart Python and run this script again to test GPU performance")
                    return
            else:
                print("❌ No NVIDIA GPU detected")
                print("GPU acceleration requires an NVIDIA GPU with CUDA support")
                return
                
        except FileNotFoundError:
            print("❌ nvidia-smi not found")
            print("Please install NVIDIA drivers and CUDA toolkit")
            print("Download from: https://developer.nvidia.com/cuda-downloads")
            return
    
    # Test performance
    test_bge_gpu_performance()
    
    # Update configuration
    update_config_for_gpu()
    
    print("\n" + "="*50)
    print("🎉 GPU Setup Complete!")
    print("="*50)

if __name__ == '__main__':
    import os
    main()