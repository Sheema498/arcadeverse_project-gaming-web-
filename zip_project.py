import os
import zipfile

def zip_project(output_filename='arcadeverse_project.zip'):
    root_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"Archiving project directory: {root_dir}...")
    
    exclude_dirs = {'node_modules', 'coverage', 'dist', '.gemini', 'scratch'}
    exclude_files = {output_filename}
    
    count = 0
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(root_dir):
            # Resolve relative parts
            rel_dir = os.path.relpath(root, root_dir)
            parts = rel_dir.split(os.sep)
            
            # Skip excluded top-level directories
            if any(p in exclude_dirs for p in parts):
                continue
                
            for file in files:
                if file in exclude_files:
                    continue
                    
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, root_dir)
                
                # Write to zip file
                zipf.write(abs_path, rel_path)
                count += 1
                
    print(f"Archive compiled successfully: {output_filename} ({count} files included, including hidden .git folders).")

if __name__ == '__main__':
    zip_project()
