'use client';
import {Button} from '@/components/ui/button';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="content-page"><h1>Något gick fel.</h1><p>Vi kunde inte ladda sidan. Försök igen om en stund.</p><Button onClick={reset}>Försök igen</Button></main>;}
