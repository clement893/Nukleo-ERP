/**
 * Font Installer Component
 * Allows installing Google Fonts and custom fonts for themes
 */

'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { Search, Upload, X, Check } from 'lucide-react';

interface GoogleFont {
  family: string;
  variants: string[];
  category: string;
}

interface FontInstallerProps {
  onFontSelect: (fontFamily: string, fontUrl?: string) => void;
  currentFont?: string;
}

export function FontInstaller({ onFontSelect, currentFont }: FontInstallerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFont, setSelectedFont] = useState<string | null>(currentFont || null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFontUrl, setUploadedFontUrl] = useState<string | null>(null);

  // Popular Google Fonts - Static list to avoid CSP issues
  // Users can still search and select fonts, and the font URL will be generated
  const popularFonts: GoogleFont[] = [
    { family: 'Inter', variants: ['400', '500', '600', '700'], category: 'sans-serif' },
    { family: 'Roboto', variants: ['300', '400', '500', '700'], category: 'sans-serif' },
    { family: 'Poppins', variants: ['400', '500', '600', '700'], category: 'sans-serif' },
    { family: 'Open Sans', variants: ['400', '600', '700'], category: 'sans-serif' },
    { family: 'Lato', variants: ['400', '700'], category: 'sans-serif' },
    { family: 'Montserrat', variants: ['400', '600', '700'], category: 'sans-serif' },
    { family: 'Raleway', variants: ['400', '600', '700'], category: 'sans-serif' },
    { family: 'Nunito', variants: ['400', '600', '700'], category: 'sans-serif' },
    { family: 'Source Sans Pro', variants: ['400', '600', '700'], category: 'sans-serif' },
    { family: 'Ubuntu', variants: ['400', '500', '700'], category: 'sans-serif' },
    { family: 'Oswald', variants: ['400', '600', '700'], category: 'sans-serif' },
    { family: 'Noto Sans', variants: ['400', '600', '700'], category: 'sans-serif' },
    { family: 'Roboto Condensed', variants: ['400', '700'], category: 'sans-serif' },
    { family: 'Playfair Display', variants: ['400', '700'], category: 'serif' },
    { family: 'Merriweather', variants: ['400', '700'], category: 'serif' },
    { family: 'Lora', variants: ['400', '600', '700'], category: 'serif' },
    { family: 'PT Serif', variants: ['400', '700'], category: 'serif' },
    { family: 'Crimson Text', variants: ['400', '600'], category: 'serif' },
    { family: 'Libre Baskerville', variants: ['400', '700'], category: 'serif' },
    { family: 'Dancing Script', variants: ['400', '600', '700'], category: 'handwriting' },
    { family: 'Pacifico', variants: ['400'], category: 'handwriting' },
    { family: 'Caveat', variants: ['400', '600', '700'], category: 'handwriting' },
    { family: 'Indie Flower', variants: ['400'], category: 'handwriting' },
    { family: 'Shadows Into Light', variants: ['400'], category: 'handwriting' },
    { family: 'Roboto Mono', variants: ['400', '500', '700'], category: 'monospace' },
    { family: 'Source Code Pro', variants: ['400', '600', '700'], category: 'monospace' },
    { family: 'Fira Code', variants: ['400', '500', '600', '700'], category: 'monospace' },
    { family: 'Courier Prime', variants: ['400', '700'], category: 'monospace' },
  ];

  useEffect(() => {
    // Use static list of popular fonts to avoid CSP issues
    // This avoids needing to call Google Fonts API from the client
    setGoogleFonts(popularFonts);
    setIsLoading(false);
  }, []);

  const filteredFonts = googleFonts.filter((font) =>
    font.family.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFontSelect = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    // Generate Google Fonts URL
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
    onFontSelect(fontFamily, fontUrl);
    
    // Load font dynamically
    loadGoogleFont(fontFamily, fontUrl);
  };

  const loadGoogleFont = (fontFamily: string, fontUrl: string) => {
    // Check if font is already loaded
    const existingLink = document.querySelector(`link[data-font="${fontFamily}"]`);
    if (existingLink) {
      return;
    }

    // Create link element to load Google Font
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    link.setAttribute('data-font', fontFamily);
    document.head.appendChild(link);
  };

  // Helper function to determine font format from filename
  const getFontFormat = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'woff':
        return 'woff';
      case 'woff2':
        return 'woff2';
      case 'ttf':
        return 'truetype';
      case 'otf':
        return 'opentype';
      default:
        return 'woff2'; // Default to woff2
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Rechercher une police..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowUpload(!showUpload)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Police personnalisée
        </Button>
      </div>

      {showUpload && (
        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="font-semibold">Uploader une police personnalisée</h4>
            <Input
              type="file"
              accept=".woff,.woff2,.ttf,.otf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setUploadError(null);
                setUploadingFont(true);
                setUploadedFontUrl(null);

                try {
                  // Validate file size (max 5MB for fonts)
                  const maxSize = 5 * 1024 * 1024; // 5MB
                  if (file.size > maxSize) {
                    throw new Error(`Le fichier est trop volumineux. Taille maximale: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
                  }

                  // Extract font name from filename
                  const fontName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Custom Font';

                  // Try to upload to backend first (if API supports font files)
                  let fontUrl: string;
                  try {
                    const { apiClient } = await import('@/lib/api');
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('folder', 'fonts');

                    const response = await apiClient.post<{
                      id: string;
                      filename: string;
                      url: string;
                      size: number;
                      content_type: string;
                    }>('/upload/file', formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data',
                      },
                    });

                    if (response.data?.url) {
                      fontUrl = response.data.url;
                      setUploadedFontUrl(fontUrl);
                    } else {
                      throw new Error('URL non reçue du serveur');
                    }
                  } catch (uploadError) {
                    // If backend upload fails, use blob URL as fallback
                    console.warn('Backend upload failed, using blob URL:', uploadError);
                    const blobUrl = URL.createObjectURL(file);
                    fontUrl = blobUrl;
                    setUploadedFontUrl(blobUrl);
                  }

                  // Create @font-face CSS
                  const fontFaceCSS = `
@font-face {
  font-family: '${fontName}';
  src: url('${fontUrl}') format('${getFontFormat(file.name)}');
  font-display: swap;
}`;

                  // Inject @font-face into document
                  const styleId = `font-face-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
                  let styleElement = document.getElementById(styleId);
                  if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.id = styleId;
                    document.head.appendChild(styleElement);
                  }
                  styleElement.textContent = fontFaceCSS;

                  // Notify parent component
                  onFontSelect(fontName, fontUrl);
                  setSelectedFont(fontName);
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload de la police';
                  setUploadError(errorMessage);
                  console.error('Font upload error:', error);
                } finally {
                  setUploadingFont(false);
                }
              }}
              disabled={uploadingFont}
            />
            {uploadingFont && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span>Upload en cours...</span>
              </div>
            )}
            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{uploadError}</p>
              </div>
            )}
            {uploadedFontUrl && selectedFont && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Police "{selectedFont}" uploadée avec succès
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1" style={{ fontFamily: selectedFont }}>
                  Aperçu: {selectedFont}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Formats supportés: WOFF, WOFF2, TTF, OTF (max 5MB)
            </p>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Chargement des polices...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {filteredFonts.map((font) => {
            const isSelected = selectedFont === font.family;
            return (
              <button
                key={font.family}
                onClick={() => handleFontSelect(font.family)}
                className={`
                  p-3 border rounded-lg text-left transition-all
                  ${isSelected 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold" style={{ fontFamily: font.family }}>
                      {font.family}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {font.category}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedFont && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-green-800 dark:text-green-200">
                Police sélectionnée: {selectedFont}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                La police sera appliquée au thème
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFont(null);
                onFontSelect('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

