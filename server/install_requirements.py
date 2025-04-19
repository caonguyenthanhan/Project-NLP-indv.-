import subprocess
import sys

def install_requirements():
    packages = [
        'datasets',
        'scikit-learn',
        'pandas',
        'numpy',
        'matplotlib',
        'joblib'
    ]
    
    print("Installing required packages...")
    for package in packages:
        print(f"\nInstalling {package}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"Successfully installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"Error installing {package}: {str(e)}")
            
    print("\nAll packages have been installed!")

if __name__ == "__main__":
    install_requirements() 