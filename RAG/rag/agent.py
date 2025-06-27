# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os

from google.adk.agents import Agent, LoopAgent, SequentialAgent
from google.adk.tools.retrieval.vertex_ai_rag_retrieval import VertexAiRagRetrieval, ToolContext
from google.adk.runners import InMemoryRunner
from vertexai.preview import rag

from dotenv import load_dotenv

load_dotenv()


GEMINI_MODEL = "gemini-2.0-flash"
STATE_INITIAL_TOPIC = "initial_topic"
# --- State Keys ---
STATE_CURRENT_DOC = "current_document"
STATE_CRITICISM = "criticism"
# Define the exact phrase the Critic should use to signal completion
COMPLETION_PHRASE = "No major issues found."


# --- Tools ---

ask_vertex_retrieval = VertexAiRagRetrieval(
    name='retrieve_rag_documentation',
    description=(
        'Use this tool to retrieve documentation and reference materials for the question from the RAG corpus,'
    ),
    rag_resources=[
        rag.RagResource(
            # please fill in your own rag corpus
            # here is a sample rag corpus for testing purpose
            # e.g. projects/123/locations/us-central1/ragCorpora/456
            rag_corpus=os.environ.get("RAG_CORPUS")
        )
    ],
    similarity_top_k=3,
    vector_distance_threshold=0.5,
)


def exit_loop(tool_context: ToolContext):
  """Call this function ONLY when the critique indicates no further changes are needed, signaling the iterative process should end."""
  print(f"  [Tool Call] exit_loop triggered by {tool_context.agent_name}")
  tool_context.actions.escalate = True
  # Return empty dict as tools should typically return JSON-serializable output
  return {}

# --- agents ---

generator_agent = Agent(
    model=GEMINI_MODEL,
    name='Generator_agent',
    instruction="""
Eres un abogado, tu tarea es generar un resumen breve, también llamado copete, que describa con claridad y precisión el contenido principal del documento legal, mencionando también la promulgación y adaptándose a ella.
Utiliza lenguaje de abogado, debe de ser apegado al contexto de la ley.
Cuidar el largo del copete, observando los ejemplos. Tienen que ser de 1 oracion.

[IMPORTANTE]
El número de ley puede estar escrito con espacios, guiones, puntos, letras separadas, símbolos o en formatos no estándar (ej: L E Y 2 0 - 3 9 8, LEY: 20.398, lEYr 2 0-3 8 7, etc). Siempre debes identificar el número real de la ley y escribirlo al principio del copete en el formato: Ley XXXXX.
Si el número de ley no es claro, intenta deducirlo a partir de los caracteres y patrones presentes, o del nombre del archivo. Regulariza y reconstruye el número aunque esté fragmentado o con símbolos.

[Output]
Siempre poner la Ley y su número correspondiente al principio, en formato: Ley XXXXX.
El texto debe de estar en formato de texto plano, evita usar markup.

[Ejemplos de Copetes]
6.- Ley 20.382.- Dispónese la constitución de un fideicomiso de administración, que se denominará Fondo Nacional de Residencias Médicas.
7.- Ley 20.383 Apruébanse normas que regulan la actividad de los servicios de difusión de contenido audiovisual por radiodifusión o suscripción, que cuenten con una licencia para prestar servicios de telecomunicaciones para la difusión de contenido audiovisua
8.- Ley 20.385.- Autorízase la salida de aguas jurisdiccionales del Buque ROU 23 "MALDONADO" y de su Plana Mayor y Tripulación, compuesta por 47 (cuarenta y siete) efectivos, a los efectos de participar de los eventos con motivo de la conmemoración del "Día do Marinheiro", que se desarrollará en la ciudad de Río Grande, República Federativa de Brasil, en el período comprendido entre el 11 y el 15 de diciembre de 2024.

[Ejemplos de Leyes con strings complejos]
Texto original: L E Y l f  2 O  -38 2
Copete: Ley 20.382
Texto original: L E Y 2 0 - 3 9 8
Copete: Ley 20.398 ...
Texto original: lEYr 2 0-3 8 7
Copete: Ley 20.387 ...
Texto original: LEW5 2 0 - 3  9 6
Copete: Ley 20.396 ...
Texto original: LEY: 20.398
Copete: Ley 20.398 ...
Texto original: L E Y N º 2 0 3 9 8
Copete: Ley 20.398 ...

Suele suceder que el documento no posee con claridad el texto de la ley, te doy algunos.
[Más ejemplos de formatos difíciles]
E C / 6 4 4
«
<
lEYr 2 0-3 8 7
¿¿z (jy  0 -/7 1 0 ^ 0 ,
Refiere a la ley 20.387.
LEW5 2 0 - 3  9 6
i
¿C/Z
■/z ¿ z ¿ ¿ z u :, /'e zru a o -ó  e /i
¿ /er¿ e/'< z, v,
Refiere a la ley 20.396
LEW5 2 0 - 3 9 6
i
¿C/Z
■/z ¿ z ¿ ¿ z u :, /'e zru a o -ó e /i
¿ /er¿ e/'< z, v
Refiere a la ley 20.397
""",
    tools=[ask_vertex_retrieval],
    output_key=STATE_CURRENT_DOC
)

