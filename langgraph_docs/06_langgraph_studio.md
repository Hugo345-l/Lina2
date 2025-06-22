# LangGraph Studio

O LangGraph Studio é um aplicativo de desktop para prototipagem e depuração de aplicações LangGraph localmente. Ele fornece uma interface visual para entender e interagir com seus grafos.

## Principais Funcionalidades

-   **Visualização de Grafo**: Veja a estrutura do seu grafo, incluindo nós e arestas.
-   **Inspeção de Estado**: Inspecione o estado do seu grafo em cada etapa da execução.
-   **Linha do Tempo de Execução**: Acompanhe a sequência de chamadas de nós.
-   **Depuração**: Pause, retome e edite o estado do grafo durante a execução.

## Como Usar

O LangGraph Studio se conecta a um servidor LangGraph em execução. Para usá-lo, você normalmente executa seu grafo LangGraph com um servidor (por exemplo, usando `langgraph-cli`) e, em seguida, aponta o Studio para o endpoint do servidor.

## Validação no Studio

O `PLANNING.md` do projeto Lina v2.0 enfatiza a validação de protótipos no LangGraph Studio. Os principais critérios de sucesso incluem:

-   Visualização correta do grafo.
-   Inspeção de estados em cada nó.
-   Análise da linha do tempo de execução para depurar o fluxo.

O Studio é uma ferramenta crucial para a Fase 0 e Fase 1 do projeto, garantindo que a arquitetura do grafo seja robusta e observável desde o início.
