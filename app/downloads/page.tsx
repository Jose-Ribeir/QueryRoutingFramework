'use client';

import Section from '../components/Section';
import DownloadButton from '../components/DownloadButton';
import { thesisContent } from '../../content/thesis-content';

export default function DownloadsPage() {
  return (
    <main className="pt-16 bg-ppt-dark3 min-h-screen">
      <Section id="downloads" className="bg-ppt-dark3 text-ppt-light1">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold text-ppt-light1 mb-4 text-center">
            Download Center
          </h1>
          <p className="text-xl text-ppt-light1/80 mb-12 text-center">
            Access all resources related to this research
          </p>

          <div className="space-y-6">
            {/* Thesis PDF */}
            <div className="bg-ppt-dark2/50 border border-ppt-light1/20 rounded-lg p-6 hover:border-ppt-accent4/50 transition-all duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-ppt-light1 mb-2">
                    Full Thesis (PDF)
                  </h2>
                  <p className="text-ppt-light1/80 mb-2">
                    Complete thesis document with all research findings, methodology, results, and conclusions.
                  </p>
                  <p className="text-sm text-ppt-light1/60">
                    Includes detailed analysis of the adaptive query-routing framework, energy profiling, and performance comparisons.
                  </p>
                </div>
                <DownloadButton
                  href={thesisContent.downloads.thesisPdf}
                  label="Download PDF"
                />
              </div>
            </div>

            {/* Presentation */}
            <div className="bg-ppt-dark2/50 border border-ppt-light1/20 rounded-lg p-6 hover:border-ppt-accent4/50 transition-all duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-ppt-light1 mb-2">
                    Presentation (PPTX)
                  </h2>
                  <p className="text-ppt-light1/80 mb-2">
                    Presentation slides summarizing the research findings and key insights.
                  </p>
                  <p className="text-sm text-ppt-light1/60">
                    Visual overview of the framework, results, and conclusions.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <DownloadButton
                    href={thesisContent.downloads.presentationPptx}
                    label="Download PPTX"
                  />
                  <a
                    href="/presentation"
                    className="inline-flex items-center px-6 py-3 bg-ppt-accent6 text-white font-medium rounded-lg hover:bg-ppt-accent6/80 transition-colors shadow-md hover:shadow-lg"
                  >
                    View Online
                  </a>
                </div>
              </div>
            </div>

            {/* Framework Repository */}
            {thesisContent.downloads.frameworkGitHub && (
              <div className="bg-ppt-dark2/50 border border-ppt-light1/20 rounded-lg p-6 hover:border-ppt-accent4/50 transition-all duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-ppt-light1 mb-2">
                      Framework Repository
                    </h2>
                    <p className="text-ppt-light1/80 mb-2">
                      Source code and implementation of the adaptive query-routing framework.
                    </p>
                    <p className="text-sm text-ppt-light1/60">
                      Includes the routing system, evaluation scripts, and documentation.
                    </p>
                  </div>
                  <DownloadButton
                    href={thesisContent.downloads.frameworkGitHub}
                    label="View on GitHub"
                    external={true}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-6 bg-ppt-dark2/30 border border-ppt-light1/10 rounded-lg">
            <h3 className="text-xl font-semibold text-ppt-light1 mb-3">
              Need Help?
            </h3>
            <p className="text-ppt-light1/80 mb-4">
              If you have questions about this research or would like to collaborate, please feel free to reach out.
            </p>
            <p className="text-ppt-light1/80">
              <a
                href={`mailto:${thesisContent.contact.email}`}
                className="text-ppt-accent4 hover:text-ppt-accent4/80 underline transition-colors"
              >
                {thesisContent.contact.email}
              </a>
            </p>
          </div>
        </div>
      </Section>
    </main>
  );
}