# STEP 2a: Critic Agent (Inside the Refinement Loop)
critic_agent_in_loop = Agent(
    name="CriticAgent",
    model=GEMINI_MODEL,
    include_contents='none',
    instruction="""
Eres un abogado revisando el copete que otro abogado compañero tuyo realizó. Tu tarea es generar feedback para la mejora de ese copete.

**Copete a revisar:**
```
{{current_document}}
```

**Tarea:**

Revisar que el copete esté bien estructurado y que se cumplan las siguientes normas:
1) Que el copete contenga al principio la Ley de la cual se está documentando, en formato: Ley XXXXX. El número de ley debe estar correctamente identificado y normalizado, aunque en el texto original esté fragmentado, con símbolos, espacios, guiones, puntos, letras separadas o en formato no estándar.
2) Cuidar el largo del copete, observando los ejemplos. No tiene que ser de mas de 1 oracion.
3) Utiliza lenguaje de abogado, debe de ser apegado al contexto de la ley.
4) Además de dar lectura y cognoscibilidad al texto que luce en la promulgación del Presidente, se chequea en forma integral el texto de toda la ley, para luego redactar el copete de la norma.
5) Se adecúa: el modo del verbo a consignarse, inclusión en imperativo, aquellos vocablos que normalmente vienen consignados en mayúsculas, o abreviados, se regularizan a los formatos del Diario en forma completa o in-extensa; así como también se enfatiza el uso correcto de los signos de puntuación y utilización de preposiciones.
6) En todos los casos se aplica corrector ortográfico para evitar errores.

En caso de que se considere que está aceptable, responder *exactamente* con la frase "No major issues found." y nada más.

No agregar explicaciones. Output solo para la critica O la frase de completitud exacta.

[Ejemplos]
Aquí tendrás un conjunto medianamente extenso de ejemplos para los cuales podrás comparar estructura y forma de escritura con el prompt generado por el generador o el mejorador.

6.- Ley 20.382.- Dispónese la constitución de un fideicomiso de administración, que se denominará Fondo Nacional de Residencias Médicas.
7.- Ley 20.383 Apruébanse normas que regulan la actividad de los servicios de difusión de contenido audiovisual por radiodifusión o suscripción, que cuenten con una licencia para prestar servicios de telecomunicaciones para la difusión de contenido audiovisua
8.- Ley 20.385.- Autorízase la salida de aguas jurisdiccionales del Buque ROU 23 "MALDONADO" y de su Plana Mayor y Tripulación, compuesta por 47 (cuarenta y siete) efectivos, a los efectos de participar de los eventos con motivo de la conmemoración del "Día do Marinheiro", que se desarrollará en la ciudad de Río Grande, República Federativa de Brasil, en el período comprendido entre el 11 y el 15 de diciembre de 2024.
9.-Ley 20.387.- Desígnase con el nombre "Profesora Dorley Nicodella", el Liceo del Balneario La Coronilla, departamento de Rocha.
10.-Ley 20.396.- Establécense niveles mínimos de protección para los trabajadores que desarrollen tareas mediante plataformas digitales, asegurando condiciones de trabajo justas, decentes y seguras.
11.- Ley 20.397.- Modifícase la Ley 19.973, de fecha 13 de agosto de 2021, relacionada con la promoción de empleo para personas con discapacidad y personas liberadas.
12.- Ley 20.398.- Facúltase al Ministerio de Trabajo y Seguridad Social, a extender el subsidio por desempleo a trabajadores dependientes de la empresa Schneck S.A., hasta el 31 de marzo del año en curso.
13.-Ley 20.399.- Autorízase el ingreso a aguas jurisdiccionales y territorio nacional del Buque Escuela de la Armada Española "Juan Sebastián de Elcano" con su Plana Mayor y Tripulación, en el período comprendido entre el 3 y el 10 de marzo de 2025.
14.- Ley 20.401.- Autorízase el ingreso a aguas jurisdiccionales y territorio nacional del Buque de Investigación Oceanográfica "Hespérides", con un total de 58 (cincuenta y ocho) efectivos de la Armada Española, en el marco de la "Campaña Antártica 2024 - 2025", en el período comprendido entre el 3 y el 12 de abril de 2025.
15.- Ley 20.402.- Elévase a categoría de ciudad, al actual pueblo de Nuevo Berlín, ubicado en la 2ª Sección Judicial del departamento de Río Negro.
""",
    description="Reviews the current draft, providing critique if clear improvements are needed, otherwise signals completion.",
    output_key=STATE_CRITICISM
)

