import os
import sys
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Define paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
ENV_PATH = os.path.join(PROJECT_ROOT, 'backend', '.env')
LOGO_PATH = os.path.join(PROJECT_ROOT, 'asset', 'LOGO.png')

def main():
    print(f"Loading .env from: {ENV_PATH}")
    if not os.path.exists(ENV_PATH):
        print(f"Error: .env file not found at {ENV_PATH}")
        sys.exit(1)
        
    load_dotenv(dotenv_path=ENV_PATH)
    
    # Check credentials
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    if not all([cloud_name, api_key, api_secret]):
        print("Error: Missing Cloudinary credentials in .env file.")
        sys.exit(1)
        
    print(f"Configuring Cloudinary for cloud: {cloud_name}")
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
    
    print(f"Looking for logo at: {LOGO_PATH}")
    if not os.path.exists(LOGO_PATH):
        print(f"Error: Logo file not found at {LOGO_PATH}")
        sys.exit(1)
        
    print("Uploading logo to Cloudinary...")
    try:
        # Upload the image
        response = cloudinary.uploader.upload(
            LOGO_PATH, 
            folder="system_assets", 
            public_id="main_logo",
            overwrite=True
        )
        
        secure_url = response.get('secure_url')
        print("\n✅ Upload successful!")
        print("-" * 50)
        print(f"Public ID: {response.get('public_id')}")
        print(f"Format: {response.get('format')}")
        print(f"Size: {response.get('bytes')} bytes")
        print(f"URL: {secure_url}")
        print("-" * 50)
        
        # Update .env file
        print("\nUpdating .env file with new URL...")
        with open(ENV_PATH, 'r') as file:
            lines = file.readlines()
            
        env_updated = False
        with open(ENV_PATH, 'w') as file:
            for line in lines:
                if line.startswith('SYSTEM_LOGO_URL='):
                    file.write(f'SYSTEM_LOGO_URL={secure_url}\n')
                    env_updated = True
                else:
                    file.write(line)
            
            if not env_updated:
                file.write(f'\n# System Assets\nSYSTEM_LOGO_URL={secure_url}\n')
                
        print(f"✅ SYSTEM_LOGO_URL added/updated in {ENV_PATH}")
        
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
