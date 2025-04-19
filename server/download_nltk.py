import nltk
import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download NLTK data
resources = ["punkt", "stopwords", "wordnet", "averaged_perceptron_tagger"]
for resource in resources:
    print(f"Downloading {resource}...")
    nltk.download(resource)
    print(f"Successfully downloaded {resource}")

print("\nAll NLTK resources have been downloaded successfully!") 