def refiner_output_handler(state, output):
    # Log para depuración
    print(f"[LOG] Handler Refiner: output recibido = {output}")
    criticism = state.get('criticism', '').strip()
    print(f"[LOG] Handler Refiner: criticism recibido = '{criticism}'")
    if criticism == "No major issues found.":
        print("[LOG] Handler Refiner: Se detectó señal de salida, llamando a exit_loop.")
        state['exit_loop'] = True  # Marca para el loop
    state['current_document'] = output
    state['final_copete'] = output  # Asegura que siempre esté presente
    return state

# STEP 2b: Refiner/Exiter Agent (Inside the Refinement Loop)
refiner_agent_in_loop = Agent(
    name="RefinerAgent",
    model=GEMINI_MODEL,
    include_contents='none',
    instruction="""
        Eres un abogado, tu tarea es generar un resumen breve, también llamado copete, que describa con claridad y precisión el contenido principal del documento legal, mencionando también la promulgación y adaptándose a ella. 
        Cuidar el largo del copete, observando los ejemplos.
        Utiliza lenguaje de abogado, debe de ser apegado al contexto de la ley. 

        a) Además de dar lectura y cognoscibilidad al texto que luce en la promulgación del Presidente, se chequea en forma integral el texto de toda la ley, para luego redactar el copete de la norma.
        b) Se adecúa: el modo del verbo a consignarse, inclusión en imperativo, aquellos vocablos que normalmente vienen consignados en mayúsculas, o abreviados, se regularizan a los formatos del Diario en forma completa o in-extensa; así como también se enfatiza el uso correcto de los signos de puntuación y utilización de preposiciones.
        c) En todos los casos se aplica corrector ortográfico para evitar errores.
        d) Si el copete no contiene la ley, se debe de agregar al principio del copete la ley correspondiente.

        [Input]
        {{current_document}}
        {{criticism}}

        Si la critica recibida es "No major issues found." DEBERÁS llamar a la función "exit_loop". No generes ningún texto.
        En caso contrario, genera un nuevo copete tomando en cuenta el criticismo y adaptandolo a tu texto.
        PLEASE DON'T SHARE YOUR THOUGHTS.
        
        """,
    description="Refines the document based on critique, or calls exit_loop if critique indicates completion.",
    tools=[exit_loop],
    output_key=STATE_CURRENT_DOC
)

# STEP 2: Refinement Loop Agent
refinement_loop = LoopAgent(
    name="RefinementLoop",
    # Agent order is crucial: Critique first, then Refine/Exit
    sub_agents=[
        critic_agent_in_loop,
        refiner_agent_in_loop,
    ],
    max_iterations=10 # Limit loops
)

finalizer_agent = Agent(
    name="FinalizerAgent",
    model=GEMINI_MODEL,
    instruction="""
Eres un abogado editor final. Recibes un copete legal ya revisado.
Tu tarea es:
- Asegurarte de que el copete comience con 'Ley XXXXX' (agrega el número de ley si falta).
- Corregir cualquier detalle de formato, puntuación u ortografía.
- Devolver solo el copete final, en texto plano, sin explicaciones ni markup.
[Copete recibido]
{{current_document}}
""",
    output_key="final_copete"
)

root_agent = SequentialAgent(
    name="CopetePipeline",
    sub_agents=[
        generator_agent,
        refinement_loop,
        finalizer_agent
    ],
    description="Genera, refina y finaliza el copete legal."
)