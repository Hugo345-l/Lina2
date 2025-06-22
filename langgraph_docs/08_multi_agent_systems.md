# Multi-agent Systems - LangGraph Official Documentation

## Visão Geral

Um [agente](./agentic_concepts.md#agent-architectures) é _um sistema que usa um LLM para decidir o fluxo de controle de uma aplicação_. À medida que esses sistemas se tornam mais complexos, pode ser necessário dividi-los em múltiplos agentes menores e independentes, compondo-os em um **sistema multi-agente**.

## Benefícios dos Sistemas Multi-Agente

- **Modularidade**: Agentes separados facilitam desenvolvimento, teste e manutenção
- **Especialização**: Agentes especializados focados em domínios específicos
- **Controle**: Controle explícito sobre como os agentes se comunicam

## Arquiteturas Multi-Agente

### 1. Network (Rede)
Cada agente pode se comunicar com todos os outros agentes (conexões muitos-para-muitos).

### 2. Supervisor 
Cada agente se comunica com um único agente supervisor que decide qual agente deve ser chamado a seguir.

### 3. Supervisor (tool-calling)
Caso especial da arquitetura supervisor onde agentes individuais são representados como ferramentas.

### 4. Hierarchical (Hierárquica)
Sistema multi-agente com supervisor de supervisores - generalização da arquitetura supervisor.

### 5. Custom Multi-agent Workflow
Cada agente se comunica apenas com um subconjunto de agentes, com fluxo parcialmente determinístico.

## Handoffs (Transferências)

Padrão comum nas interações multi-agente onde um agente *transfere* controle para outro.

**Handoffs permitem especificar:**
- **destination**: agente alvo para navegar
- **payload**: informação a passar para esse agente

**Implementação em LangGraph:**

```python
def agent(state) -> Command[Literal["agent", "another_agent"]]:
    goto = get_next_agent(...)  # 'agent' / 'another_agent'
    return Command(
        # Especifica qual agente chamar a seguir
        goto=goto,
        # Atualiza o estado do grafo
        update={"my_state_key": "my_state_value"}
    )
```

### Handoffs como Ferramentas

```python
from langchain_core.tools import tool

def transfer_to_bob():
    """Transfer to bob."""
    return Command(
        goto="bob",
        update={"my_state_key": "my_state_value"},
        graph=Command.PARENT,
    )
```

## Exemplo: Arquitetura Supervisor

```python
from typing import Literal
from langchain_openai import ChatOpenAI
from langgraph.types import Command
from langgraph.graph import StateGraph, MessagesState, START, END

model = ChatOpenAI()

def supervisor(state: MessagesState) -> Command[Literal["agent_1", "agent_2", END]]:
    response = model.invoke(...)
    return Command(goto=response["next_agent"])

def agent_1(state: MessagesState) -> Command[Literal["supervisor"]]:
    response = model.invoke(...)
    return Command(
        goto="supervisor",
        update={"messages": [response]},
    )

def agent_2(state: MessagesState) -> Command[Literal["supervisor"]]:
    response = model.invoke(...)
    return Command(
        goto="supervisor",
        update={"messages": [response]},
    )

builder = StateGraph(MessagesState)
builder.add_node(supervisor)
builder.add_node(agent_1)
builder.add_node(agent_2)
builder.add_edge(START, "supervisor")

supervisor = builder.compile()
```

## Comunicação e Gerenciamento de Estado

### Considerações Importantes:

1. **Handoffs vs Tool Calls**: Como os agentes se comunicam?
2. **Passagem de Mensagens**: Que mensagens são passadas entre agentes?
3. **Representação de Handoffs**: Como representar transferências no histórico?
4. **Gerenciamento de Estado**: Como gerenciar estado para sub-agentes?

### Compartilhamento de Informações

**Opção 1: Compartilhar Processo Completo**
- Agentes compartilham todo o histórico do processo de pensamento
- Benefício: Outros agentes podem tomar melhores decisões
- Desvantagem: "Scratchpad" cresce rapidamente

**Opção 2: Compartilhar Apenas Resultados Finais**
- Agentes têm "scratchpad" privado e compartilham apenas resultado final
- Melhor para sistemas com muitos agentes ou agentes complexos

### Schemas de Estado Diferentes

Um agente pode precisar de um schema de estado diferente:

1. **Subgrafos** com schema de estado separado
2. **Funções de nó de agente** com schema de entrada privado

## Próximos Passos

- [Tutorial Supervisor](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/agent_supervisor/)
- [Multi-agent Collaboration](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/multi-agent-collaboration/)
- [Hierarchical Agent Teams](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/hierarchical_agent_teams/)

---

*Baseado na documentação oficial do LangGraph - repositório clonado localmente*
