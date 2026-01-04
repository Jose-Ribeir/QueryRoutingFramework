import Section from './components/Section';
import DownloadButton from './components/DownloadButton';
import { thesisContent } from '../content/thesis-content';
import InteractiveDiagram from './components/InteractiveDiagram';
import ResearchQuestionCard from './components/ResearchQuestionCard';
import SystemArchitecture from './components/SystemArchitecture';
import PromptSlider from './components/PromptSlider';
import EnergyChart from './components/EnergyChart';
import PerformanceChart from './components/PerformanceChart';
import EnergyDistributionChart from './components/EnergyDistributionChart';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="pt-16 bg-ppt-dark3">
      {/* Hero Section - Enhanced */}
      <section
        id="hero"
        className="min-h-screen flex items-center justify-center bg-ppt-dark3 relative overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-ppt-accent4/5 via-transparent to-ppt-accent6/5" />
        
        <div className="container mx-auto px-4 max-w-6xl text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-ppt-light1 mb-6">
            Optimizing Small Language Models for Resource-Constrained Environments
          </h1>
          <p className="text-xl md:text-2xl text-ppt-light1/80 mb-4">
            An Adaptive Query-Routing Framework
          </p>
          <p className="text-lg text-ppt-light1/70 mb-8">
            by {thesisContent.hero.author}
          </p>
          
          {/* Quick Summary */}
          <div className="max-w-3xl mx-auto mb-8">
            <p className="text-lg text-ppt-light1/90 leading-relaxed mb-6">
              Achieving <span className="text-ppt-accent6 font-semibold">>85% accuracy</span> on ARC-style queries with 
              <span className="text-ppt-accent4 font-semibold"> significantly lower energy consumption</span> than larger models.
            </p>
          </div>

          {/* Routing Mechanism Visualization */}
          <div className="mb-8">
            <InteractiveDiagram />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="#methodology"
              className="px-6 py-3 bg-ppt-accent4 text-white font-medium rounded-lg hover:bg-ppt-accent4/80 transition-colors shadow-lg hover:shadow-xl shadow-ppt-accent4/30"
            >
              View the Methodology
            </Link>
            <Link
              href="/downloads"
              className="px-6 py-3 bg-ppt-accent6 text-white font-medium rounded-lg hover:bg-ppt-accent6/80 transition-colors shadow-lg hover:shadow-xl shadow-ppt-accent6/30"
            >
              Download Full Thesis
            </Link>
          </div>
        </div>
      </section>

      {/* Challenge & Solution Section */}
      <Section id="challenge-solution" className="bg-ppt-dark3 text-ppt-light1">
        <h2 className="text-3xl md:text-4xl font-bold text-ppt-light1 mb-8 text-center">
          {thesisContent.challengeSolution.title}
        </h2>

        {/* Problems */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-ppt-light1 mb-6">The Problem</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {thesisContent.challengeSolution.problems.map((problem, index) => (
              <div
                key={index}
                className="bg-ppt-dark2/50 border border-ppt-light1/20 rounded-lg p-6 hover:border-ppt-accent2/50 transition-all duration-300"
              >
                <h4 className="text-xl font-semibold text-ppt-accent2 mb-3">{problem.title}</h4>
                <p className="text-ppt-light1/80 leading-relaxed">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Solution */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-ppt-light1 mb-6">{thesisContent.challengeSolution.solution.title}</h3>
          <div className="bg-ppt-dark2/50 border border-ppt-accent4/30 rounded-lg p-8">
            <p className="text-ppt-light1/90 text-lg mb-6 leading-relaxed">
              {thesisContent.challengeSolution.solution.description}
            </p>
            <ul className="space-y-3">
              {thesisContent.challengeSolution.solution.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-ppt-accent4 text-xl">✓</span>
                  <span className="text-ppt-light1/90">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Research Questions */}
        <div>
          <h3 className="text-2xl font-bold text-ppt-light1 mb-6">Research Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {thesisContent.challengeSolution.researchQuestions.map((rq) => (
              <ResearchQuestionCard
                key={rq.id}
                id={rq.id}
                question={rq.question}
                description={rq.description}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Technical Deep Dive Section */}
      <Section id="technical-deep-dive" className="bg-ppt-dark3 text-ppt-light1">
        <h2 className="text-3xl md:text-4xl font-bold text-ppt-light1 mb-8 text-center">
          {thesisContent.technicalDeepDive.title}
        </h2>

        {/* Quantization */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-ppt-light1 mb-4">{thesisContent.technicalDeepDive.quantization.title}</h3>
          <p className="text-ppt-light1/90 mb-6 leading-relaxed">
            {thesisContent.technicalDeepDive.quantization.description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-ppt-dark2/50 border border-ppt-accent4/30 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-ppt-accent4 mb-3">
                {thesisContent.technicalDeepDive.quantization.ptq.title}
              </h4>
              <p className="text-ppt-light1/80 leading-relaxed">
                {thesisContent.technicalDeepDive.quantization.ptq.description}
              </p>
            </div>
            <div className="bg-ppt-dark2/50 border border-ppt-accent6/30 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-ppt-accent6 mb-3">
                {thesisContent.technicalDeepDive.quantization.qat.title}
              </h4>
              <p className="text-ppt-light1/80 leading-relaxed">
                {thesisContent.technicalDeepDive.quantization.qat.description}
              </p>
            </div>
          </div>
        </div>

        {/* RAG vs. HyDE */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-ppt-light1 mb-4">{thesisContent.technicalDeepDive.ragVsHyde.title}</h3>
          <p className="text-ppt-light1/90 mb-6 leading-relaxed">
            {thesisContent.technicalDeepDive.ragVsHyde.description}
          </p>
          {thesisContent.technicalDeepDive.ragVsHyde.ragImage && (
            <div className="flex justify-center mb-6">
              <img
                src={thesisContent.technicalDeepDive.ragVsHyde.ragImage}
                alt="RAG Implementation Overview"
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ maxWidth: '800px' }}
              />
            </div>
          )}
        </div>

        {/* Energy Efficiency */}
        <div>
          <h3 className="text-2xl font-bold text-ppt-light1 mb-4">{thesisContent.technicalDeepDive.energyEfficiency.title}</h3>
          <p className="text-ppt-light1/90 mb-4 leading-relaxed">
            {thesisContent.technicalDeepDive.energyEfficiency.description}
          </p>
          <div className="bg-ppt-dark2/50 border border-ppt-accent4/30 rounded-lg p-6">
            <p className="text-ppt-light1/90 leading-relaxed">
              {thesisContent.technicalDeepDive.energyEfficiency.cpuVsGpu}
            </p>
          </div>
        </div>
      </Section>

      {/* Methodology Section */}
      <Section id="methodology" className="bg-ppt-dark3 text-ppt-light1">
        <h2 className="text-3xl md:text-4xl font-bold text-ppt-light1 mb-8 text-center">
          {thesisContent.methodology.title}
        </h2>
        
        {/* System Architecture Diagram */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-ppt-light1 mb-6">System Architecture</h3>
          <p className="text-ppt-light1/80 mb-6 leading-relaxed max-w-3xl mx-auto">
            The proposed system integrates a rewriter module that analyzes user queries and selects the optimal routing strategy: 
            direct answer, Chain-of-Thought reasoning, or Retrieval-Augmented Generation (RAG).
          </p>
          <SystemArchitecture />
        </div>

        {/* Prompt Engineering Slider */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-ppt-light1 mb-6">Instruction Design Evolution</h3>
          <p className="text-ppt-light1/80 mb-6 leading-relaxed max-w-3xl mx-auto">
            The framework evolved through six instruction versions, progressing from simple format-driven heuristics to sophisticated 
            profile-based classification. Each version was evaluated on routing accuracy, answer correctness, and energy efficiency.
          </p>
          <PromptSlider />
        </div>

        {/* Key Approaches */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-ppt-dark2/50 border border-ppt-accent4/30 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-ppt-accent4 mb-3">Direct Answer</h4>
            <p className="text-ppt-light1/80 leading-relaxed">
              Fastest path for simple queries that the model can answer directly without additional processing steps.
            </p>
          </div>
          <div className="bg-ppt-dark2/50 border border-ppt-accent6/30 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-ppt-accent6 mb-3">Chain-of-Thought</h4>
            <p className="text-ppt-light1/80 leading-relaxed">
              Step-by-step reasoning approach that enhances model performance on complex queries requiring logical thinking.
            </p>
          </div>
          <div className="bg-ppt-dark2/50 border border-ppt-accent2/30 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-ppt-accent2 mb-3">RAG</h4>
            <p className="text-ppt-light1/80 leading-relaxed">
              Retrieval-Augmented Generation that retrieves relevant documents and augments the model&apos;s knowledge for knowledge-intensive queries.
            </p>
          </div>
        </div>
      </Section>

      {/* Results & Data Section */}
      <Section id="results-data" className="bg-ppt-dark3 text-ppt-light1">
        <h2 className="text-3xl md:text-4xl font-bold text-ppt-light1 mb-8 text-center">
          {thesisContent.resultsData.title}
        </h2>

        {/* Key Takeaway */}
        <div className="bg-gradient-to-r from-ppt-accent2/20 to-ppt-accent4/20 border-2 border-ppt-accent2/50 rounded-lg p-6 mb-12">
          <h3 className="text-xl font-bold text-ppt-light1 mb-2">Key Takeaway</h3>
          <p className="text-lg text-ppt-light1/90 leading-relaxed">
            {thesisContent.resultsData.keyTakeaway}
          </p>
        </div>

        {/* Energy vs. Correctness Chart */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-ppt-light1 mb-4">{thesisContent.resultsData.energyVsCorrectness.title}</h3>
          <p className="text-ppt-light1/80 mb-6 leading-relaxed">
            {thesisContent.resultsData.energyVsCorrectness.description}
          </p>
          <div className="bg-ppt-dark2/30 rounded-lg p-6 border border-ppt-light1/20">
            <EnergyChart data={thesisContent.resultsData.energyVsCorrectness.data} />
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-ppt-light1 mb-4">{thesisContent.resultsData.performanceComparison.title}</h3>
          <p className="text-ppt-light1/80 mb-6 leading-relaxed">
            {thesisContent.resultsData.performanceComparison.description}
          </p>
          <div className="bg-ppt-dark2/30 rounded-lg p-6 border border-ppt-light1/20">
            <PerformanceChart models={thesisContent.resultsData.performanceComparison.models} />
          </div>
        </div>

        {/* Energy Distribution */}
        <div>
          <h3 className="text-2xl font-bold text-ppt-light1 mb-4">{thesisContent.resultsData.energyDistribution.title}</h3>
          <p className="text-ppt-light1/80 mb-6 leading-relaxed">
            {thesisContent.resultsData.energyDistribution.description}
          </p>
          <div className="bg-ppt-dark2/30 rounded-lg p-6 border border-ppt-light1/20">
            <EnergyDistributionChart data={thesisContent.resultsData.energyDistribution.data} />
          </div>
        </div>
      </Section>

      {/* Resources & Author Section */}
      <Section id="resources-author" className="bg-ppt-dark3 text-ppt-light1">
        <h2 className="text-3xl md:text-4xl font-bold text-ppt-light1 mb-8 text-center">
          {thesisContent.resourcesAuthor.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Author */}
          <div>
            <h3 className="text-2xl font-bold text-ppt-light1 mb-4">About the Author</h3>
            <div className="bg-ppt-dark2/50 border border-ppt-light1/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-ppt-accent4 mb-3">
                {thesisContent.resourcesAuthor.author.name}
              </h4>
              <p className="text-ppt-light1/90 leading-relaxed mb-4">
                {thesisContent.resourcesAuthor.author.bio}
              </p>
              <div className="space-y-2">
                <p>
                  <a
                    href={`mailto:${thesisContent.resourcesAuthor.author.email}`}
                    className="text-ppt-accent4 hover:text-ppt-accent4/80 underline transition-colors"
                  >
                    {thesisContent.resourcesAuthor.author.email}
                  </a>
                </p>
                {thesisContent.resourcesAuthor.author.linkedin && (
                  <p>
                    <a
                      href={thesisContent.resourcesAuthor.author.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ppt-accent4 hover:text-ppt-accent4/80 underline transition-colors"
                    >
                      LinkedIn
                    </a>
                  </p>
                )}
                {thesisContent.resourcesAuthor.author.github && (
                  <p>
                    <a
                      href={thesisContent.resourcesAuthor.author.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ppt-accent4 hover:text-ppt-accent4/80 underline transition-colors"
                    >
                      GitHub
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Downloads */}
          <div>
            <h3 className="text-2xl font-bold text-ppt-light1 mb-4">{thesisContent.resourcesAuthor.downloads.title}</h3>
            <div className="space-y-4">
              {thesisContent.resourcesAuthor.downloads.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-ppt-dark2/50 border border-ppt-light1/20 rounded-lg p-4 hover:border-ppt-accent4/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-ppt-light1 mb-1">{item.label}</h4>
                      <p className="text-sm text-ppt-light1/70">{item.description}</p>
                    </div>
                    <DownloadButton
                      href={item.href}
                      label={item.type === 'github' ? 'View' : 'Download'}
                      external={item.type === 'github' || item.type === 'bibtex'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
