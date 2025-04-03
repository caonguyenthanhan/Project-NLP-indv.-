# This script creates a test image if the model_comparison.png doesn't exist
import os
import matplotlib.pyplot as plt
import numpy as np

# Create models directory if it doesn't exist
os.makedirs("models", exist_ok=True)

# Check if the image already exists
if not os.path.exists("models/model_comparison.png"):
    print("Creating test model comparison image...")
    
    # Create a sample comparison chart
    models = ["Naive Bayes", "Logistic Regression", "SVM"]
    datasets = ["IMDB Reviews", "BBC News", "SMS Spam", "Yelp Reviews"]
    
    # Generate random accuracy data
    data = np.random.uniform(0.7, 0.95, (len(models), len(datasets)))
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(10, 6))
    
    x = np.arange(len(datasets))
    width = 0.25
    
    # Plot bars for each model
    for i, model in enumerate(models):
        ax.bar(x + i*width - width, data[i], width, label=model)
    
    # Add labels and legend
    ax.set_ylabel('Accuracy')
    ax.set_title('Model Comparison Across Datasets')
    ax.set_xticks(x)
    ax.set_xticklabels(datasets)
    ax.legend()
    ax.set_ylim(0.6, 1.0)
    
    # Add grid lines
    ax.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add value labels on top of bars
    for i, model in enumerate(models):
        for j, dataset in enumerate(datasets):
            ax.text(j + i*width - width, data[i, j] + 0.01, 
                    f'{data[i, j]:.2f}', 
                    ha='center', va='bottom', 
                    fontsize=8)
    
    plt.tight_layout()
    
    # Save the figure
    plt.savefig("models/model_comparison.png", dpi=300, bbox_inches='tight')
    print("Test image created successfully!")
else:
    print("Model comparison image already exists.")

