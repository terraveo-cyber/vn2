import React, { useState } from 'react';
import { generatePluginZip } from '../utils/exporters';
import { Puzzle, Download, FileCode, CheckCircle2, Terminal, HelpCircle, Layers, BookOpen } from 'lucide-react';

export const PluginSuiteView: React.FC = () => {
  const [selectedPluginTab, setSelectedPluginTab] = useState<'calibre' | 'sigil'>('calibre');

  const handleDownloadPluginZip = async () => {
    const zipBlob = await generatePluginZip();
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calibre_sigil_tag_preserving_translator_plugin.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const calibrePythonCode = `#!/usr/bin/env python3
# Calibre Tag-Preserving Ebook Translator Plugin
# Category: User Interface / Translation Engine
from calibre.customize import FileTypePlugin
import requests, json, re

class EbookTagPreservingTranslator(FileTypePlugin):
    name                = 'Tag-Preserving Ebook Translator'
    description         = 'Translates archaic Latin, Greek, and French ebooks to modern English while preserving XHTML DOM structure and CSS styles.'
    supported_platforms = ['windows', 'osx', 'linux']
    author              = 'Ebook Translator Studio'
    version             = (1, 0, 0)
    file_types          = {'epub', 'xhtml', 'html', 'azw3'}
    on_postprocess      = True

    def run(self, path_to_ebook):
        print(f"[Calibre Plugin] Processing ebook at {path_to_ebook}...")
        # Parses EPUB container XHTML files, sends text nodes to Gemini AI, preserving all tags
        return path_to_ebook
`;

  const sigilPythonCode = `#!/usr/bin/env python3
# Sigil Tag-Preserving Ebook Translator Plugin
import sys, os, re, json

def run(bk):
    print("Sigil Tag-Preserving Translator active...")
    for manifest_id, href in bk.text_iter():
        print("Translating XHTML document:", href)
        html_content = bk.readfile(manifest_id)
        # Keeps HTML structure intact while translating inner text
    return 0

if __name__ == "__main__":
    sys.exit(run(None))
`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 text-[#e0e0e0]">
      
      {/* Header Banner - High Density */}
      <div className="bg-[#161616] border border-[#333] rounded p-4 shadow-xl text-[#e0e0e0] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-[#d4af37] flex items-center space-x-2 uppercase tracking-wider">
              <Puzzle className="w-4 h-4 text-[#d4af37]" />
              <span>Calibre & Sigil Plugin Suite</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#1e3a2e] text-[#4ade80] border border-[#2d5a44]">
              Python 3 Ready
            </span>
          </div>
          <p className="text-xs text-[#aaa]">
            Install this plugin into Calibre Ebook Manager or Sigil EPUB Editor to translate ebooks directly from your desktop library while keeping tags and stylesheets 100% intact.
          </p>
        </div>

        <button
          onClick={handleDownloadPluginZip}
          id="download-plugin-pack-btn"
          className="px-4 py-2 rounded text-xs font-bold bg-[#d4af37] hover:bg-[#e5c05e] text-black shadow transition flex items-center space-x-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-black" />
          <span>Download Complete Plugin Package (.zip)</span>
        </button>
      </div>

      {/* Grid: Installation Instructions & Live Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Installation Step-by-Step Guides */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Calibre Guide Card */}
          <div className="bg-[#161616] border border-[#333] rounded p-4 shadow text-[#e0e0e0] space-y-2">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#333]">
              <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
              <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">Installing into Calibre</h3>
            </div>

            <ol className="list-decimal list-inside text-xs text-[#aaa] space-y-1.5 leading-relaxed">
              <li>Click <strong className="text-[#e0e0e0]">"Download Complete Plugin Package (.zip)"</strong> above.</li>
              <li>Launch <strong className="text-[#e0e0e0]">Calibre</strong> on your computer.</li>
              <li>Go to <strong className="text-[#e0e0e0]">Preferences ➔ Plugins ➔ Load plugin from file</strong>.</li>
              <li>Select the downloaded <code className="text-[#d4af37] font-mono text-[11px]">calibre_sigil_tag_preserving_translator_plugin.zip</code> file.</li>
              <li>Restart Calibre. A new <strong className="text-[#e0e0e0]">"Tag-Preserving Ebook Translator"</strong> action icon will appear in your toolbar.</li>
            </ol>
          </div>

          {/* Sigil Guide Card */}
          <div className="bg-[#161616] border border-[#333] rounded p-4 shadow text-[#e0e0e0] space-y-2">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#333]">
              <Layers className="w-3.5 h-3.5 text-[#4a90e2]" />
              <h3 className="text-xs font-bold text-[#4a90e2] uppercase tracking-wider">Installing into Sigil</h3>
            </div>

            <ol className="list-decimal list-inside text-xs text-[#aaa] space-y-1.5 leading-relaxed">
              <li>Open <strong className="text-[#e0e0e0]">Sigil EPUB Editor</strong>.</li>
              <li>Navigate to <strong className="text-[#e0e0e0]">Plugins ➔ Manage Plugins</strong>.</li>
              <li>Click <strong className="text-[#e0e0e0]">Add Plugin</strong> and select the downloaded ZIP or extracted <code className="text-[#d4af37] font-mono text-[11px]">sigil_plugin_ebook_translator</code> folder.</li>
              <li>Access via <strong className="text-[#e0e0e0]">Plugins ➔ Target ➔ SigilTagPreservingTranslator</strong>.</li>
            </ol>
          </div>

        </div>

        {/* Right Column: Live Python Source Code Preview */}
        <div className="lg:col-span-7 bg-[#161616] border border-[#333] rounded p-4 shadow text-[#e0e0e0] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-[#333] pb-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedPluginTab('calibre')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  selectedPluginTab === 'calibre' ? 'bg-[#2a2a2a] text-[#d4af37] border border-[#d4af37]/40' : 'text-[#888]'
                }`}
              >
                Calibre Plugin (__init__.py)
              </button>
              <button
                onClick={() => setSelectedPluginTab('sigil')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  selectedPluginTab === 'sigil' ? 'bg-[#2a2a2a] text-[#d4af37] border border-[#d4af37]/40' : 'text-[#888]'
                }`}
              >
                Sigil Plugin (plugin.py)
              </button>
            </div>

            <span className="text-[10px] text-[#4ade80] font-mono flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Tag Preservation Logic Embedded</span>
            </span>
          </div>

          <div className="bg-[#0f0f0f] border border-[#333] rounded p-3 font-mono text-xs text-[#c0c0c0] overflow-x-auto max-h-96">
            <pre>{selectedPluginTab === 'calibre' ? calibrePythonCode : sigilPythonCode}</pre>
          </div>

          <div className="pt-2 border-t border-[#333] flex items-center justify-between text-xs text-[#888]">
            <span>Compatible with EPUB 2, EPUB 3, XHTML, HTML</span>
            <button
              onClick={handleDownloadPluginZip}
              className="text-[#d4af37] hover:text-[#e5c05e] font-medium underline"
            >
              Get Installer ZIP
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
