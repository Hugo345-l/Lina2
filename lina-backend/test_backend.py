#!/usr/bin/env python3
"""
Script de teste para o backend LangServe da Lina
Testa os endpoints e valida o funcionamento
"""

import requests
import json
import time

# Configurações
BASE_URL = "http://localhost:8000"
HEADERS = {"Content-Type": "application/json;charset=utf-8"} # Adicionado charset=utf-8

def test_health():
    """Testa o endpoint de health check"""
    print("🏥 Testando Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        response.raise_for_status() # Levanta exceção para status HTTP 4xx/5xx
        print(f"Status: {response.status_code}")
        print(f"Resposta: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Erro no Health Check: {e}")
        return False

def test_simple_endpoint():
    """Testa o endpoint /test personalizado"""
    print("\n🧪 Testando endpoint /test...")
    try:
        payload = {"input": "Olá, Lina! Como você está?"}
        response = requests.post(f"{BASE_URL}/test", json=payload, headers=HEADERS)
        response.raise_for_status()
        print(f"Status: {response.status_code}")
        print(f"Resposta: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Erro no endpoint /test: {e}")
        return False

def test_langserve_invoke():
    """Testa o endpoint LangServe /chat/invoke"""
    print("\n💬 Testando LangServe /chat/invoke...")
    try:
        # Novo formato de payload aninhado, conforme a hipótese
        payload = {
            "input": { # Chave "input" externa exigida pelo LangServe para o input da chain
                "input": "Olá, Lina! 10 é maior que 9?" # Objeto ChatInput
            }
        }
        
        response = requests.post(f"{BASE_URL}/chat/invoke", json=payload, headers=HEADERS)
        response.raise_for_status()
        print(f"Status: {response.status_code}")
        
        result = response.json()
        # A resposta de invoke é {"output": "string_da_Lina", "metadata": {...}}
        print(f"Resposta da Lina (output): {result.get('output')}") 
        # print(f"Resposta completa: {result}") # Para debug
            
        return response.status_code == 200 and "output" in result
    except Exception as e:
        print(f"❌ Erro no /chat/invoke: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                print(f"Detalhes do erro do servidor: {e.response.json()}")
            except json.JSONDecodeError:
                print(f"Detalhes do erro do servidor (não JSON): {e.response.text}")
        return False

def test_langserve_stream():
    """Testa o endpoint de streaming"""
    print("\n🌊 Testando LangServe /chat/stream...")
    try:
        # Novo formato de payload aninhado
        payload = {
            "input": { # Chave "input" externa
                "input": "Qual é a resposta pra vida o universo e tudo mais?" # Objeto ChatInput
            }
        }
        
        full_response_content = ""
        with requests.post(
            f"{BASE_URL}/chat/stream", 
            json=payload, 
            headers=HEADERS, # Headers podem não ser estritamente necessários para stream com requests, mas não prejudica
            stream=True
        ) as response:
            response.raise_for_status()
            print(f"Status: {response.status_code}")
            print("Resposta streaming:")
            for line in response.iter_lines():
                if line:
                    # Formato SSE: event: data\ndata: {"content": "chunk"}\n\nevent: metadata\ndata: {"run_id": ...}
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith("data:"):
                        data_json_str = decoded_line[len("data:"):].strip()
                        if data_json_str: # Evita erro se for apenas "data: " ou linha vazia após data:
                            try:
                                # Para StrOutputParser, LangServe envia o chunk de string como uma string JSON.
                                # Ex: data: "Olá " (o valor é a string "Olá ", não um objeto JSON)
                                chunk = json.loads(data_json_str)
                                if isinstance(chunk, str):
                                    print(chunk, end="", flush=True)
                                    full_response_content += chunk
                                # O LangServe também pode enviar outros tipos de eventos em dicts,
                                # como metadados ou erros, que não seriam 'str' diretamente.
                                # elif isinstance(chunk, dict) and chunk.get("event") == "metadata":
                                #     print(f"\n[METADATA: {chunk.get('data')}]\n")
                                # else:
                                #     print(f"\n[Received other data object: {chunk}]\n")

                            except json.JSONDecodeError:
                                # Isso pode acontecer se a linha não for um JSON válido.
                                # print(f"\n[Stream Parse Error] Não foi possível decodificar JSON: '{data_json_str}'\n")
                                pass # Ignora linhas que não são JSON válido, podem ser comentários ou linhas vazias no stream SSE
            print("\n--- Fim do Stream ---")
            
        return response.status_code == 200 and len(full_response_content) > 0
    except Exception as e:
        print(f"❌ Erro no /chat/stream: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                print(f"Detalhes do erro do servidor: {e.response.json()}")
            except json.JSONDecodeError:
                print(f"Detalhes do erro do servidor (não JSON): {e.response.text}")
        return False

def main():
    """Executa todos os testes"""
    print("🚀 Iniciando testes do Lina Backend\n")
    
    print("⏳ Aguardando servidor Uvicorn reiniciar completamente...")
    time.sleep(5) # Aumentado para dar mais tempo ao reload
    
    tests = [
        ("Health Check", test_health),
        ("Endpoint /test", test_simple_endpoint),
        ("LangServe /chat/invoke", test_langserve_invoke),
        ("LangServe /chat/stream", test_langserve_stream)
    ]
    
    results = []
    all_passed = True
    for test_name, test_func in tests:
        success = test_func()
        results.append((test_name, success))
        if not success:
            all_passed = False
        
    print("\n" + "="*50)
    print("📊 RESUMO DOS TESTES")
    print("="*50)
    
    for test_name, success in results:
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"{test_name}: {status}")
    
    total_passed = sum(1 for _, success in results if success)
    print(f"\nTotal: {total_passed}/{len(results)} testes passaram.")
    
    if all_passed:
        print("\n🎉 Todos os testes passaram! Backend parece estar funcionando corretamente.")
    else:
        print("\n⚠️ Alguns testes falharam. Verifique os logs e as configurações.")

if __name__ == "__main__":
    main()
