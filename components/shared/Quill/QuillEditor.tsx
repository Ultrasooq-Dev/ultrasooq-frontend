import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { Controller, useFormContext } from 'react-hook-form';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function QuillEditor({ label, name, }: { label: string; name: string; }) {
    const { langDir } = useAuth();
    const formContext = useFormContext();

    return (
        <div className="space-y-2" dir={langDir}>
            <label className="text-sm font-medium leading-none text-color-dark">
                {label}
            </label>
            <Controller
                control={formContext.control}
                name={name}
                defaultValue=""
                render={({ field }) => (
                    <ReactQuill
                        modules={{
                            toolbar: [
                                ['bold', 'italic', 'underline', 'strike'],
                                ['blockquote', 'code-block'],
                                ['link', 'image', 'video', 'formula'],
                                [{ 'header': 1 }, { 'header': 2 }],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
                                [{ 'script': 'sub' }, { 'script': 'super' }],
                                [{ 'indent': '-1' }, { 'indent': '+1' }],
                                [{ 'direction': 'rtl' }],
                                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                [{ 'color': [] }, { 'background': [] }],
                                [{ 'font': [] }],
                                [{ 'align': [] }],
                                ['clean'],
                                [{ 'direction': langDir || 'ltr' }]
                            ]
                        }}
                        onChange={field.onChange} value={field.value}
                    />
                )}
            />
        </div>
    )
}
