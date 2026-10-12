from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app) 

@app.route('/api/network')
def network():
    # 1. Load links
    df_edges = pd.read_csv('data/paper_citation_links_within_fsu.csv')
    edges = df_edges.groupby(['source', 'target']).size().reset_index(name='value')
    
    links = [{"source": str(row['source']), "target": str(row['target']), "value": int(row['value'])} for _, row in edges.iterrows()]
    
    # 2. Load metadata for tooltips
    df_meta = pd.read_csv('data/fsu_works_2021_2026.csv')
    df_meta['title'] = df_meta['title'].fillna('Unknown Title')
    df_meta['publication_year'] = df_meta['publication_year'].fillna(0).astype(int)
    meta_dict = df_meta.set_index('id')[['title', 'publication_year']].to_dict('index')
    
    unique_nodes = set(edges['source'].astype(str)).union(set(edges['target'].astype(str)))
    
    # 3. Attach metadata to nodes
    nodes = []
    for node_id in unique_nodes:
        info = meta_dict.get(node_id, {})
        nodes.append({
            "id": node_id,
            "title": info.get('title', 'Unknown Title'),
            "year": info.get('publication_year', 'Unknown')
        })
    
    return jsonify({"nodes": nodes, "links": links})

if __name__ == '__main__':
    app.run(port=5001)