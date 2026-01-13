import pandas as pd
import sys

def read_excel():
    try:
        # Load all sheets
        dict_df = pd.read_excel('기능 명세서.xlsx', sheet_name=None)
        
        with open('specs.md', 'w', encoding='utf-8') as f:
            for sheet_name, df in dict_df.items():
                f.write(f'# Sheet: {sheet_name}\n')
                f.write(df.to_markdown())
                f.write('\n\n')
        print("Successfully written to specs.md")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    read_excel()
