# 🤖 Lina v2.0 - Assistente Pessoal Multi-Agente com LangGraph

**Transformando a interação com tecnologia de reativa em proativa.**

**Status Atual:** Fase 0 - Preparação e Aprendizado

Bem-vindo à segunda versão do Projeto Lina. Esta é uma refatoração completa do projeto original, com o objetivo de construir um assistente pessoal verdadeiramente proativo e inteligente. A nova arquitetura é baseada em **LangGraph** para orquestrar um sistema multi-agente robusto, modular e observável.

---

## 📚 **Documentação Essencial**

**🚨 LEITURA OBRIGATÓRIA**: Para compreender completamente o projeto Lina v2.0, é fundamental ler os seguintes documentos na ordem:

1.  **📋 [PLANNING.md](PLANNING.md)** - Contém a visão arquitetural completa, o roadmap detalhado das fases de desenvolvimento, e as decisões tecnológicas que guiam o projeto.
2.  **📝 [TASK.MD](TASK.MD)** - Uma cópia do roadmap para acompanhamento do estado atual das tarefas.
3.  **📖 [langgraph_docs/](langgraph_docs/)** - Documentação e notas de estudo sobre LangGraph e conceitos relacionados.

---

## 🎯 **O que é a Lina?**

A Lina representa uma nova abordagem para assistentes pessoais. Em vez de simplesmente reagir a comandos, ela é projetada para monitorar contextos, antecipar necessidades e oferecer suporte de forma proativa. O objetivo é criar um sistema que gerencia agendamentos, realiza pesquisas contextuais, auxilia em decisões, organiza tarefas e se comunica de forma inteligente, mantendo o usuário sempre no controle.

O diferencial da Lina está na sua capacidade de **antecipação e proatividade**, aprendendo com as interações para se tornar uma verdadeira parceira no dia a dia.

### **Filosofia e Princípios**

O projeto é guiado por cinco princípios essenciais:

1.  **Proatividade:** Transformar a experiência de reativa para colaborativa, com a tecnologia antecipando necessidades.
2.  **Inteligência Contextual:** Aprender com o comportamento do usuário para fornecer insights e ações relevantes.
3.  **Privacidade e Controle:** Manter os dados do usuário locais por padrão, com controle total sobre a informação.
4.  **Eficiência Econômica:** Desenvolver com um orçamento consciente, forçando decisões inteligentes sobre o uso de tecnologia.
5.  **Arquitetura Modular:** Construir um sistema preparado para crescer e adicionar novas capacidades de forma orgânica.

---

## 🏗️ **Nova Arquitetura: O Grafo de Agentes**

A Lina v2.0 está sendo construída com uma filosofia "backend-first", onde a prioridade é desenvolver um grafo de agentes sólido e confiável. A interface de usuário inicial para depuração e interação será o **LangGraph Studio**.

A arquitetura é baseada em três grupos principais de agentes (nós no grafo), orquestrados por um **Supervisor**:

1.  **Lina-Front:** Responsável pela interação com o usuário, interpretação de intenções e formatação de respostas.
2.  **Lina-Memory:** O cérebro do sistema, gerenciando a memória de curto e longo prazo e aprendendo com as interações.
3.  **Lina-Tools:** O executor de tarefas, conectando-se a diversas ferramentas (MCPs) para realizar ações no mundo real.

Este design modular permite que o sistema escolha o melhor caminho para cada requisição, otimizando custo e performance.

---

## 🚀 **Estado Atual do Projeto (Fase 0)**

Atualmente, o projeto está na fase de estudo e prototipagem. Os objetivos desta fase são:

-   **Estudo Aprofundado:** Entender os padrões de design do LangGraph.
-   **Prototipagem Conceitual:** Criar um grafo experimental para validar os conceitos da arquitetura.
-   **Validação:** Garantir que a tecnologia escolhida atende às necessidades de observabilidade e depuração.

**Não há um backend funcional ou frontend neste momento.** O foco é puramente em pesquisa e desenvolvimento no ambiente LangGraph.

---

## 📁 **Mapa do Repositório**

```
Lina2/
├── 📋 PLANNING.md              # Visão completa e arquitetura do projeto
├── 📝 TASK.MD                  # Roadmap detalhado para acompanhamento
├── 📖 README.md                # Este arquivo (visão geral)
├── ⚙️ requirements.txt         # Dependências Python do projeto
├── 🗃️ .gitignore              # Arquivos ignorados pelo Git
│
├── 📚 langgraph_docs/         # Documentação e estudos sobre LangGraph
│
├── 🔧 scripts/                 # Scripts utilitários para desenvolvimento
│   └── 🧪 test_openrouter.py  # Teste de conectividade com OpenRouter
│
├── 🗑️ legacy/                  # Código da versão anterior (ignorado)
│   ├── 🚀 run_lina.bat        # Antigo script de execução
│   ├── 🎨 lina-frontend/     # Antiga interface web
│   └── 🔧 lina-backend/      # Antigo backend LangServe
│
└── 🐍 venv-lina/               # Ambiente virtual Python (ignorado)
```

---

## 💻 **Como Começar (Ambiente de Experimentação)**

### **📋 Pré-requisitos**
- Python 3.12+
- Conta no OpenRouter com uma API key
- Git para clonar o repositório

### **⚙️ Instalação**
```bash
# 1. Clonar o repositório (se ainda não o fez)
git clone <repository-url>
cd Lina2

# 2. Criar e ativar o ambiente virtual
python -m venv venv-lina
# Windows
venv-lina\Scripts\activate
# Linux/Mac
# source venv-lina/bin/activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar variáveis de ambiente
# Crie um arquivo .env na raiz do projeto com o seguinte conteúdo:
OPENROUTER_API_KEY="sua_chave_de_api_do_openrouter"
# LANGCHAIN_API_KEY="sua_chave_de_api_do_langsmith" # Opcional, para tracing
```

### **🧪 Executando Experimentos**

Nesta fase, não há um servidor principal para rodar. A execução consiste em rodar os scripts de prototipagem que serão criados.

Utilize o script em `scripts/test_openrouter.py` para validar sua conexão com a API do OpenRouter.
