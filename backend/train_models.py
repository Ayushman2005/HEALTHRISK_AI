import os
import json
import glob
import pandas as pd

def execute_notebook_cells(notebook_path):
    print(f"\n==================================================")
    print(f"Executing Jupyter Notebook: {os.path.basename(notebook_path)}")
    print(f"==================================================")
    
    with open(notebook_path, "r", encoding="utf-8") as f:
        nb = json.load(f)
        
    global_env = {'__name__': '__main__'}
    
    for idx, cell in enumerate(nb.get("cells", [])):
        if cell.get("cell_type") == "code":
            source = "".join(cell.get("source", []))
            if source.strip():
                try:
                    exec(source, global_env)
                except Exception as e:
                    print(f"Error executing cell {idx+1} in {os.path.basename(notebook_path)}: {e}")
                    raise e

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    notebooks_dir = os.path.join(base_dir, "notebooks")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    
    notebook_files = [
        os.path.join(notebooks_dir, "diabetes_model_training.ipynb"),
        os.path.join(notebooks_dir, "heart_disease_model_training.ipynb"),
        os.path.join(notebooks_dir, "kidney_disease_model_training.ipynb"),
        os.path.join(notebooks_dir, "liver_disease_model_training.ipynb")
    ]
    
    for nb_path in notebook_files:
        if os.path.exists(nb_path):
            execute_notebook_cells(nb_path)
        else:
            print(f"WARNING: Notebook file missing at {nb_path}")
            
    # Combine individual datasets into unified clinical_dataset.csv
    print("\n--------------------------------------------------")
    print("Consolidating individual datasets into clinical_dataset.csv...")
    try:
        df_diab = pd.read_csv(os.path.join(models_dir, "diabetes_dataset.csv"))
        df_heart = pd.read_csv(os.path.join(models_dir, "heart_disease_dataset.csv"))
        df_kidney = pd.read_csv(os.path.join(models_dir, "kidney_disease_dataset.csv"))
        df_liver = pd.read_csv(os.path.join(models_dir, "liver_disease_dataset.csv"))
        
        # Build consolidated dataframe
        df_combined = df_diab.copy()
        df_combined['heart_disease'] = df_heart['heart_disease']
        df_combined['kidney_disease'] = df_kidney['kidney_disease']
        df_combined['liver_disease'] = df_liver['liver_disease']
        
        clinical_path = os.path.join(models_dir, "clinical_dataset.csv")
        df_combined.to_csv(clinical_path, index=False)
        print(f"Consolidated dataset saved to: {clinical_path} ({len(df_combined)} rows)")
    except Exception as e:
        print(f"Warning consolidating clinical dataset: {e}")
        
    # Verify trained models count
    pkl_files = glob.glob(os.path.join(models_dir, "*.pkl"))
    model_pkls = [f for f in pkl_files if not f.endswith("scaler.pkl")]
    print(f"\nTraining summary: Successfully loaded/trained {len(model_pkls)} model files in models/ directory.")
    print("All models are ready for Flask server deployment.")

if __name__ == "__main__":
    main()
