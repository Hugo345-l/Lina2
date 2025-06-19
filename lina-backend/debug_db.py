#!/usr/bin/env python3
"""Script para debug da estrutura do SQLite"""

import sqlite3
import os

db_path = 'lina_conversations.db'
print(f"🔍 Investigando banco: {db_path}")
print(f"📍 Arquivo existe: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    print(f"📊 Tamanho: {os.path.getsize(db_path)} bytes")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Listar tabelas
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"\n🗄️ Tabelas encontradas: {[t[0] for t in tables]}")
    
    # Para cada tabela, mostrar estrutura e conteúdo
    for table in tables:
        table_name = table[0]
        print(f"\n📋 TABELA: {table_name}")
        
        # Estrutura da tabela
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        print(f"   Colunas: {[(c[1], c[2]) for c in columns]}")
        
        # Contar registros
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        count = cursor.fetchone()[0]
        print(f"   Registros: {count}")
        
        # Mostrar alguns registros se houver
        if count > 0:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
            rows = cursor.fetchall()
            print(f"   Primeiros registros:")
            for i, row in enumerate(rows, 1):
                print(f"     {i}: {row[:3]}...")  # Primeiros 3 campos
    
    # Procurar especificamente por thread_ids
    print(f"\n🧵 PROCURANDO THREADS:")
    for table in tables:
        table_name = table[0]
        try:
            cursor.execute(f"SELECT * FROM {table_name} WHERE thread_id LIKE 'thread_default_user_%' LIMIT 5;")
            thread_rows = cursor.fetchall()
            if thread_rows:
                print(f"   {table_name}: {len(thread_rows)} threads encontradas")
                for row in thread_rows:
                    # Extrair thread_id se possível
                    print(f"     - {row[0] if row else 'N/A'}")
        except Exception as e:
            # Tabela pode não ter coluna thread_id
            pass
    
    conn.close()
    print(f"\n✅ Investigação concluída")
    
except Exception as e:
    print(f"❌ Erro: {e}")
