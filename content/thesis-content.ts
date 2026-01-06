// Thesis content - Auto-generated from PDF extraction
// This file was generated automatically. Manual edits may be overwritten.

export interface ThesisContent {
  hero: {
    title: string;
    subtitle?: string;
    author: string;
    university: string;
    date: string;
    department?: string;
  };
  abstract: {
    title: string;
    content: string;
  };
  introduction: {
    title: string;
    content: (string | { type: 'image'; src: string; alt: string; caption?: string })[];
  };
  methodology: {
    title: string;
    content: (string | { type: 'image'; src: string; alt: string; caption?: string })[];
  };
  results: {
    title: string;
    content: string[];
  };
  conclusions: {
    title: string;
    content: (string | { type: 'image'; src: string; alt: string; caption?: string })[];
  };
  downloads: {
    title: string;
    thesisPdf: string;
    presentationPptx: string;
    frameworkGitHub?: string;
  };
  contact: {
    title: string;
    name: string;
    email: string;
    university?: string;
    department?: string;
  };
  challengeSolution: {
    title: string;
    problems: {
      title: string;
      description: string;
    }[];
    solution: {
      title: string;
      description: string;
      keyPoints: string[];
    };
    researchQuestions: {
      id: string;
      question: string;
      description: string;
    }[];
  };
  technicalDeepDive: {
    title: string;
    quantization: {
      title: string;
      description: string;
      ptq: {
        title: string;
        description: string;
      };
      qat: {
        title: string;
        description: string;
      };
    };
    ragVsHyde: {
      title: string;
      description: string;
      ragImage?: string;
      hydeImage?: string;
    };
    energyEfficiency: {
      title: string;
      description: string;
      cpuVsGpu: string;
    };
  };
  resultsData: {
    title: string;
    keyTakeaway: string;
    energyVsCorrectness: {
      title: string;
      description: string;
      data: {
        version: string;
        energy: number;
        correctness: number;
        color: string;
      }[];
    };
    performanceComparison: {
      title: string;
      description: string;
      models: {
        name: string;
        parameters: string;
        accuracy: number;
        energy: number;
        color: string;
      }[];
    };
    energyDistribution: {
      title: string;
      description: string;
      data: {
        version: string;
        cpu: number;
        gpu: number;
      }[];
    };
  };
  resourcesAuthor: {
    title: string;
    author: {
      name: string;
      bio: string;
      email: string;
      linkedin?: string;
      github?: string;
    };
    downloads: {
      title: string;
      items: {
        label: string;
        description: string;
        href: string;
        type: 'pdf' | 'pptx' | 'github' | 'bibtex';
      }[];
    };
  };
}

