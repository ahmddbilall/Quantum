Run the following code on colab and then from Google Drive download the zip file. then unzip the downloaded model file in models/


   
```python
# Step 1: Install dependencies
!pip install -q huggingface_hub

# Step 2: Download model into a local folder
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="BAAI/bge-base-en-v1.5",
    local_dir="bge-base-en-v1.5",
    local_dir_use_symlinks=False
)

# Step 3: Zip the folder
import shutil
shutil.make_archive("bge-base-en-v1.5", 'zip', "bge-base-en-v1.5")

# Step 4: Save to Google Drive (safer than direct download for >2GB)
from google.colab import drive, files
drive.mount('/content/drive')
!cp bge-base-en-v1.5.zip /content/drive/MyDrive/
```

