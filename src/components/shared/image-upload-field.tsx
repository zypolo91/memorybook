'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, Loader2, ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ImageUploadFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  description?: string;
  onChange: (value: string) => void;
  uploadAction: (file: File) => Promise<string>;
  className?: string;
};

export function ImageUploadField({
  label,
  value = '',
  placeholder,
  description,
  onChange,
  uploadAction,
  className
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAction(file);
      onChange(url);
    } catch (error) {
      console.error('upload failed', error);
      toast.error('图片上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        'border-border/60 bg-card/70 rounded-3xl border p-6 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='space-y-1.5'>
          <Label className='text-foreground text-sm font-semibold'>
            {label}
          </Label>
          {description ? (
            <p className='text-muted-foreground max-w-[30rem] text-xs leading-relaxed'>
              {description}
            </p>
          ) : null}
        </div>
        <div className='flex items-center gap-2'>
          {value ? (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='border-border/50 text-muted-foreground hover:border-destructive/50 hover:text-destructive rounded-full border px-3 transition-colors'
              onClick={() => onChange('')}
              disabled={uploading}
            >
              <Trash2 className='mr-1.5 h-3.5 w-3.5' />
              移除
            </Button>
          ) : null}
          <Button
            type='button'
            size='sm'
            className='bg-primary hover:bg-primary/90 rounded-full px-4 text-white shadow-md transition-colors disabled:opacity-70'
            onClick={handlePick}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className='mr-1.5 h-4 w-4 animate-spin' />
            ) : (
              <Upload className='mr-1.5 h-4 w-4' />
            )}
            上传图片
          </Button>
        </div>
      </div>

      <div className='mt-5 grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr]'>
        <div className='border-primary/40 bg-muted/30 relative overflow-hidden rounded-2xl border border-dashed shadow-inner'>
          <div className='relative aspect-[4/3] w-full'>
            {value ? (
              <Image
                src={value}
                alt='预览'
                fill
                className='object-cover'
                sizes='(max-width: 768px) 100vw, 260px'
              />
            ) : (
              <div className='text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-3'>
                <ImageIcon className='h-10 w-10' />
                <span className='text-sm'>暂无图片</span>
              </div>
            )}
            {uploading ? (
              <div className='bg-background/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm'>
                <Loader2 className='text-primary mr-2 h-5 w-5 animate-spin' />
                <span className='text-muted-foreground text-sm'>上传中...</span>
              </div>
            ) : null}
          </div>
        </div>
        <div className='space-y-3'>
          <Label className='text-muted-foreground text-[11px] font-semibold tracking-wide uppercase'>
            或使用图片链接
          </Label>
          <Input
            placeholder={placeholder || 'https://cdn.example.com/image.jpg'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className='border-border/50 bg-background/80 h-11 rounded-xl font-mono text-sm tracking-wide uppercase'
          />
          <p className='text-muted-foreground text-xs leading-relaxed'>
            支持 JPG、PNG、WebP 等常见格式，建议 1MB 以内。
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
      />
    </div>
  );
}
