import { useState, useRef } from 'react';
import { Upload, X, FileText, ImageIcon, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface FileUploaderProps {
  onUploadSuccess: (url: string) => void;
  currentUrl?: string;
  label: string;
  accept?: string;
  variant?: 'default' | 'avatar';
}

export const FileUploader = ({ 
  onUploadSuccess, 
  currentUrl, 
  label, 
  accept = "image/*,application/pdf",
  variant = 'default'
}: FileUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = data.data?.url || data.url;
      onUploadSuccess(url);
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
  const isPdf = (url: string) => /\.pdf$/i.test(url);

  // Helper para construir a URL completa se for relativa
  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return apiBase.replace('/api', '') + url;
  };

  if (variant === 'avatar') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-full flex flex-col items-center justify-center text-white"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="text-[10px] font-bold uppercase leading-tight text-center px-1">Clique para enviar</span>
          )}
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept={accept}
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground uppercase tracking-wider block font-medium">
        {label}
      </label>
      
      <div className="relative">
        {currentUrl ? (
          <div className="group relative rounded-xl border border-border bg-muted/30 overflow-hidden transition-all hover:border-primary/50">
            {isImage(currentUrl) ? (
              <img 
                src={getFullUrl(currentUrl)} 
                alt="Preview" 
                className="w-full h-40 object-cover"
              />
            ) : isPdf(currentUrl) ? (
              <div className="w-full h-40 flex flex-col items-center justify-center bg-muted/50 gap-2">
                <FileText className="h-10 w-10 text-primary" />
                <span className="text-xs font-medium">Documento PDF</span>
              </div>
            ) : (
              <div className="w-full h-40 flex flex-col items-center justify-center bg-muted/50 gap-2">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <span className="text-xs font-medium">Arquivo Anexado</span>
              </div>
            )}

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <a 
                href={getFullUrl(currentUrl)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Visualizar"
              >
                <FileText className="h-5 w-5" />
              </a>
              <button
                onClick={() => {
                  onUploadSuccess('');
                  toast.info('Arquivo removido. Clique em "Salvar Alterações" no fim da página para confirmar a exclusão.', { duration: 4000 });
                }}
                className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                title="Remover"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full bg-primary/20 hover:bg-primary/40 text-primary-foreground transition-colors"
                title="Trocar Arquivo"
              >
                <Upload className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-muted/30 hover:border-primary/50 transition-all group disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            )}
            <div className="text-center px-4">
              <p className="text-sm font-medium">{isUploading ? 'Enviando...' : 'Clique para enviar'}</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG ou SVG (Máx. 10MB)</p>
            </div>
          </button>
        )}
        
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept={accept}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
