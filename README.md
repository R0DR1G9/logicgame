# The Logic Escape

Escape room 3D em primeira pessoa, feito para o navegador, em que cada sala só abre para quem resolve um desafio de Lógica Matemática. Cada partida sorteia desafios novos e você tem 10 minutos para sair das 5 salas.

## Como rodar

O jogo é estático. Na pasta do projeto, suba um servidor local e abra no navegador:

```
python3 -m http.server 8765
```

Depois acesse `http://localhost:8765/index.html`. Não precisa instalar nada, o Three.js já está em `vendor/`.

## Como jogar

- Objetivo: atravessar as 5 salas e sair antes de o tempo acabar.
- O relógio de 10 minutos vale para a partida inteira, nunca pausa e, se zerar, você perde e recomeça.
- Controles: W A S D ou setas para andar, mouse para olhar, Shift para correr, E ou clique para interagir, C para o caderno de pistas, H para dica, Esc para pausar.
- Os desafios mudam a cada partida. Nas salas 4 e 5, uma resposta errada trava o painel por alguns segundos, o que impede resolver por tentativa e erro.

## A lógica em cada sala

| Sala | Dificuldade | Conteúdo de lógica | Como entra na mecânica |
| --- | --- | --- | --- |
| 1 | Fácil | Conectivos e tabela-verdade | Avaliar uma fórmula para cada combinação de valores e preencher a tabela para validar o terminal |
| 2 | Intermediária | Dedução com premissas | Cruzar premissas sobre suspeitos para descobrir o culpado e formar o código do cofre |
| 3 | Pouco difícil | Tautologia, contradição, contingência, precedência e implicação lógica | Classificar 6 fórmulas pela tabela-verdade para expor o cadeado e depois julgar 5 implicações A ⇒ B para abri-lo |
| 4 | Difícil | Equivalências lógicas | Deduzir o estado das válvulas a partir de premissas e escolher a fórmula equivalente (De Morgan, contrapositiva, implicação material) |
| 5 | Muito difícil | Cavaleiros e mentirosos, tableaux semânticos e validade de argumentos | Três selos independentes: identificar quem diz a verdade, montar tableaux para decidir se conjuntos de fórmulas são satisfatíveis e separar argumentos válidos dos inválidos |

Todo o conteúdo do jogo é lógica proposicional, dentro das aulas 2 a 10 da disciplina.

## Desafios gerados por semente

Cada partida cria uma semente e, a partir dela, um conjunto completo de desafios (`js/logic/generator.js`). O gerador só aceita desafios com solução única, verificada por força bruta com o avaliador de fórmulas (`js/logic/evaluator.js`). O salvamento guarda apenas a semente e o prazo, e os desafios são regenerados de forma determinística ao continuar.

Para testar o gerador em massa:

```
node tests/generator.test.js 5000
```

## Estrutura

- `index.html`, `css/`: interface, menus, modais e HUD.
- `js/`: regras do jogo (estado, salvamento, fluxo, interface) e um módulo por sala em `js/rooms/`.
- `js/logic/`: avaliador de fórmulas e gerador de desafios.
- `js/game3d/`: motor 3D (cena, colisão, controles, texturas) e as salas em 3D.
- `vendor/`: Three.js.
- `tests/`: teste em massa do gerador.
