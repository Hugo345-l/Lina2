import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Carrega as variáveis de ambiente do arquivo .env (ou .env.keys no seu caso)
# Tenta carregar explicitamente o arquivo .env.keys
dotenv_path = '.env.keys'
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
    print(f"Arquivo {dotenv_path} carregado.")
else:
    # Tenta carregar o .env padrão como fallback
    load_dotenv()
    print("Tentando carregar .env padrão.")


# Obtém a chave da API do OpenRouter das variáveis de ambiente
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

if not openrouter_api_key:
    print("Erro: A variável de ambiente OPENROUTER_API_KEY não foi encontrada.")
    print("Certifique-se de que ela está definida no seu arquivo .env.keys")
else:
    try:
        model_to_test = "google/gemini-2.5-flash-preview-05-20"
        llm = ChatOpenAI(
            model=model_to_test,
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=openrouter_api_key
        )

        print(f"Tentando se comunicar com o modelo: {model_to_test} via OpenRouter...")
        
        # Teste simples de invocação
        response = llm.invoke("Olá, mundo! Qual é a capital da França?")
        
        print("\nResposta do modelo:")
        print(response.content)
        print("\nTeste de comunicação com OpenRouter concluído com sucesso!")

    except Exception as e:
        print(f"Ocorreu um erro durante o teste de comunicação com o OpenRouter:")
        print(e)
