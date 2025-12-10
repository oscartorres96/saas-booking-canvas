import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/utils/storage";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    businessId: string;
    className?: string;
}

export function ImageUpload({ value, onChange, businessId, className }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(value);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
            toast.error("Solo se permiten imágenes (JPG, PNG, GIF)");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("La imagen debe ser menor a 2MB");
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const token = getAccessToken();

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/businesses/${businessId}/logo`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            onChange(data.url);
            setPreview(data.url);
            toast.success("Logo subido correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al subir el logo");
            setPreview(value); // Revert preview
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        onChange("");
        setPreview(undefined);
    };

    return (
        <div className={cn("space-y-4", className)}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
            />

            {preview ? (
                <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 group shadow-sm transition-all hover:shadow-md">
                    <img src={preview} alt="Logo preview" className="w-full h-full object-cover bg-slate-50 dark:bg-slate-900" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full"
                            onClick={() => fileInputRef.current?.click()}
                            type="button"
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 rounded-full"
                            onClick={handleRemove}
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                    )}
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-40 h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center cursor-pointer gap-2 group"
                >
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5 text-slate-500 group-hover:text-primary" />}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Subir Logo</span>
                </div>
            )}
        </div>
    );
}
