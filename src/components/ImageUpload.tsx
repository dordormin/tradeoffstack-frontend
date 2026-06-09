import React, { useCallback, useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  defaultImage?: string;
  className?: string;
}

export function ImageUpload({ onUploadSuccess, onUploadError, folder = 'equipments', defaultImage, className = '' }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onUploadError?.('Veuillez sélectionner une image valide.');
      return;
    }

    setIsUploading(true);
    
    // Create local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléversement');
      }

      const data = await response.json();
      onUploadSuccess(data.image_url);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.('Une erreur est survenue lors de l\'envoi de l\'image.');
      setPreviewUrl(defaultImage || null); // revert on error
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const removeImage = () => {
    setPreviewUrl(null);
    onUploadSuccess(''); // Send empty string to clear the form field
  };

  return (
    <div className={`w-full ${className}`}>
      {previewUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-border group">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-48 object-cover transition-opacity group-hover:opacity-80"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <Button 
              type="button" 
              variant="destructive" 
              size="sm" 
              onClick={removeImage}
              className="rounded-full shadow-lg"
            >
              <X className="w-4 h-4 mr-2" />
              Retirer l'image
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-2 text-primary">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Téléversement en cours...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center w-full h-48 
            border-2 border-dashed rounded-lg cursor-pointer 
            transition-all duration-200 ease-in-out
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-border bg-card hover:bg-muted/50 hover:border-primary/50'
            }
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
            <div className={`
              p-3 mb-3 rounded-full 
              ${isDragging ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
              transition-colors duration-200
            `}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="mb-2 text-sm font-semibold">
              <span className="text-primary hover:underline">Cliquez pour ajouter</span> ou glissez-déposez
            </p>
            <p className="text-xs opacity-70">
              SVG, PNG, JPG ou GIF (MAX. 5MB)
            </p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileInput}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
