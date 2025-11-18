import React, { useState, useEffect } from 'react';
import { AspectRatio } from './types';
import { FileUpload } from './components/FileUpload';
import { StylePresetCard } from './components/StylePresetCard';
import { generateStyledPhotos, PRESETS } from './services/geminiService';
import { Icon } from './components/Icon';

const App: React.FC = () => {
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [referencePhoto, setReferencePhoto] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [numImages, setNumImages] = useState<number>(4);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [productPhotoUrl, setProductPhotoUrl] = useState<string | null>(null);
  const [referencePhotoUrl, setReferencePhotoUrl] = useState<string | null>(null);

  // Style mode state for the toggle (Preset vs Reference)
  const [styleMode, setStyleMode] = useState<'preset' | 'reference'>('preset');

  useEffect(() => {
    if (productPhoto) {
      const url = URL.createObjectURL(productPhoto);
      setProductPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setProductPhotoUrl(null);
  }, [productPhoto]);

  useEffect(() => {
    if (referencePhoto) {
      const url = URL.createObjectURL(referencePhoto);
      setReferencePhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setReferencePhotoUrl(null);
  }, [referencePhoto]);

  const handleSetReferencePhoto = (file: File | null) => {
    setReferencePhoto(file);
    if (file) {
        setSelectedPreset(null);
        // We don't necessarily force toggle here, handled by UI state usually, 
        // but ensures logic consistency.
    }
  };

  const handleSetSelectedPreset = (id: string) => {
    setSelectedPreset(id);
    // If selecting a preset, we can clear the reference photo logicwise
    // or just ignore it during generation. Clearing is safer for UI feedback.
    if (styleMode === 'preset') {
        setReferencePhoto(null);
    }
  };

  const handleGenerate = async () => {
    if (!productPhoto) {
      setError('Please upload a product photo first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setStatusMessage('Generating... please wait');

    try {
      const images = await generateStyledPhotos(
        productPhoto,
        styleMode === 'reference' ? referencePhoto : null,
        styleMode === 'preset' ? selectedPreset : null,
        aspectRatio,
        numImages,
        customPrompt
      );
      setGeneratedImages(images);
      setStatusMessage('Done! Here are your styled product photos.');
    } catch (err: any) {
      console.error(err);
      setError('Generation failed. Please try again with different inputs.');
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `styled-product-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    generatedImages.forEach((url, index) => {
      setTimeout(() => downloadImage(url, index), index * 500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">Studio Pocket</h1>
          <p className="text-slate-400 text-lg mt-1 font-medium">Shoot less. Create more.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN - Controls (Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Upload Photo */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                Upload Photo
              </h2>
              <div className="h-64">
                <FileUpload 
                    onFileSelect={setProductPhoto} 
                    previewUrl={productPhotoUrl} 
                    id="product-upload"
                    note="Main subject will be preserved"
                />
              </div>
            </div>

            {/* Select Style */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                Select Style
              </h2>

              {/* Style Mode Toggles */}
              <div className="flex bg-slate-950 rounded-xl p-1 mb-6 border border-slate-800">
                  <button 
                    onClick={() => setStyleMode('preset')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${styleMode === 'preset' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Style Presets
                  </button>
                  <button 
                    onClick={() => setStyleMode('reference')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${styleMode === 'reference' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Reference Image
                  </button>
              </div>

              {styleMode === 'preset' ? (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {PRESETS.map(preset => (
                        <StylePresetCard
                            key={preset.id}
                            preset={preset}
                            isSelected={selectedPreset === preset.id}
                            onSelect={handleSetSelectedPreset}
                            disabled={isLoading}
                        />
                    ))}
                  </div>
              ) : (
                  <div className="mb-6 h-48">
                      <FileUpload 
                        onFileSelect={handleSetReferencePhoto}
                        previewUrl={referencePhotoUrl}
                        id="ref-upload"
                        title=""
                        note="Upload a style reference"
                        compact={true}
                      />
                  </div>
              )}

              {/* Number of Photos Slider */}
              <div className="mt-2">
                 <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Number of Photos</span>
                    <span className="text-white font-medium">{numImages}</span>
                 </div>
                 <input 
                    type="range" 
                    min="2" 
                    max="6" 
                    value={numImages} 
                    onChange={(e) => setNumImages(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                 />
                 <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>2</span>
                    <span>6</span>
                 </div>
              </div>
            </div>

            {/* Customize & Rules */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white mb-4">Customize & Rules</h2>
                
                <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-none mb-4"
                    rows={2}
                    placeholder="Optional Prompt (e.g. soft lighting, dark background...)"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                />

                <div className="flex gap-2 mb-6">
                    {(['1:1', '4:5', '9:16', '16:9'] as AspectRatio[]).map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                aspectRatio === ratio 
                                ? 'bg-slate-800 border-slate-600 text-white' 
                                : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                            }`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !productPhoto}
                    className={`w-full py-4 rounded-2xl font-semibold text-white shadow-lg shadow-sky-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
                        ${isLoading || !productPhoto 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                            : 'bg-sky-600 hover:bg-sky-500 hover:shadow-sky-500/20'
                        }`}
                >
                    {isLoading ? (
                        <>
                            <Icon icon="spinner" className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Generate Photos
                        </>
                    )}
                </button>
                {error && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}
            </div>

          </div>

          {/* RIGHT COLUMN - Result (Span 7) */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-[600px]">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col h-full relative overflow-hidden">
                <h2 className="text-xl font-semibold text-white mb-6">Result</h2>
                
                {generatedImages.length > 0 ? (
                    <div className="flex-1 flex flex-col">
                        <div className={`grid gap-4 mb-6 flex-1 ${
                             generatedImages.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                             generatedImages.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                             'grid-cols-2 md:grid-cols-2'
                        } auto-rows-fr`}>
                            {generatedImages.map((img, idx) => (
                                <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/50">
                                    <img src={img} alt={`Result ${idx}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button 
                                            onClick={() => downloadImage(img, idx)}
                                            className="bg-white text-slate-900 p-3 rounded-full hover:scale-110 transition-transform"
                                            title="Download"
                                        >
                                            <Icon icon="download" className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-800">
                            <p className="text-slate-400 text-sm">{statusMessage}</p>
                            <button 
                                onClick={downloadAll}
                                className="text-sky-400 hover:text-sky-300 text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sky-500/10 transition-colors"
                            >
                                <Icon icon="download" className="w-4 h-4" />
                                Download All
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30 m-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center animate-pulse">
                                <div className="w-16 h-16 rounded-full bg-slate-800 mb-4"></div>
                                <div className="h-4 w-32 bg-slate-800 rounded mb-2"></div>
                                <div className="h-3 w-24 bg-slate-800 rounded"></div>
                            </div>
                        ) : (
                            <div className="text-slate-600">
                                <p className="text-lg font-medium mb-2">Your result will appear here.</p>
                                <p className="text-sm opacity-60">Upload a photo and select a style to start.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <footer className="mt-16 pb-8 text-center">
            <p className="text-slate-600 text-sm font-medium">© 2025 Senang AI</p>
        </footer>

      </div>
    </div>
  );
};

export default App;