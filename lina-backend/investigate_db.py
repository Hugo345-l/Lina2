import sqlite3
import pickle

conn = sqlite3.connect('lina_conversations.db')
cursor = conn.execute('SELECT thread_id, checkpoint FROM checkpoints WHERE thread_id LIKE "thread_default_user_%" LIMIT 1')
result = cursor.fetchone()

if result:
    print(f'Thread encontrada: {result[0]}')
    try:
        checkpoint_data = pickle.loads(result[1])
        print(f'Checkpoint keys: {list(checkpoint_data.keys())}')
        
        channel_values = checkpoint_data.get('channel_values', {})
        print(f'Channel values keys: {list(channel_values.keys())}')
        
        messages = channel_values.get('messages', [])
        print(f'Messages count: {len(messages)}')
        
        for i, msg in enumerate(messages[-3:]):  # Last 3 messages
            print(f'Message {i}: type={type(msg)}, content preview={str(msg)[:100]}')
            if hasattr(msg, 'content'):
                print(f'  Content: {msg.content[:100]}')
            if hasattr(msg, 'type'):
                print(f'  Type: {msg.type}')
                
    except Exception as e:
        print(f'Erro ao processar checkpoint: {e}')
else:
    print('Nenhuma thread encontrada')
    
conn.close()