export const thesisContent: ThesisContent = {
  hero: {
    title: "An Adaptive Query-Routing Framework for Optimizing Small Language Models in Resource-Constrained Environments",
    subtitle: "Dissertação apresentada ao IADE - Faculdade de Design, Tecnologia e Comunicação da Universidade Europeia, para cumprimento dos requisitos necessários à obtenção do grau de Mestre em Creative Computing and Artificial Intelligence",
    author: "José Pedro Farinha Ribeiro",
    university: "IADE - Faculdade de Design, Tecnologia e Comunicação da Universidade Europeia",
    date: "2025",
    department: "Mestre em Creative Computing and Artificial Intelligence",
  },
  abstract: {
    title: "Abstract",
    content: "As the computational and financial costs of state-of-the-art large language models (LLMs) continue to grow, deploying them becomes harder for resource-constrained organizations as improvement methods such as Retrieval-Augmented Generation (RAG), Chain-of-Thought (CoT), HyDE, and related techniques enhance quality but incur variable overheads. This work presents a dynamic query-routing framework, in which a compact LLM (8B parameters) is paired with an adaptive controller that selects from three routes per query: direct answer, CoT or, RAG. Therefore the controller builds on iterative prompt refinement, proceeding through six instruction designs that evolve from format-driven heuristics to profile-based classification, and employs a voting-style post-processor to ensure robust decision extraction. The proposed framework is evaluated on routing accuracy, end-to-end answer correctness, and detailed energy profiling (CPU and GPU) using a composite dataset that combines retrieval-heavy general-knowledge and reasoning-focused science questions (ARC-Easy and HotPotQA-style items), on a single-GPU workstation. Results show that profile-based prompts can improve routing balance: mature versions reach 85%+ answer accuracy on ARC-style queries while remaining much more energy efficient than larger models. Moreover, analyses show that incorrect answers consume more energy, and that instruction design shifts the energy burden between CPU-heavy retrieval and GPU-heavy reasoning. Consequently our results indicate that architectural control and prompt engineering can close the performance gap between small and mid-sized models while achieving significant efficiency gains and providing a practical path to high-quality IR and QA systems under tight resource constraints and data security requirements.",
  },
  introduction: {
    title: "Introduction",
    content: [  "Artificial Intelligence (AI) has revolutionized natural language processing (NLP) through the advent of Large Language Models (LLMs), which demonstrate exceptional capabilities in understanding and generating human-like language, with widespread applications across diverse industries. However, deploying these models in real-world, regulated environments presents substantial challenges.",
  "Organizations like banks, hospitals, and government offices are likely to handle sensitive information that should not exit their premise under strict data privacy laws like GDPR and CCPA. Legal restrictions like these inhibit the use of AI models that are often hosted on external servers, where there is limited transparency in data processing operations. Furthermore, the computational demands of LLMs make them prohibitively expensive for small and medium-sized enterprises (SMEs), which often lack access to high-performance hardware infrastructure.",
  { "type": "image", "src": "/images/figure_3_the_hessian_metrics_sensitivity_and_magnitude_value_of_weights_in_llms._the.png", "alt": "Figure 3: The Hessian metrics (sensitivity) and magnitude (value) of weights in LLMs. The weights of different layers in LLMs are characterized by bell-shaped distribution, accompanied by a few salient values.[24]", "caption": "Figure 3: The Hessian metrics (sensitivity) and magnitude (value) of weights in LLMs. The weights of different layers in LLMs are characterized by bell-shaped distribution, accompanied by a few salient values.[24]" },
  "Despite advancements such as model quantization and the development of lightweight LLMs, a major gap still remains in effectively adapting these models to specialized, domain-specific tasks under limited computational resources. Methods like Retrieval-Augmented Generation (RAG) and Hypothetical Document Embedding (HyDE) have emerged as strong contenders in the sense that they can integrate external knowledge into the models with ease. However, success in such applications largely relies on the quality of query rewriting and retrieval.",
  { "type": "image", "src": "/images/figure_20_the_skr_pipeline_and_its_component_interactions._52_.png", "alt": "Figure 20: The SKR Pipeline and its component interactions.[52]", "caption": "Figure 20: The SKR Pipeline and its component interactions.[52]" },
  "This thesis focuses on retrieval-based question answering in such contrained domains, leveraging query rewriting to improve relevance and reduce computational overhead. This is achieved by at first optimizing Small Language Models (SLMs) through advanced quantization techniques, which significantly reduce their computational and memory footprint. However, this approach introduces a critical challenge, that is the degradation in model performance and knowledge retention. To counter this effect, the system integrates a powerful Retrieval-Augmented-Generation (RAG) framework. This framework is not merely just add-on for external knowledge but it serves as a targeted mechanism to recover most of the performance lost during the quantization stage. By leveraging instructions optimization, and Chain-of-Thought reasoning, the RAG component ensures that the quantized SLM can access and effectively utilize precise, relevant information from external document.",
  "This thesis aims to optimize small language models (SLMs), explore the trade-offs between quantized and non-quantized models, investigate retrieval methods to enhance SLM performance, and outline directions for future research. SLM optimization will be approached by exploring recent techniques identified throughout the course of this work, with the goal of making these models more practical and resource-efficient. Analyzing the trade-offs between quantized and non-quantized models is an important step, as it will help determine whether future research should focus on quantizing larger models or on further refining smaller ones.",
  "Retrieval methods are a good way to achieve better performance on SMLs on tasks that normally would require training with more specific data-sets. Selecting an effective retrieval strategy is key to developing a lightweight, high-performing system.",
  { "type": "image", "src": "/images/page_64_image_1.png", "alt": "No Caption Detected" },
  "Model optimization may also include simple strategies such as query injection. These approaches will be evaluated to determine their usefulness and relevance to the overall objectives of the thesis.",
  "This research aims to answer the following key questions:",
  "RQ1: How can a system using smaller models still compete with larger ones in terms of performance and efficiency?",
  "RQ2: Can HyDE be applied to a system designed for efficiency?",
  "RQ3: What are the trade-offs among answer quality, inference latency, and energy consumption for each rewriting strategy?",
  "RQ4: Can an efficient approach still achieve high accuracy while remaining useful?"]
  },
  methodology: {
    title: "Methodology",
    content: [  "As more powerful models hit the market with more expensive requirements, finding a model that suits low-budget companies or entities is becoming harder. The problem occurs due to the gap in the performance of LMMs. LMMs with more tokens will always tend to have greater performance [8]. However, this performance could be increased with methods described previously like HyDE [40], RAG [35], CoT [67], CAG [43], RAGCache [44], SKR [52], and Contriever [49]. All of these methods aim to improve model performance, but they do so at the cost of increased computational overhead. This overhead is variable, meaning that depending on the method or combination of methods used, the system's requirements and consequently its energy consumption can change significantly. Since most of the studies are also on bigger models a new approach will be taken to see if the results are similar to the bigger models. The key points of the research are the efficiency and performance using some of the enhancing methods described above. These will be paired with a small LLM meaning less than 36B tokens.",
  "The use of Large Language Models (LLMs) in Information Retrieval (IR) systems has revolutionized the way people interact with and retrieve information. Traditionally IR systems, such as search engines, have evolved from term-based to neural network models, which are uniquely suited to detect semantic nuance and contextual hints. Nevertheless, such systems still pose challenges like query vagueness, data sparsity, and generation of responses that, although plausible, are actually incorrect. LLMs, with their remarkable ability in language generation, comprehension, and reasoning, offer a unmatched solution for the aforementioned challenges. Leveraging their huge pre-training on diverse text-based data, LLMs enhance various IR components like query rewriting, retrieval, reranking, and response generation and enable more precise, contextual, and user-centric search experience as shown in Figure 26.",
  "Breakthroughs in cutting-edge large language models (LLMs) LLaMA have exhibited the capability to accomplish demanding tasks and optimize information retrieval (IR) performance. These models have not just the capacity to de-modularize user queries and retrieve relevant documents but also render lengthy and human-sounding responses, thereby overcoming the limitations between traditional IR systems and the present user expectations.",
  "The proposed system will integrate a rewriter module that will be placed between the user query q and the retriever similar to [45], this will enable the injection of the retrieved documents as-well as the injection of instruction like CoT. This system works by first receiving the user query, which will be processed by the rewriter module. This module inserts an instruction inst that is used to determine the most suitable rewriting strategy to optimize the query. The instruction will prompt the LLM to evaluate which of the three approaches is the more suitable normal response, RAG, or Chain-of-Thought.",
  "If the models concludes that it can answer directly then the model proceeds to generate the answer without the need of a new generation, meaning only one hop. As for Chain-of-Thought, the approach works by injecting a command to try and force the model into thinking step by step to obtain the answer. The final approach is Retrieval-Augmented Generation (RAG), which is also the most complex. It begins by passing the query to a smaller model that generates an embedding representation of the query, aligned with a pre-embedded document collection. A similarity comparison is then performed to retrieve the most relevant documents based on this embedding space. Next, a rewriter is used to extract and pass only the most important parts of the retrieved documents, reducing the amount of irrelevant information passed to the model. Finally, a reranker prioritizes the most relevant documents so that they are presented first during the generation process. The last two aren't necessarily needed so they can be turned off as needed for more.",
  "The experiments were conducted on a high-performance workstation running windows 10, equipped with an Intel Core i7-13700KF processor, an NVIDIA RTX 4090 GPU, and 32 GB of DDR5 RAM operating at 6000 MHz. The software environment was managed using Python 3.12 within a virtual environment (.venv), ensuring isolation and reproducibility of dependencies. The main libraries required are PyTorch (with CUDA 12.6 support) and the Hugging Face Transformers library, which was used to download and run the deepseek-ai/DeepSeek-R1-Distill-Llama-8B LLM. To monitor the system performance and power consumption during model inference and other system requirements, HWInfo was employed. Additional Python libraries were installed as required to support the various aspects needed for the workflow. This setup provides a robust and efficient platform for running and evaluating the proposed system.",
  "This approach uses the initial model response as the final answer. It is designed for questions that are too simple to require more complex methods. From an efficiency standpoint, minimizing processing steps is desirable, and using the first response avoids redundant generation. As the simplest approach, it does not enhance the model's answer but provides a baseline for comparison.",
  "The Chain-of-Thought (CoT) approach enhances model performance by encouraging it to reason through the logical steps of a query. In some models, this can be achieved with simple prompts such as \"Please reason step by step, and put your final answer within a box.\", as seen with DeepSeek models [69]. Other models may require more elaborate and tailored prompts.",
  "This approach has been widely adopted to improve and enhance the reasoning capabilities of LLMs. One of the reasons for this adoption comes from the simple requirements since it doesn't need much change on already-built systems. This method has shown significant improvements in certain tasks that require logical thinking and contextual understanding. For instance, some benchmarks often use both with and without Chain-of-Thought prompting to show the direct impact of the on reasoning performance [70], [58]. The proposed system selects this option when the initial model response indicates that Chain-of-Thought reasoning is required. This method involves two inference steps: the first allows the LLM to assess whether CoT is necessary, and the second passes a modified query containing the appropriate instruction to prompt the model to reason through the problem. Finally the model answer the instruction that now contains a CoT instruction.",
  "This approach is used to retrieve documents or passages that are relevant to the user's query. This is done by embedding the user query into a vector, which is then compared to the vectors of stored documents. Based on a top-K similarity ranking, the most relevant documents are retrieved. These documents can then be refined by removing non-essential parts, aiming to make the resulting content as concise and relevant as possible. Following refinement, the documents may be reranked, as language models tend to focus more on the initial tokens in the input [71]. Similar to the Chain-of-Thought method, this approach also requires two hops: The first hop acts as a reflection step to determine whether the LLM deems document retrieval necessary; The second hops consists on passing the query as well as the retrieved documents to the LLM.",
  "The system has three possible approaches to choose from: Retrieval R, CoT C, and Straight answer S. Since only one of these approaches can be selected for a given query, a selection mechanism is required. This selection is performed using the model (M) and the content of the query (q), this is shown in Figure 29.",
  "Figure 28 presents the analysis prompt responsible for this selection. This instruction can be divided into two parts. The first part is responsible for the Straight Answer (S), it asks the model to respond directly to the query if it is confident it can do so correctly. This approach is not only the fastest as well as the simplest, as the system does not need to perform any additional steps to achieve the response. The second part of the prompt is responsible to induce the model into deciding between Retrieval (R) or CoT (C). This is done by asking the model if it would benefit from retrieval of documents. If the response is \"Yes\" then Retrieval process is triggered, and all subsequent steps such as reranking and refining are also executed. However, if the model's answer is 'No', the system interprets this as a lack of confidence in the initial response. To improve the quality of the final output, the system then forces the model to use Chain-of-Thought (CoT) reasoning.",
  "To translate the model's textual output into a definitive choice, the system employs a sophisticated post-processing and also voting mechanism rather than simply looking for a single keyword. This implementation is a critical part that enables the system to use a decision-making process robust and resilient to multiple formatting variations. The process unfolds as follows:",
  "1. Initial Cleaning: The raw output from the model is first decoded and also normalized to standardize characters and spacings. Any preliminary \"Chain-of-Thought\" reasoning, which is normally enclosed in special tags like \"</think>\", is stripped away to isolate the final answer.",
  "2. Check for a Direct Answer(early exit): Before classifying the need for retrieval, the system first checks if the model already provided the final answer on it's first analysis. It specifically looks for a \"\\boxed{...}\" pattern containing a single alphabetic character (e.g., \"\\boxed{A}\"). If this pattern is found, the system assumes it corresponds to strategy S. The process then halts immediately, returning the response as the final output. The 'method used' is set to 'none', indicating that no additional processing was necessary.",
  "3. A Voting System For Decision Making: Instead of a simple parse, the system incurs a scoring mechanism to \"vote\" on the best possible approach. It initializes counters for both R and C.",
  "4. Identifying Strong Signals: The code meticulously scans the output for high-confidence indicators. A \"\\boxed{1}\" pattern is considered a strong, explicit vote for R, adding a significant score of 100 points. Similarly, a \"\\boxed{2}\" is a strong vote for C.",
  "5. Identifying Secondary Signals: To enhance robustness and accuracy, the system also looks for secondary indicators. The presence of the word \"yes\"(case-insensitive) in the analysis also adds 100 points to the R counter. This ensures the model's intent is captured even when the model fails to use the precise boxed format.",
  "6. Final Decision: After analyzing the entire output, the approach with the highest accumulated score is chosen as the \"suggested method\". This multi-signal, voting-based mechanism makes the classification resilient to minor formatting errors from the model, thus prioritizing a correct interpretation over strict adherence to a single output format.",
  "The proposed validation framework is comprised of a three-stage process that is used to systematically differentiate between high-quality and problematic queries. This hybrid approach integrates automated analysis with a human-in-the-loop component.",
  "The data is ingested and categorized using a python script. The script then splits the queries into those that require retrieval and those that do not. Depending on the configuration, one of these two sets is selected for further processing. This set is then divided into batches of n queries, a value that can be configured in the settings. Each time the Alt key is pressed, a new batch is compiled and copied to the clipboard, ready to be pasted into the LLM chat. The generated batch already includes the appropriate instruction, tailored to the selected query type.",
  "The LLM analyzes the provided query and determines if the options are clear and the ground truth is correct, paying special attention to the number of correct options. If these prove to be correct then a Green Flag is assigned. This flag contains an emoji so the human supervisor can identified the queries easily. In this workflow, a Green Flag is treated as a definitive pass, meaning these queries are not further reviewed by the supervisor.",
  "A Red Flag, on the other hand, is assigned to any query that fails to meet the criteria for example, due to ambiguous wording or other inconsistencies. Unlike the Green Flag, a Red Flag does not automatically discard the query. Instead, it signals that the query requires human verification. Although the model provides an explanation for why the Red Flag was assigned, the final decision rests with the human supervisor.",
  "The human validator is instructed to only look at the Red Flags queries to maintain attention and reduce the number of queries a human needs to verify. The job of the validator falls into the verification of the LLM's justification for the Red Flag, this verification can lead to the validator doing some research on the query and the correctness of the expected output. In case a query fails this verification it is deemed unusable and gets removed from the dataset, a new one is added to it's place that passes this validation.",
  "The output of all the previous points are fully answerable queries that are free of ambiguity. This is used for two distinct datasets, the ARC-easy and the HotPotQA, the results are then joined to combine queries that require retrieval as well as those needing step-by-step reasoning. This new dataset is specially designed for systems that can decide what approach is required for the best possible outcome. However due to the lack of complexity of the ARC-easy queries this is more suited towards weaker than state-of-the-art, more around 32B tokens and lower.",
  "To compare the different components of the system, one important aspect is energy consumption. However, collecting this data on Windows is not straightforward. Due to hardware limitations, all measurements will be performed using software tools that query system components to report energy usage at a given moment. Starting with GPU the power consumption is collected using nvidia-smi [72], this tool acts as bridge that queries the GPU driver directly and converts the retrieved data into a useful unit, these data points are collected every 15ms, however due to driver overhead the real gap is around 50ms. The data collected according to Nvidia NVML [73] is related to TBP or total board power, meaning that the consumption of VRAM and all the necessary components to support the GPU die itself are included in that power measurement. This is important as the power consumption of VRAM is highly used by LLM's during inference. This data is collected directly by a purpose-built library that monitors GPU power draw. The power measurements are added directly into the JSONL file, which also contains the model's response and all relevant metadata for later analysis.",
  "The other power consumption metric is the CPU package. This measures the power used by the CPU chip itself, excluding any power consumed by supporting components such as voltage regulator modules (VRMs), the chipset, and other peripherals. Although it would be interesting to measure the full system power draw, this requires specific hardware that was not available for this project. This CPU package draw isn't super easy to obtain in a Windows system so the use of a proprietary tool called HWiNFO this tool offers a logging feature that creates a CSV with all the collected data, this collection is done every 20ms theoretically however in reality there are a lot of times where it takes more than that, but on average it takes 31ms.",
  "Because the CSV is generated by a third-party tool, it is only available at the end of the run when logging is manually stopped. To align energy data with query execution, a script is used to match each query's start and end times (from the previously mentioned JSONL file) with the corresponding timestamps in the CSV. All data points that fall within a query's time window are extracted. Using these points and their timestamps, the trapezoidal rule is applied to approximate the energy consumption. This method works by summing the areas of trapezoids under the power curve, providing an estimate of the integral of power over time (watts × time). This approach compensates for the irregular intervals in data retrieval by HWiNFO. The result is an estimate of energy consumption by the CPU package, expressed in watt-hours. This value is then added to the JSONL file, along with the total energy consumption calculated as the sum of the GPU's Total Board Power (TBP) and the CPU package power. GPU power usage is already recorded in the JSONL, and the trapezoidal rule is applied in real time during inference to account for variations in the intervals between data points.",
  { "type": "image", "src": "/images/figure_29_jsonl_data_structure.png", "alt": "Figure 29: Jsonl Data Structure", "caption": "Figure 29: Jsonl Data Structure" },
  "The evaluation framework may vary depending on the specific domain being tested. This is because some domains might require different metrics to understand the real capabilities of the model in a given task [74]. Another key point is the need to access each part individually as well as combined. This is key in accessing the quality of the system and understand which points could be improved for a better combined performance. One of the most important metrics across all components of the system is efficiency, as it helps to assess how each part contributes to the overall energy consumption. What will be compared and obtained is the following: System answers to full dataset. Straight model answers to full dataset. Forced CoT answers to full dataset. Forced Retrieval answers to just full dataset.",
  "The full dataset consists of 3000 queries, with 1312 originating from the ARC-Easy dataset and the remainder from the DragonBall dataset. The ARC-Easy dataset was selected because it primarily contains simple reasoning queries that the model can answer without relying on external knowledge, although a few questions do require more complex reasoning. The DragonBall dataset, on the other hand, was chosen because it mostly includes queries that necessitate retrieval, with some also requiring advanced reasoning to be answered correctly.",
  "Together, these datasets offer a comprehensive evaluation of the system's capabilities. Additionally, if the model under study is a larger one, the ARC-Easy portion can be replaced by ARC-Challenge, which features more complex queries that demand deeper reasoning than its simpler counterpart.",
  "Due to the nature of this work, the quality of the retrieval itself will not be evaluated, as it depends on the specific RAG method employed. Instead, the evaluation will focus on whether retrieval occurred when it was necessary. This will be represented as a binary outcome: 1 if retrieval was triggered, and 0 if not. However, what needs to be evaluated is a direct comparison between the energy consumption of the proposed system and that of a baseline that always performs retrieval. This comparison is important because the system requires two hops to decide whether to retrieve, whereas always retrieving eliminates the need for this decision-making step. However, since the dataset includes questions both with and without the need for retrieval, an evaluation will be conducted to determine whether the system results in lower energy consumption. This is based on the premise that retrieval is not necessary for every query, and the system may avoid unnecessary retrieval steps. The quality and correctness of the answer will also be evaluated. This is important because, in cases where retrieval is not necessary, the system may still retrieve documents from the database that are not directly relevant to the query. As a result, these retrieved passages may not contribute meaningfully to the answer.",
  { "type": "image", "src": "/images/figure_1_transformer_model_architecture_5_.png", "alt": "Figure 1: Transformer model architecture [5]", "caption": "Figure 1: Transformer model architecture [5]" },
  "This approach will be evaluated in multiple parts. The first aspect is whether the answer is correct specifically, whether the model's response matches the ground truth option. Next, the evaluation will check if the model correctly identified queries that should be answered without retrieval. This part is linked to the previous one: if the answer is correct without retrieval, the classification is also considered correct. Additionally, a comparison will be made between answers generated with and without forced Chain-of-Thought (CoT) prompting to determine whether the increased energy consumption associated with CoT leads to improved answers or if the same responses would have been provided without it. This will be done to understand if the model is guessing correctly wether it can answer the question directly or not. And will also provide consumption metrics that will be compared in order to understand its efficiency. CoT will tend to be more accurate but it also requires more energy due to the thinking phase of generation.",
  { "type": "image", "src": "/images/figure_4_illustration_of_salient_weight_binarization._the_b1_binarized_from_salient_weight_is.png", "alt": "Figure 4: Illustration of salient weight binarization. The B1 binarized from salient weight is made into a residual with the original value and then binarized again to obtain B2.[24]", "caption": "Figure 4: Illustration of salient weight binarization. The B1 binarized from salient weight is made into a residual with the original value and then binarized again to obtain B2.[24]" },
  "The metrics for CoT are the same as those used for the straight model, as both will be directly compared.",
  { "type": "image", "src": "/images/figure_8_rag_implementation_overview_35_.png", "alt": "Figure 8: RAG implementation overview[35]", "caption": "Figure 8: RAG implementation overview[35]" },
  "To implement the evaluation metrics described, particularly for understanding the correctness of the model's answers, an automated script was employed. This script is responsible for processing the model's output for each query, which is stored in a JSONL file format. The primary goal is to systematically determine if the model's final answer matches the ground truth, especially for ARC queries which are multiple-choice questions.",
  { "type": "image", "src": "/images/figure_21_direct_prompting_52_.png", "alt": "Figure 21: Direct Prompting [52]", "caption": "Figure 21: Direct Prompting [52]" },
  "The core to this evaluation lies in a multi-step parsing strategy designed to intelligently extract the final answer from the model's potentially complex and verbose output, similarly to how a human user would read the output and understand which character is the one that the model chose. The process is as follow:",
  { "type": "image", "src": "/images/figure_26_traditional_information_retrieval_architecture_68_.png", "alt": "Figure 26: Traditional information retrieval architecture[68]", "caption": "Figure 26: Traditional information retrieval architecture[68]" },
  "1. Definitive Answer Extraction: The script first searches the model's prediction for the most explicit answer format, such as \"\\boxed{B}\". This format is often used by models to clearly delineate the final answer, so finding it is the most reliable sign. However, since this work is conducted using smaller models, they often do not follow patterns very well and may provide the answer surrounded by verbose context reflecting their reasoning.",
  { "type": "image", "src": "/images/figure_30_instruction_v1.png", "alt": "Figure 30: Instruction V1", "caption": "Figure 30: Instruction V1" },
  "2. Pattern-Based Fallback: If the first pattern is not found, the script then looks for common natural language phrases that indicate a final answer, like \"The answer is B\" or \"Answer: B\". It is designed to take the last match it finds, operating on the assumption that any reasoning or changes of mind would occur before the final declared answer.",
  "3. Positional Fallback: As a final strategy, if neither of the above patterns yields a result, the script searches for all standalone capital letters (A, B, C, or D) within the response. Subsequently, the system selects the final occurrence as the intended answer, assuming it reflects the model's ultimate decision. This servers as a robust fallback for cases where the model might provide the final answer without any formatting.",
  "Once one answer is extracted through this hierarchy of methods, it is compared directly with the \"ground truth\" value from the JSONL. A new metric, \"correct answer arc\", is added to the data inside the metrics section, this then gets marked as \"true\" if they match and \"false\" if not. Furthermore, this script is also responsible for the automation of the retrieval performance metric. It checks if the \"references\" inside the \"ground truth\" section contains any references that indicate that retrieval was needed. It then cross-references this with the \"method used\" value that represents the path the system chose. If the model used \"retrieval\" for a question that required it, a \"retrieved correctly\" metric is marked as \"true\" on the same metrics section, aligning with the binary evaluation approach mentioned previously. This automated process ensures a consistent and scalable way to apply the defined evaluation criteria across the entire dataset.",
  "Efficiency is a metric that can be measure in various ways depending on the focus of the evaluation. This could be power consumption, cost-effectiveness, or scalability, each of which plays a central role in the direction of this thesis. Power consumption will be measured as watts per query. This metric is important due to the multiple processing steps involved in generating each output. However, it will not reflect the total system power consumption, as only CPU and GPU usage will be measured due to hardware limitations.",
  "The cost-effectiveness will be calculated by dividing the cost of the required hardware components by the system's performance. This allows for a direct comparison between this approach and more powerful alternatives. Such comparisons can be conducted through a series of tests, similar to the benchmarks referenced in model comparison section. Scalability will be assessed by analyzing the requirements needed when using a larger model or when more documents and keywords are added to the system. This will likely be the most difficult metric to evaluate directly, as I do not have access to more powerful hardware. However, I will attempt to estimate scalability based on data and findings from other researchers.",
  "The performance of a LLM is fundamentally linked to the clarity and quality of the instruction provided. In this system, where the initial goal is to classify a user's query into one of three paths retrieving external documents, reasoning step by step, or simply using the model's first response as the answer (both relying on the model's internal knowledge) the construction of the instruction plays a crucial role. By carefully designing this part of the process, we can guide and control the model's decision-making behavior. To determine the most effective approach for this classification task, a series of instructions were developed and tested, evolving from a simple open-ended prompt to a highly structured one that involves a fully rule based framework.",
  "This section will analyze the iterative refinement process of the instructions in detail, evaluating the performance of each version. The evaluation on this section focuses on key metrics, such as: Routing Accuracy (the model's ability to correctly chose 'retrieval' or 'no-retrieval'), Answer Accuracy (the correctness of the final response), and Efficiency (measured in energy consumption) though this metric will be more thoroughly looked at at a later stage. By examining the trade-offs between these factors at each stage, we can identify the best practices for guiding an LLM in a complex classification task.",
  "The initial instruction, V1, was designed as a minimal baseline to assess the feasibility of the proposed approach. This instruction directly asks the model for a binary classification (\"Would this Query benefit from the retrieval of documents?\") Figure 30, with a heavy emphasis on the output format rather than the decision-making logic. This lack of explicit criteria forced the model to rely almost totally on its internal, pre-existing biases to interpret the query's needs.",
  "As the performance data from the evaluation reveals, this approach was highly inconsistent and ultimately unreliable. The model developed a strong bias against retrieving documents, leading to a significant imbalance in the classification. This likely occurred due to the smaller model lacking sufficient internal knowledge, as it is less capable than state-of-the-art models. While the system was adept at identifying general knowledge questions (those not requiring retrieval), it correctly avoided retrieval 98.17% of the time, refer to Figure 31. However, it almost completely failed at the inverse task, only correctly choosing retrieval 16.59% for the queries that required it. As a result, the overall routing accuracy was limited to just 52.3%.",
  "This bias is further evident in the routing decision matrix, which shows that out of 1688 questions that ideally required retrieval to answer correctly, the model incorrectly routed 1408 of them to be answer without retrieving. This fundamental failure to identify questions needing external knowledge confirmed that a simple, unguided prompt is insufficient for creating a reliable query-routing system. While this appears to be true for the chosen model size, further testing is necessary to determine whether this limitation persists in larger models or if they perform better on this task.",
  "To counteract the significant bias against retrieval observed on the first approach Figure 30, the second iteration introduced a strong, explicit bias towards retrieval. Instruction V2 Figure 32, framed the model as an \"expert query analyzer\" with the primary goal of eliminating incorrect answer by trying to force document retrieval for any non-trivial query. It established retrieval ('1-Yes') as the default assumption, permitting a direct answer ('2-No') only if the query met a very strict and narrow set of criteria: it had to involve exclusively 'globally famous entities' and ask for a single, static, and universally known fact. This \"safety-first\" heuristic was designed to try and minimize the risk of factual errors originating from the model's internal knowledge.",
  { "type": "image", "src": "/images/figure_32_instruction_v2.png", "alt": "Figure 32: Instruction V2", "caption": "Figure 32: Instruction V2" },
  "This agressive change dramatically inverted the model's behavior. The Retrieval Task Routing Accuracy skyrocketed from 16.59% to 98.22%, demonstrating that the model could now reliably identify questions that required external documents. Out of 1688 such questions, it correctly chose \"retrieval\" for 1659 of them.",
  { "type": "image", "src": "/images/figure_34_instruction_v3.png", "alt": "Figure 34: Instruction V3", "caption": "Figure 34: Instruction V3" },
  "However, this success came at significant cost to efficiency and accuracy on the opposite task, with results that were almost predictably inverse to those of the first instruction. The model's ability to recognize simple, general knowledge questions plummeted. This can be seen on the General Knowledge Routing Accuracy that fell from 98.17% to a mere 26.07%. The system was now incorrectly choosing to retrieve documents for the vast majority of the queries that did not need it. This over-correction is properly showed on the decision matrix, where 970 out of the 1312 No Retrieval queries, were wrongly sent down the retrieval path.",
  { "type": "image", "src": "/images/figure_36_instruction_v4.png", "alt": "Figure 36: Instruction V4", "caption": "Figure 36: Instruction V4" },
  "Although the Overall Routing Accuracy improved to 66.7%, this aggressive heuristic proved to be an over-correction. While it successfully enforced the retrieval of necessary information, it failed to account for cases where retrieval was unnecessary. This led to inefficient and often redundant processing for a large number of relatively simple queries that the base model could have answered directly. This showed perfectly that while a strong default can steer the model's behavior, a purely aggressive approach is too rigid and fails to balance accuracy with efficiency. All of this is evidenced by the results shown in Figure 33.",
  { "type": "image", "src": "/images/figure_38_instruction_v5.png", "alt": "Figure 38: Instruction V5", "caption": "Figure 38: Instruction V5" },
  "The third iteration, Instruction V3, tried to strike a balance between the aggressive retrieval strategy of V2 and the passive approach of V1. The goal was to try and improve efficiency by reducing unnecessary retrievals without sacrificing the accuracy gains made on complex queries. The key refinement was the introduction of explicit, positive categories for non-retrieval (\"2-No\"). For the first time, the model was given clear examples of queries that were meant to be answer directly, such as \"Universally Known Facts\", \"Creative Tasks\", and \"General Explanations\".",
  { "type": "image", "src": "/images/figure_40_instruction_v6.png", "alt": "Figure 40: Instruction V6", "caption": "Figure 40: Instruction V6" },
  "This structured, two-step process first checks for a simple case, and only then defaulting to retrieval on more complex queries. This proved to be a significant step in the right direction. The model was no longer forced into an overly aggressive default and was instead required to reason through its decision-making process to select the appropriate path.",
  { "type": "image", "src": "/images/page_34_image_2.png", "alt": "No Caption Detected" },
  "The results depicted in Figure 35 reflect this new found balance. The Retrieval Task Routing Accuracy remained exceptionally high at around 98%, indicating that the safety-first principle for complex questions was successfully maintained. The model correctly identified 1655 out of 1688 queries that required retrieval.",
  "Crucially, the opposite task had been the main weakness of the previous iteration, and this remained true in the current version, with results deteriorating further the General Knowledge Routing Accuracy dropped from 26.07% to 21.27% on the General Knowledge Routing Accuracy. This can also be seen on the number of times that the model picked \"retrieval\" 1033 of the 1312 general knowledge questions that don't require it.",
  "The mixed results presented on the previous iteration highlighted a potential weakness in the sequential, rules-based checklist approach. This new instruction V4 represented a major conceptual shift, this time re-framing the task following a procedure to a more holistic classification exercise. Instead of the previous step-by-step process, the model was now tasked with matching the user's query to one of two detailed profiles: \"Profile 1: Retrieval Required\" or \"Profile 2: Direct Answer Sufficient\".",
  "This new profile-based structure is more intuitive for the LLM, as it leverages a core strength of these types of models pattern-matching. The profiles provided a clearer, more organized framework, and critically introduced the \"Recent Events\" as a trigger for retrieval, this was the approach chosen to try and remedy the LLM knowledge cut-off from more recent knowledge. The decision rule, however, still maintained a cautious stance, instructing the model to default to the safety of \"1-Yes\" in cases of doubt or ambiguity.",
  "This new approach proved to be a big breakthrough. The results show a dramatically more balanced and effective system as showed in Figure 37. The General Knowledge Routing Accuracy saw a massive crucial improvement jumping from the previous 21.27% to 69.36%. For the first time, the model could correctly identify the majority of the questions that did not require retrieval.",
  "This improvement came with a small trade-off. The Retrieval Task Routing Accuracy saw a slight dip from the near perfect levels of V2/V3, but still remaining very good at 91.88%. As a result of this new balance, the Overall Routing Accuracy increased to 82.0% the highest and most effective level achieved so far indicating that the instruction was finally moving in the right direction.",
  "The success of this version is best captured in the \"Routing System Vs. Baseline Model\" analysis for general knowledge questions. This version of the routing system achieved a 95.27% answer accuracy, which was 20.35 percentage points better than the baseline for just model answering on its own without any guiding instruction. By successfully re-framing the task to align with the LLM's natural capabilities, this instruction created a far more reliable and smart classification system.",
  "Building on the successful profile-based structure of V4, the fifth version was a final refinement aimed at maximizing reliability. The core structure of the two profiles remained unchanged, but a critical addition was made to the Decision Rule. This new rule introduced an explicit guiding principle to resolve the possible ambiguity: \"A slow but correct answer is always better than a fast but wrong one.\".",
  "This principle served as a powerful tie-breaker, forcing the idea of accuracy on to the model. It explicitly stated that if there was any ambiguity, or if a query even touched on the characteristics from \"Profile 1\" (like a specific name or date), it must default to the safety of retrieval. This approach was designed to try and solidify the instruction's focus on producing the most trustworthy assessment possible, even at the cost of possible decrease in efficiency.",
  "The performance data shows that this refinement had a subtle but measurable impact, tuning the model's behavior as it was intended. The model became slightly more cautious. The Retrieval Task Routing Accuracy slightly increased from 91.88% to 92.0%, which means the model identified 1553 of the 1688 queries that required retrieval. This increased caution also resulted in a minor decrease in the General Knowledge Routing Accuracy, which shifted from 69.36% to 67.07%.",
  "The model was now slightly more likely to send a simple query for retrieval if it contained any element of ambiguity. This adjustment was made based on the reasoning that the model might still produce a correct answer even when retrieval is not strictly necessary. However, the inverse failing to retrieve when it is required almost always results in incorrect answers. As a consequence of this shift, a slight dip in accuracy was observed, with the Overall Routing Accuracy decreasing to 81.1%.",
  "Despite the minor shifts in routing metrics, the final answer quality for general knowledge questions remained identical to that of V4, with the routing system achieving a 95.27%. Similarly to V4, this instruction resulted in a 20.35 percentage point improvement over the baseline. This shows that V5 successfully reinforced the system's reliability.",
  "The final iteration, V6, represented a deliberate reversal from the \"accuracy-first\" principle that guided the previous version. The main goal was explicitly re-focused to \"AVOIDING unnecessary document retrieval\" and to \"reduce incorrect '1-Yes' classifications\". This instruction was designed to test a high-efficiency approach, that prioritizes speed and resource conservation for general knowledge questions.",
  "To achieve this, the core logic was inverted. Non-retrieval (\"2-No\") was made to be the default path, and the model was instructed to choose this approach unless a \"clear and definite 'retrieve trigger'\" was present on the query. The burden of proof was shifted: instead of defaulting to the safer retrieval in cases of ambiguity, the model now required compelling explicit reason to engage the retrieval system.",
  "This strategic change had a profound and predictable impact on the system's performance effectively trading accuracy for efficiency. The instruction's goal was a success for the General Knowledge Routing Accuracy making it surge to its highest point across all the previous versions, reaching and impressive 90.47% as depicted in Figure 41. The system was now exceptionally skilled at identifying and directly answering simple queries without using wasteful processing when not required.",
  "This efficiency came at a significant and expected cost. The Retrieval Task Routing Accuracy fell sharply from 92.00% to a measly 58.77%. By no longer erring on the side of caution, the system failed to identify a large portion of queries that genuinely required the retrieval of external information.",
  "As a result of this trade-off, the Overall Routing Accuracy dropped to 72.6%. Interestingly, despite the lower routing accuracy for complex queries, this approach achieved the highest final answer accuracy on general knowledge questions with 97.18%. This was a 22.26 percentage points over the baseline answers. This outcome shows that by correctly routing a very high volume of simple questions to the direct-answer paths, the system maximized the LLm's ability to leverage its own knowledge effectively, this was also helped with the Chain-of-Thought instruction that improved the base model answer without requiring any external information.",
  "This last experiment shows the high degree of control that prompt engineering provides on such a system and even on the LLM's responses. V6 is not inherently better or worse than V5, it simply optimized and constructed with a different objective in mind. The choice between these two mature instructions depends entirely on the desired system behavior. Which aligns with the purpose of this research prioritizing efficiency whenever the trade-off proves to be worthwhile. V5 is the ideal choice for a system where reliability and avoiding factual errors are paramount, while the V6 version is superior for a system where efficiency and speed in handling common queries are the up most concern.",
  "A holistic view of the system's performance is best captured by plotting the total energy consumed versus the number of correct answers that the system outputted. The resulting scatter plot reveals a fundamental trade-off inherent in the system's operation: achieving a higher number of correct answers of the provided dataset is directly correlated with increased in energy consumption (see Figure42).",
  "This is clearly lustrated in the progression from the baseline models, which occupy the lower-left quadrant of the graph which represents both the lowest energy consumption and the lowest correctness. Although one part of the baseline achieved high correctness, this may be partly due to the way correctness was assigned to queries requiring retrieval. In this evaluation, if retrieval was triggered for a query that required it, the system marked the answer as correct regardless of whether the retrieved content actually led to a correct response. This introduces a significant limitation when interpreting the results. If correctness had instead been evaluated based on the accuracy of the retrieved content itself, the score would likely have been much lower and more in line with the other two baseline results. Another important factor is that, since the retrievable documents come from Wikipedia, many of them coincidentally align with ARC-Easy queries. For example, in Query 3, the retrieved document happens to contain information that, through reasoning, leads to the correct answer. This pattern appears in multiple ARC-style queries and may inflate the apparent effectiveness of the baseline. These two points boost the answer correctness by a lot for this specific file thus should be looked at as a skewed result far from the truth.",
  "At the upper-right, the system demonstrates its ability to improve both the model's correctness and the overall quality of the answers. However, one outlier stands out: System Analysis V1. This version reveals a particularly inefficient instruction, likely due to how open it was to interpretation. As a result, the model engaged in excessive reflection while still failing to choose the appropriate approach for each query type. This led to a significantly lower number of correct answers compared to later, more refined instruction versions.",
  "An important takeaway is that the optimization process was not intended to reduce energy consumption, but rather to maximize the productive use of that energy aiming to yield the most accurate results possible.",
  "Looking further into the energy dynamics of this project, an analysis of the average energy per query reveals a striking and consistent pattern, incorrect answers are consistently more energy-intensive than correct ones. This suggests that incorrect answers are often the result of inefficient processing, such as retrieving irrelevant documents, pursuing flawed reasoning paths, or struggling to analyze conflicting information. In contrast, correct answers appear to follow a more direct and energetically efficient path. With one exception, the straight model baseline, where the correct answers consume slightly more energy. This could be because, when the model is more confident in its answer, it tends to generate longer, more detailed responses, which in turn require more energy than the simpler, shorter incorrect ones.",
  { "type": "image", "src": "/images/figure_44_domain_average_energy_per_correct_answer.png", "alt": "Figure 44: Domain Average Energy per Correct Answer", "caption": "Figure 44: Domain Average Energy per Correct Answer" },
  { "type": "image", "src": "/images/figure_45_domain_average_energy_per_incorrect_answer.png", "alt": "Figure 45: Domain Average Energy per Incorrect Answer", "caption": "Figure 45: Domain Average Energy per Incorrect Answer" },
  "Further analysis of the results, now split by the query's original dataset (domain), reveals another clear efficiency trend: queries related to 'General Knowledge' consistently require more energy than those from the 'Science' domain. This pattern is still present for both correct and incorrect answers, as can be seen in both Figure 44, and 45. For the more refined instructions (V2 through V6), the energy cost for answering a general knowledge question is noticeably higher than for a science question. This disparity likely stems from the increased complexity of the general knowledge queries, which typically require retrieval to be answered. This adds further computational overhead, as the number of tokens the model must process increases due to the inclusion of retrieved documents alongside the instruction. This occurs even after organizing the retrieved documents from most to least relevant, and removing any unnecessary expressions that do not contribute to the quality of the response. On the other hand, in the Science domain, the number of input tokens is always lower since no retrieval is performed when the system functions correctly, thereby reducing the total input tokens.",
  "In summary, the energy consumption analysis provides a comprehensive, multi-dimensional view of the system's efficiency. It demonstrates that efficiency is not a single metric but a balance of multiple factors. The inherent complexity of the query's domain sets a baseline for energy consumption, with \"General Knowledge\" questions proving to be more resource-intensive due to the required retrieval process needed to answer them correctly. Given this baseline, the effectiveness of the instructional prompt plays a pivotal role in how efficiently the energy is utilized. Well-calibrated instructions help guide the model down more efficient pathways, leading to correct answers at a lower average energy cost. This demonstrates that query editing could be a promising area of study for improving model efficiency. While also proving that ambiguity or flawed logic results in wasted energy on incorrect outputs. Ultimately, this analyses reinforces that the iterative refinement of prompts is not merely a quest for higher accuracy, but a method for controlling the crucial trade-off between correctness and computational cost, while also allowing for the strategic selection of a system profile that best aligns with the desired balance of performance and resource conservation.",
  "A foundational analyses of the the system's energy consumption begins with the average energy consumed per query for each experimental version of the instructions, as showed in Figure 46. This shows a clear high-level comparison of the computational cost associated with each iteration of the instructions against the baseline models.",
  "The baseline models establish a lower bound for energy usage, using around 1.1 and 1.3 Wh per query. The introduction of the first routing instruction, V1, immediately results in a significant spike in energy consumption to nearly 2.0 Wh. This aligns with its characterization as a inefficient, open-ended prompt that likely caused extensive and unguided model processing.",
  "As the instructions were refined from V2 to V5, the average energy fluctuated between 1.45 and 1.9 Wh. This demonstrates that the added complexity of the routing system, even when optimized for accuracy, carries a consistent energy overhead compared to the simpler baseline approaches as expected since it requires the model to output two responses for just one query. Interestingly, Instruction V6, which was explicitly designed to enhance efficiency by trying to reduce the usage off unnecessary retrievals, results on the highest average energy consumption at around 2.2 Wh. misconception during the creation of the instruction, as it was initially assumed that the retrieval process would be the most energy-intensive. However, the results show that although retrieval does contribute to energy consumption, it represents only a small portion of the overall cost. Another mistake made during the creation of this instruction was that it ended up heavily relying on an internal chain-of-though process to answer general knowledge queries, which resulted in higher energy consumption. However, it also led to faster response times contradicting some of the assumptions made during the instruction's design.",
  "This increased energy overhead is clearly illustrated in Figure 47. The graph shows that, compared to the baseline, the more advanced routing systems consistently increase total energy consumption by over 40%. This underscores a critical finding, that this implementation of an intelligent routing layer, while substantially improving answer accuracy and reliability, it also presents a significantly and quantifiable trade-off in terms of computational and energy cost. While this was already considered at the start of this endeavor, the main idea is to try and compete with much larger models that, on average, require significantly more energy and computational power. A deeper analysis of this will be carried out at a later stage.",
  "To try and understand the nature of the energy overhead introduced by the routing system, it is essential to deconstruct the total energy consumption into its primary hardware components, the Central Processing Unit (CPU) and the Graphics Processing Unit (GPU). The CPU normally handles data processing, I/O operations, and logical orchestration, while the GPU is responsible for parallel computations required by the model inference. The Figure 48 illustrates this breakdown for each system version.",
  "A clear pattern emerges from the data, the baseline \"straight model\", which relies almost exclusively on model inference, shows the lowest relative CPU energy consumption. On the other hand, all subsequent versions that incorporate either forced retrieval or CoT or the intelligent routing system exhibit an increase in the proportion of energy consumed by the CPU.",
  "Conversely, the GPU energy consumption scales more directly with the complexity and length of the generation required from the LLM. The V6 instruction, which was designed to favor internal Chain-of-Thought reasoning over retrieval, shows the highest energy consumption driven by a massive increase in GPU usage. This shows that while avoiding CPU-heavy retrieval processes, version V6 shifts most of the burden to the GPU, requiring it to perform more extensive and energy-demanding computations to generate the answers. As previously observed, this also resulted in poorer performance compared to earlier iterations.",
  "This analysis reveals that the choice of instruction foes not just how much energy is consumed, but also where it is used. A retrieval heavy strategy taxes the CPU, while a reasoning heavy strategy taxes the GPU. This distinction is critical for system optimization, as it shows how different prompts and engineering strategies can create distinct hardware usage profiles.",
  "Looking beyond the general energy profiles, a more targeted analysis reveals the specific energy consumption required for the system to add value that is, to correct an answer that the baseline model would have gotten wrong. This scenario represents the core justification for this whole approach.",
  "Figure 49 provides a quantitative analysis of the 'correction cost' associated with 'General Knowledge' queries. When the baseline fails while consuming around 0.95 Wh, the various routing systems successfully provided a correct answer, although this came with a significantly higher energy cost, ranging from 1.5 Wh (V2) to a peak of over 2.1 Wh (V1 and V6). Showing that overcoming the baseline's knowledge gaps via retrieval is an intensive operation. Though like explained previously this lacks a better understanding since the evaluation of this domain is just that retrieval occurred, so the straight model never got a correct answer due to that fact. However, we can still compare them, and the V6 instruction stands out once again due to its high energy cost. This is primarily attributed to its reliance on a detailed chain-of-thought process which, while somewhat effective, is significantly more computationally demanding.",
  "A similar trend is observed in the Science domain, as shown in Figure 60. Correcting the baseline in this approach also required a substantial energy investment, with the V6 again showing the highest consumption at nearly 2.5 Wh. Thus reinforcing that the act of correcting the responses regardless of the domain is inherently more energy demanding.",
  "On the other hand Figure 51 analyzes the scenario where both the baseline and the system failed to produce a correct answer. This represents the least efficient use of energy, showing that the system uses additional resources only to arrive at the same incorrect outcome. It is noteworthy that the energy consumed in these failure cases is often comparable to and sometimes even higher than the energy required to produce correct answers. As proof, the V6 system consumes over 2.6 Wh when it fails, more than it does for a successful answer which is around 2.5 Wh. This might suggest that these incorrect answeres may result from the system pursuing particularly complex, yet flawed, reasoning paths or even retrieving irrelevant information, leading to wasted resources.",
  "While the average energy consumption provides a useful high-level metric, a deeper understanding of the system efficiency is required to access its consistency and predictability. A system with a low average cost is less desirable if it is prone to higher spikes. The boxplot in Figure 52 provides valuable insight into all the versions by visually representing the distribution of energy consumption per query for each one.",
  "The baseline models, particularly the \"straight model\", presents the tightest distribution. The small inter quartile range shows that most of the queries are processed using a very consistently and predictably amount of energy. This helps them in terms of reliability since from a resource planing perspective they are very predictable, though they show lower accuracy.",
  "On the opposite side of the spectrum we have the initial routing Instruction V1, that demonstrates extreme unpredictability. It has by far the largest inter-quartile range and a long upper whisker, indicating a massive variance in energy consumption. This proves that its ambiguity led to highly inefficient and erratic processing.",
  "The following versions from V2 to V5 show a clear trend into an increasing predictability. While they show a higher median energy cost than the baseline, their distributions become tighter and tighter as versions increase. This shows the core benefit of the iterative refinement process, reflecting precisely what was discussed previously as the instructions became more specific and rule-based the model's behavior became more constrained to the rules, therefore more predictable. The number of high energy outliers that caused an increase in system's resource expenditure also decreased indicating a more robust and stable approach.",
  "Lastly the V6 instruction, designed for efficiency presents a rather unique profile. While its median energy is high, its distribution is relatively contained in comparison with V1, this suggests that its Chain-of-Thought process, though energy intensive, is being applied more consistently.",
  "Ultimately, this analysis underscores that effective prompt engineering does more than just improve accuracy, as this proves that it enhances operational predictability. A well designed instruction set not only guides the model to the correct answer but also ensures that the model does so consistently while using a manageable level of resource consumption, which is a critical factor when picking and deploying such systems in the real world, especially in resource constrained environments",
  "The culmination of this analysis is best visualized in the performance quadrant plot, which visually presents each system's final correctness rate against its average energy cost for the ARC queries. The graph present in Figure 53, offers a clear overview of the trade-offs and situates the performance of the 8B parameter model (DeepSeek-R1-Distill-Llama-8B) used as the base and all the routing systems routing systems against a crucial benchmark, a much larger 14B parameter model (DeepSeek-R1-Distill-Qwen-14B).",
  "The optimal position on this graph is at the top-left quadrant, which represents the highest accuracy with the lowest energy consumption. The bottom-right represents the inverse so the worst possible outcome. The baseline models establish two reference points. The first is the \"straight model\" (8B), sits in the lower left quadrant, confirming it is a low accuracy but highly efficient option. On the other hand, at the upper-right corner sits the \"straight model 14B 8-bit\" demonstrating the brute force approach as it achieves a very high correctness of nearly 90%, however this comes with the cost of an enormous amount of energy at around 3.7 Wh per query, making it by far the least efficient model",
  "The iterative refinement of the routing instructions charts a clear journey toward the ideal quadrant. The initial, poorly tuned instructions (V1,V2,V3) show modest accuracy gains over the 8B baseline but at a notable energy cost, placing them in the lower-middle of the graph. The major breakthrough occurs with instruction V4 and later V5. These versions represent an optimal sweet spot, achieving a substantial leap in terms of correctness to over 83% while still maintaining an average cost below 1.8 Wh. Most importantly, they deliver a significant portion of the accuracy gains of the 14B model while consuming less than half the energy.",
  "The efficiency-focused V6 instruction pushes the accuracy to over 85%, however it also increased the energy cost, moving the results slightly to the right. While it is the most accurate of the routing instructions, it begins to approach a point of diminishing returns in the accuracy-efficiency trade off.",
  "To conclude, this analysis of the quadrant provides the most complete validation of the research. It shows that an intelligent routing layer with a combination of a carefully engineered prompts are not just incremental improvements. They are part of a transformative strategy of optimization. By using carefully designed instructions to guide a smaller, more efficient 8B model, the system achieves a performance profile that rivals a model nearly twice its size, but at a fraction of the computational and energy costs. This goes to show that architectural and instructional refinement can be a more sustainable and effective approach to high performance, rather than simply scaling up the model size."]
  },
    results: {
      title: "Results",
      content: [
        "To guarantee that the performance and energy consumption results represented in this thesis are both valid and reliable, a strict protocol was established to try to minimize the number of variables and create a consistent testing environment for all experiments. The following measures were systematically implemented to ensure that the results shown can be directly attributed to the changes in the system's instruction design and model performance.",
        "First, the test system was maintained in a controlled and isolated state. To prevent interference from many background tasks associated with other programs, and also with the operating system tasks, such as automatic updates or network-related tasks, the machine's internet connection was physically disabled for the duration of all test runs. To further improve repeatability, prior to initiating any experiment, all non-essential background applications and services were fully terminated. The system was then left without any intervention after the scripts started up until they were finished and all the required data was collected. This ensured that the system's computational resources were devoted exclusively to the experimental workload.",
        "Another point taken to maintain the system repeatability was that a static software environment was kept during the entire research process. The main components of the system, including the Python interpreter, the PyCharm IDE, and the HWiNFO monitoring utility, were not updated after the initial setup. This strategy is crucial to eliminate the risk of major software updates introducing performance variations that could skew the results.",
        "Finally, and most critically, the underlying code base for the query-routing system and model inference remained identical across all comparative experiments. When testing the efficacy of different instructions, the sole modification between each run was the content of the system instruction itself. This strict isolation of the independent variable ensures that all measured differences in answer accuracy, latency and energy consumption are direct consequences of the prompt engineering strategy, rather than unintended changes in the software that supports it.",
        "In the course of this research, some promising strategies were explored but ultimately abandoned due to practical constraints, resource limitations, or conflicts with the project's core objectives. This section represents these methodological dead ends, as understanding what these were and their causes could aid further research.",
        "One of the initial strategies considered for enhancing the RAG component was the usage of a hypothetical document similar to HyDE[40]. The technique, which involves generating a hypothetical answer to a query to improve the semantic search for relevant documents, has shown promise in other projects. However, the original HyDE (Answer RQ2) paper recommended the generation of up to eight hypothetical documents per retrieval to achieve optimal performance. In practice, this approach proved to be prohibitively expensive for the presented framework. The computational overhead of generating eight separate documents before the retrieval was done and the formation of the final answer would have dramatically increased both energy consumption and latency, with the latter representing a change that would make the framework basically unusable with the current hardware. This would directly undermine the primary goal of creating a fast and efficient system for resource-constrained environments.",
        "Another considered approach was the use of keyword injection to improve the model's performance on specialized, domain-specific tasks. The hypothesis was that by programmatically inserting key technical terms (e.g., medical terminology for healthcare implementations) into the prompt, the model could be guided toward a more accurate and contextually aware response. This idea was ultimately abandoned due to the immense data curation effort this would need. To be effective, this strategy would necessitate the creation of a large, validated dataset mapping queries to the required keywords for each domain if various were to be involved in testing. Getting hold and verifying the accuracy of this much data would be a substantial research project in itself, and it felt outside of the scope of this project which was focused more towards the general public.",
        "Finally, the scope of model comparison was limited by the hardware available for this research. While the study successfully demonstrates the capabilities of an 8B parameter model on a single GPU workstation, a more comprehensive analysis would have included benchmarks with higher models as well, which would normally require enterprise-grade GPUs. Such tests were not conducted due to a lack of access to these powerful computational resources. As a result, the performance comparison remains focused on demonstrating the significant leap from smaller models to the proposed SLM framework, rather than a broader spectrum of available open-source models."
      ]
    },
    conclusions: {
    title: "Conclusions",
    content: [  "This thesis confronted the significant challenge of deploying powerful language models within environments constrained by limited computational resources, strict data privacy regulations, and tight budgets. The prohibitive cost and operational complexities of state-of-the-art Large Language Models pose a significant barrier for small to medium enterprises and regulated institutions. In response, this research proposed and evaluated a novel framework (Answer RQ1) centered on a compact, 8 billion parameter Small Language Model. The core innovation of this work is a dynamic, adaptive query routing system that intelligently triages incoming queries, selecting the most efficient and effective path be it a direct answer, a reasoning-intensive chain of thought, or knowledge augmentation using retrieval-augmented generation.",
  "The results of this study show that architectural control and sophisticated prompt engineering can substantially bridge the performance gap between small, quantized models and their larger, more resource-intensive counterparts. Through iterative refinement of the controller's instruction design, particularly with profile-based prompts, (Answer RQ3) the system achieved an accuracy exceeding 85% on reasoning-focused science questions. Critically, this performance was achieved with significantly greater energy efficiency than would be possible using larger models. The detailed energy profiling revealed a direct correlation between incorrect answers and higher energy consumption, and also showed how different instructions strategically shift the computational load between CPU-intensive retrieval and GPU-intensive generation. Thus confirming that a \"smarter, not bigger\" approach is a viable path forward.",
  "The implications of this research are both practical and strategic. It provides a tangible blueprint for developing high-quality, cost-effective, and secure question-answering system that can operate on-premise on a single GPU workstation. This work (Answer RQ4) democratizes access to advanced AI capabilities, enabling organizations without massive computational infrastructure to leverage the power of language models. Furthermore, it also contributes to the growing field of sustainable AI by demonstrating that performance and efficiency are not mutually exclusive.",
  "The framework developed in this thesis successfully demonstrates that an intelligently controlled Small Language Model can achieve high performance in resource-constrained environments. This research also opens up several compelling points for future investigation that could further enhance the robustness, efficiency, and applicability of this approach.",
  "First a critical area for future research is the system's resilience to irrelevant or misleading information within its knowledge base. The current experiments utilized a corpus that was sometimes relevant to the ARC dataset. A future study could involve another dataset that has no relevant information to the real world, this would split the realities of this dataset versus the ARC one, this way when retrieval occurred for ARC it wouldn't improve the answer of the system. Though this is part of the advantage of a system like this, as it will always aim for the best possible result.",
  "Second, a novel and promising research direction based on the extracted results. A promising direction would be to explore the relationship between energy consumption and model hallucination. During this work, a correlation was observed between incorrect answers and higher energy usage. This suggests the possibility of identifying a computational signature for hallucination. This could involve analyzing power draw and processing patterns to determine if non-factual or fabricated responses can be detected in real-time based on their energy profile. If a reliable correlation is established, this could lead to the development of a mechanism that flags potential hallucinations as they are being generated, allowing the system to intervene and reroute the query for correction, thereby improving the model's trustworthiness.",
  "Finally, the adaptive routing principles pioneered here for SMLs could be extended to address known inefficiencies in much larger models. State-of-the-art LLMs, despite their power, can sometimes enter unproductive reasoning loops, repeatedly processing the same logic without reaching a conclusion, which wastes significant computational resources. A future implementation could adapt the controller to monitor the reasoning paths of an LLM. By detecting major semantic repetition or a lack of progress, the system could intervene to break the loop, perhaps by injecting new information via RAG or rewriting the prompt. This would not only prevent wasted computation and energy while also improving the reliability of LLMs in complex, multi-step reasoning tasks positioning this framework as a valuable tool for optimizing both small and large language models."]
  },
  downloads: {
    title: "Downloads",
    thesisPdf: "/Tese_fixed_references.pdf",
    presentationPptx: "/Final_Presentation.pptx",
    frameworkGitHub: "https://github.com/Jose-Ribeir/An-Adaptive-Query-Routing-Framework",
  },
  contact: {
    title: "Contact",
    name: "José Pedro Farinha Ribeiro",
    email: "josepfribeiro@live.com.pt",
    university: "IADE - Faculdade de Design, Tecnologia e Comunicação",
    department: "Mestre em Creative Computing and Artificial Intelligence",
  },
  challengeSolution: {
    title: "The Challenge & Solution",
    problems: [
      {
        title: "High Costs of State-of-the-Art LLMs",
        description: "The computational and financial costs of deploying large language models continue to grow, making them prohibitively expensive for resource-constrained organizations.",
      },
      {
        title: "Data Privacy Concerns",
        description: "Organizations like banks, hospitals, and government offices handle sensitive information that cannot exit their premises under strict data privacy laws like GDPR and CCPA, preventing cloud usage.",
      },
      {
        title: "Hardware Limitations",
        description: "Small and medium-sized enterprises (SMEs) often lack access to high-performance hardware infrastructure required for large models.",
      },
    ],
    solution: {
      title: "The Solution",
      description: "An adaptive query-routing framework using a compact 8B parameter model with an adaptive controller that dynamically selects the best method per query.",
      keyPoints: [
        "Compact 8B parameter model",
        "Adaptive Controller: Dynamically selecting between Direct Answer, Chain-of-Thought, or RAG",
        "Achieves >85% accuracy on ARC-style queries",
        "Significantly lower energy consumption than larger models",
      ],
    },
    researchQuestions: [
      {
        id: "RQ1",
        question: "How can a system using smaller models still compete with larger ones in terms of performance and efficiency?",
        description: "This research question explores whether architectural control and prompt engineering can bridge the performance gap between small and mid-sized models.",
      },
      {
        id: "RQ2",
        question: "Can HyDE be applied to a system designed for efficiency?",
        description: "Investigates whether Hypothetical Document Embedding techniques can be adapted for resource-constrained environments.",
      },
      {
        id: "RQ3",
        question: "What are the trade-offs among answer quality, inference latency, and energy consumption for each rewriting strategy?",
        description: "Analyzes the balance between correctness, speed, and energy efficiency across different routing approaches.",
      },
      {
        id: "RQ4",
        question: "Can an efficient approach still achieve high accuracy while remaining useful?",
        description: "Determines if the proposed framework can deliver high-quality results while maintaining practical efficiency for real-world deployment.",
      },
    ],
  },
  technicalDeepDive: {
    title: "Technical Deep Dive",
    quantization: {
      title: "Quantization Techniques",
      description: "Quantization reduces the computational and memory footprint of language models by representing weights with fewer bits, enabling deployment on resource-constrained hardware.",
      ptq: {
        title: "Post-Training Quantization (PTQ)",
        description: "PTQ applies quantization after model training, converting full-precision weights to lower precision without retraining. It's faster to implement but may result in some accuracy loss.",
      },
      qat: {
        title: "Quantization-Aware Training (QAT)",
        description: "QAT incorporates quantization during training, allowing the model to adapt to lower precision. This typically achieves better accuracy than PTQ but requires retraining.",
      },
    },
    ragVsHyde: {
      title: "RAG vs. HyDE",
      description: "Retrieval-Augmented Generation (RAG) and Hypothetical Document Embedding (HyDE) are two approaches to enhance language models with external knowledge. RAG retrieves actual documents, while HyDE generates hypothetical documents to improve semantic search.",
      ragImage: "/images/figure_8_rag_implementation_overview_35_.png",
    },
    energyEfficiency: {
      title: "Energy Efficiency Trade-offs",
      description: "The choice of routing strategy affects not just total energy consumption, but also where energy is used. Retrieval-heavy strategies tax the CPU, while reasoning-heavy strategies tax the GPU.",
      cpuVsGpu: "A retrieval-heavy strategy taxes the CPU, while a reasoning-heavy strategy taxes the GPU. This distinction is critical for system optimization, as it shows how different prompts and engineering strategies can create distinct hardware usage profiles.",
    },
  },
  resultsData: {
    title: "Results & Data",
    keyTakeaway: "Incorrect answers consume more energy than correct ones, suggesting that incorrect answers result from inefficient processing paths.",
    energyVsCorrectness: {
      title: "Energy Costs vs. Correctness",
      description: "Scatterplot showing the trade-off between energy consumption and answer correctness across different instruction versions.",
      data: [
        { version: "Baseline Straight", energy: 1.08, correctness: 60, color: "#0F9ED5" },
        { version: "Baseline CoT", energy: 1.2895, correctness: 65, color: "#0F9ED5" },
        { version: "Baseline Retrieval", energy: 1.29, correctness: 87.5, color: "#0F9ED5" },
        { version: "V1", energy: 2.0, correctness: 55, color: "#E97132" },
        { version: "V2", energy: 1.9, correctness: 70, color: "#4EA72E" },
        { version: "V3", energy: 1.8, correctness: 72, color: "#4EA72E" },
        { version: "V4", energy: 1.7, correctness: 83, color: "#4EA72E" },
        { version: "V5", energy: 1.75, correctness: 83, color: "#4EA72E" },
        { version: "V6", energy: 2.2, correctness: 85, color: "#A02B93" },
      ],
    },
    performanceComparison: {
      title: "Performance Comparison: 8B vs. 14B Models (Science Domain Only)",
      description: "Comparison of the 8B parameter model with routing system against a 14B parameter model for science domain questions, showing accuracy and energy consumption.",
      models: [
        {
          name: "8B Baseline",
          parameters: "8B",
          accuracy: 74.9,
          energy: 1.08,
          color: "#0F9ED5",
        },
        {
          name: "8B with Routing (V5)",
          parameters: "8B",
          accuracy: 84.3,
          energy: 1.75,
          color: "#4EA72E",
        },
        {
          name: "14B 8-bit",
          parameters: "14B",
          accuracy: 87.8,
          energy: 3.7,
          color: "#E97132",
        },
      ],
    },
    energyDistribution: {
      title: "CPU vs. GPU Energy Distribution",
      description: "Breakdown of energy consumption between CPU and GPU for different instruction versions.",
      data: [
        { version: "Direct Answer", cpu: 0.2838, gpu: 0.7993 },
        { version: "CoT", cpu: 0.3491, gpu: 0.9404 },
        { version: "Retrieval", cpu: 0.3519, gpu: 0.9418 },
        { version: "V1", cpu: 0.498, gpu: 1.41 },
        { version: "V2", cpu: 0.3734, gpu: 1.06 },
        { version: "V3", cpu: 0.4191, gpu: 1.12 },
        { version: "V4", cpu: 0.5151, gpu: 1.3655 },
        { version: "V5", cpu: 0.5194, gpu: 1.3732 },
        { version: "V6", cpu: 0.6263, gpu: 1.6028 },
      ],
    },
  },
  resourcesAuthor: {
    title: "Resources & Author",
    author: {
      name: "José Pedro Farinha Ribeiro",
      bio: "Master's student in Creative Computing and Artificial Intelligence at IADE - Faculdade de Design, Tecnologia e Comunicação da Universidade Europeia. Research focuses on optimizing small language models for resource-constrained environments through adaptive query routing and energy-efficient AI systems.",
      email: "josepfribeiro@live.com.pt",
      linkedin: "https://www.linkedin.com/in/jos%C3%A9-ribeiro-8052551a0/",
      github: "https://github.com/Jose-Ribeir",
    },
    downloads: {
      title: "Download Center",
      items: [
        {
          label: "Download Thesis (PDF)",
          description: "Complete thesis document with all research findings and analysis",
          href: "/Tese_fixed_references.pdf",
          type: "pdf",
        },
        {
          label: "Download Presentation (PPTX)",
          description: "Presentation slides summarizing the research",
          href: "/Final_Presentation.pptx",
          type: "pptx",
        },
        {
          label: "Framework Repository",
          description: "GitHub repository containing the implementation code",
          href: "https://github.com/Jose-Ribeir/An-Adaptive-Query-Routing-Framework",
          type: "github",
        },
      ],
    },
  },
};
